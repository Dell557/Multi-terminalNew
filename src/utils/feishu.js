/**
 * 飞书 API 调用工具类
 * 注意：在前端直接暴露 APP_ID 和 APP_SECRET 存在极高安全风险。
 * 生产环境请务必将此逻辑迁移到后端服务（Node.js/Python/Go 等）。
 * 本文件仅用于本地开发和演示。
 */

import { logger } from './logger'

// 替换为自己的飞书自建应用凭证（优先读取环境变量）
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

export const getBitableConfig = () => {
  return {
    appToken: import.meta.env.VITE_FEISHU_APP_TOKEN || '',
    tableId: import.meta.env.VITE_FEISHU_TABLE_ID || ''
  };
};

export const isBitableConfigured = () => {
  const { appToken, tableId } = getBitableConfig();
  return Boolean(appToken && tableId);
};

export const getErrorMessages = () => errorMessages;

/**
 * 获取 Tenant Access Token
 */
async function getAccessToken() {
  const startTime = performance.now()
  
  if (!isConfigured()) {
    const err = new Error(errorMessages.CONFIG_MISSING);
    logger.error('Feishu', 'Configuration missing', err)
    throw getFriendlyError(err);
  }

  const now = Date.now() / 1000;
  if (accessToken && now < tokenExpireTime) {
    logger.debug('Feishu', 'Using cached access token')
    return accessToken;
  }

  try {
    logger.info('Feishu', 'Requesting access token')
    
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

    const duration = performance.now() - startTime
    const data = await response.json();
    
    if (data.code === 0) {
      accessToken = data.tenant_access_token;
      tokenExpireTime = now + data.expire - 60; // 提前 60 秒过期
      logger.info('Feishu', 'Access token obtained', {
        duration: `${duration.toFixed(2)}ms`,
        expiresIn: data.expire
      })
      return accessToken;
    } else {
      logger.error('Feishu', 'Failed to get access token', null, {
        code: data.code,
        msg: data.msg,
        duration: `${duration.toFixed(2)}ms`
      })
      const err = new Error(data.msg || '获取令牌失败');
      throw getFriendlyError(err);
    }
  } catch (error) {
    const duration = performance.now() - startTime
    logger.error('Feishu', 'Network request failed', error, {
      duration: `${duration.toFixed(2)}ms`
    })
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
  const startTime = performance.now()
  logger.info('Feishu', 'searchRecords called', { 
    appToken: appToken ? `${appToken.substring(0, 10)}...` : 'missing',
    tableId: tableId || 'missing',
    conditions 
  })
  
  try {
    const token = await getAccessToken();

    let allItems = [];
    let pageToken = conditions.page_token;
    let hasMore = true;
    let requestCount = 0;

    // 如果传入了 page_token，说明是手动分页，只请求一次
    const isManualPagination = !!conditions.page_token;
    const pageSize = conditions.page_size || 20; // 降低默认页大小以提高稳定性

    do {
      requestCount++
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
      logger.debug('Feishu', `Fetching page ${requestCount}`, { url, pageToken })

      const responseStart = performance.now()
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(body)
      });
      const responseDuration = performance.now() - responseStart

      if (!response.ok) {
        logger.error('Feishu', `HTTP Error: ${response.status}`, null, {
          status: response.status,
          statusText: response.statusText,
          duration: `${responseDuration.toFixed(2)}ms`
        })
        const text = await response.text();
        logger.error('Feishu', 'Error response body', null, { body: text.substring(0, 500) })
        const err = new Error(`HTTP Error ${response.status}`);
        throw getFriendlyError(err);
      }

      const data = await response.json();
      if (data.code === 0) {
        const result = data.data;
        if (result.items) {
          logger.debug('Feishu', `Page ${requestCount}: fetched ${result.items.length} items`, {
            duration: `${responseDuration.toFixed(2)}ms`
          })
          allItems = allItems.concat(result.items);
        } else {
          logger.debug('Feishu', `Page ${requestCount}: no items`)
        }

        // 如果是手动分页，直接返回结果
        if (isManualPagination) {
          logger.info('Feishu', 'Manual pagination, returning single page result', {
            count: result.items?.length || 0
          })
          return result;
        }

        hasMore = result.has_more;
        pageToken = result.page_token;
      } else {
        logger.error('Feishu', 'Query failed', null, {
          code: data.code,
          msg: data.msg
        })
        const err = new Error(data.msg || '查询数据失败');
        throw getFriendlyError(err);
      }
    } while (hasMore);

    const totalDuration = performance.now() - startTime
    logger.info('Feishu', 'searchRecords completed', {
      totalItems: allItems.length,
      totalPages: requestCount,
      duration: `${totalDuration.toFixed(2)}ms`
    })
    
    return {
      items: allItems,
      total: allItems.length,
      has_more: false
    };

  } catch (error) {
    const totalDuration = performance.now() - startTime
    logger.error('Feishu', 'searchRecords failed', error, {
      duration: `${totalDuration.toFixed(2)}ms`,
      appToken,
      tableId
    })
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
