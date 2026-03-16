/**
 * 飞书 API 调用工具类
 * 注意：在前端直接暴露 APP_ID 和 APP_SECRET 存在极高的安全风险。
 * 生产环境请务必将此逻辑迁移到后端服务（Node.js/Python/Go等）。
 * 本文件仅用于本地开发和演示。
 */

// 替换为你的飞书自建应用凭证（优先读取环境变量）
const APP_ID = import.meta.env.VITE_FEISHU_APP_ID || '';
const APP_SECRET = import.meta.env.VITE_FEISHU_APP_SECRET || '';

// 缓存 Access Token
let accessToken = '';
let tokenExpireTime = 0;

// 错误消息映射（用户友好）
const errorMessages = {
  CONFIG_MISSING: '未配置飞书凭证：请在环境变量中设置 VITE_FEISHU_APP_ID 与 VITE_FEISHU_APP_SECRET',
  NETWORK_ERROR: '网络连接失败，请检查您的网络环境',
  TOKEN_EXPIRED: '登录已过期，正在重新获取...',
  SERVER_ERROR: '服务器繁忙，请稍后再试',
  NOT_FOUND: '数据未找到',
  PERMISSION_DENIED: '没有访问权限，请检查配置',
  UNKNOWN_ERROR: '发生未知错误，请稍后重试'
};

// 获取用户友好的错误消息
export const getFriendlyError = (error) => {
  const message = error?.message || String(error) || '';

  if (message.includes('未配置飞书凭证') || message.includes('APP_ID') || message.includes('APP_SECRET')) {
    return { ...error, friendlyMessage: errorMessages.CONFIG_MISSING, type: 'config' };
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('net::')) {
    return { ...error, friendlyMessage: errorMessages.NETWORK_ERROR, type: 'network' };
  }
  if (message.includes('401') || message.includes('token') || message.includes('expired')) {
    return { ...error, friendlyMessage: errorMessages.TOKEN_EXPIRED, type: 'auth' };
  }
  if (message.includes('403') || message.includes('permission') || message.includes('权限')) {
    return { ...error, friendlyMessage: errorMessages.PERMISSION_DENIED, type: 'permission' };
  }
  if (message.includes('404') || message.includes('not found') || message.includes('NOT_FOUND')) {
    return { ...error, friendlyMessage: errorMessages.NOT_FOUND, type: 'not_found' };
  }
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('server')) {
    return { ...error, friendlyMessage: errorMessages.SERVER_ERROR, type: 'server' };
  }

  return { ...error, friendlyMessage: message || errorMessages.UNKNOWN_ERROR, type: 'unknown' };
};

export const isConfigured = () => {
  return Boolean(APP_ID && APP_SECRET);
};

export const getErrorMessages = () => errorMessages;

/**
 * 获取 Tenant Access Token
 */
async function getAccessToken() {
  if (!isConfigured()) {
    const err = new Error(errorMessages.CONFIG_MISSING);
    throw getFriendlyError(err);
  }

  const now = Date.now() / 1000;
  if (accessToken && now < tokenExpireTime) {
    return accessToken;
  }

  try {
    // 使用 vite.config.js 中配置的代理 /feishu-api 转发到 https://open.feishu.cn/open-apis
    const response = await fetch('/feishu-api/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        "app_id": APP_ID,
        "app_secret": APP_SECRET
      })
    });

    const data = await response.json();
    if (data.code === 0) {
      accessToken = data.tenant_access_token;
      tokenExpireTime = now + data.expire - 60; // 提前60秒过期
      return accessToken;
    } else {
      console.error('获取飞书 Token 失败:', data);
      const err = new Error(data.msg || '获取令牌失败');
      throw getFriendlyError(err);
    }
  } catch (error) {
    console.error('网络请求失败:', error);
    if (error.type) throw error; // 已经是友好错误
    throw getFriendlyError(error);
  }
}

/**
 * 搜索多维表格记录
 * 文档: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/search
 * @param {string} appToken 多维表格的 app_token (链接中 base/ 后面那串)
 * @param {string} tableId 数据表的 table_id
 * @param {object} conditions 查询条件
 */
