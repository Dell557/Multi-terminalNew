/**
 * 飞书 API 调用工具类
 * 注意：在前端直接暴露 APP_ID 和 APP_SECRET 存在极高的安全风险。
 * 生产环境请务必将此逻辑迁移到后端服务（Node.js/Python/Go等）。
 * 本文件仅用于本地开发和演示。
 */

// 替换为你的飞书自建应用凭证
const APP_ID = 'cli_a7aa3ac884b9d00c'; // 已填入您提供的 App ID
const APP_SECRET = 'npSXP56jD2kT0PgPl7DfkfjNxmwtLPuh'; // ⚠️ 请在此填入 App Secret (在飞书开发者后台查看)

// 缓存 Access Token
let accessToken = '';
let tokenExpireTime = 0;

export const isConfigured = () => {
  return APP_ID && APP_SECRET && APP_SECRET !== 'YOUR_APP_SECRET';
};

/**
 * 获取 Tenant Access Token
 */
async function getAccessToken() {
  if (!isConfigured()) {
    throw new Error('请在 src/utils/feishu.js 中配置正确的 APP_SECRET');
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
      throw new Error(data.msg);
    }
  } catch (error) {
    console.error('网络请求失败:', error);
    throw error;
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
        throw new Error(`HTTP Error ${response.status}`);
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
        throw new Error(data.msg);
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
    throw error;
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
      throw new Error(`HTTP Error ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 0) {
      return data.data.record;
    } else {
      console.error('获取记录失败:', data);
      throw new Error(data.msg);
    }
  } catch (error) {
    console.error('API 调用异常:', error);
    throw error;
  }
}