export async function searchRecords(appToken, tableId, conditions = {}) {
  try {
    console.log(`[Feishu] searchRecords called with: appToken=${appToken}, tableId=${tableId}`);
    const token = await getAccessToken();

    let allItems = [];
    let pageToken = conditions.page_token;
    let hasMore = true;

    // 如果传入了 page_token，说明是手动分页，只请求一次
    const isManualPagination = !!conditions.page_token;
    const pageSize = conditions.page_size || 20; // 降低默认页大小以提高稳定性

    do {
      // 构建请求体
      const body = {
        view_id: conditions.view_id,
        field_names: conditions.field_names,
        filter: conditions.filter,
        sort: conditions.sort,
        page_size: pageSize,
        page_token: pageToken
      };

      const url = `/feishu-api/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`;
      console.log(`[Feishu] Fetching: ${url}, pageToken=${pageToken}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        console.error(`[Feishu] HTTP Error: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error(`[Feishu] Response body: ${text}`);
        const err = new Error(`HTTP Error ${response.status}`);
        throw getFriendlyError(err);
      }

      const data = await response.json();
      if (data.code === 0) {
        const result = data.data;
        if (result.items) {
          console.log(`[Feishu] Fetched ${result.items.length} items`);
          allItems = allItems.concat(result.items);
        } else {
          console.log(`[Feishu] No items in this page`);
        }

        // 如果是手动分页，直接返回结果
        if (isManualPagination) {
          return result;
        }

        hasMore = result.has_more;
        pageToken = result.page_token;
      } else {
        console.error('查询多维表格失败:', data);
        const err = new Error(data.msg || '查询数据失败');
        throw getFriendlyError(err);
      }
    } while (hasMore);

    console.log(`[Feishu] Total items fetched: ${allItems.length}`);
    return {
      items: allItems,
      total: allItems.length,
      has_more: false
    };

  } catch (error) {
    console.error('API 调用异常:', error);
    if (error.type) throw error;
    throw getFriendlyError(error);
  }
}

/**
 * 获取单条记录
 * @param {string} appToken 多维表格的 app_token
 * @param {string} tableId 数据表的 table_id
 * @param {string} recordId 记录的 record_id
 */
export async function getRecord(appToken, tableId, recordId) {
  try {
    console.log(`[Feishu] getRecord called with: appToken=${appToken}, tableId=${tableId}, recordId=${recordId}`);
    const token = await getAccessToken();

    const url = `/feishu-api/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`;
    console.log(`[Feishu] Fetching: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

    if (!response.ok) {
      console.error(`[Feishu] HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`[Feishu] Response body: ${text}`);
      const err = new Error(`HTTP Error ${response.status}`);
      throw getFriendlyError(err);
    }

    const data = await response.json();
    if (data.code === 0) {
      return data.data.record;
    } else {
      console.error('获取记录失败:', data);
      const err = new Error(data.msg || '获取记录失败');
      throw getFriendlyError(err);
    }
  } catch (error) {
    console.error('API 调用异常:', error);
    if (error.type) throw error;
    throw getFriendlyError(error);
  }
}

/**
 * 更新记录
 * @param {string} appToken 多维表格的 app_token
 * @param {string} tableId 数据表的 table_id
 * @param {string} recordId 记录的 record_id
 * @param {object} fields 更新的字段内容
 */
export async function updateRecord(appToken, tableId, recordId, fields) {
  try {
    console.log(`[Feishu] updateRecord called with: appToken=${appToken}, tableId=${tableId}, recordId=${recordId}`);
    const token = await getAccessToken();

    const url = `/feishu-api/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`;
    console.log(`[Feishu] Updating: ${url}`);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        fields: fields
      })
    });

    if (!response.ok) {
      console.error(`[Feishu] HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`[Feishu] Response body: ${text}`);
      const err = new Error(`HTTP Error ${response.status}`);
      throw getFriendlyError(err);
    }

    const data = await response.json();
    if (data.code === 0) {
      console.log('[Feishu] Update success');
      return data.data.record;
    } else {
      console.error('更新记录失败:', data);
      const err = new Error(data.msg || '更新记录失败');
      throw getFriendlyError(err);
    }
  } catch (error) {
    console.error('API 调用异常:', error);
    if (error.type) throw error;
    throw getFriendlyError(error);
  }
}
