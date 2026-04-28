// 飞书 API 工具函数

// 检查飞书配置是否已完成
export function isConfigured() {
  return !!(import.meta.env.VITE_FEISHU_APP_ID && import.meta.env.VITE_FEISHU_APP_SECRET)
}

// 检查多维表格配置是否已完成
export function isBitableConfigured() {
  return !!(import.meta.env.VITE_FEISHU_APP_TOKEN && import.meta.env.VITE_FEISHU_TABLE_ID)
}

// 获取多维表格配置
export function getBitableConfig() {
  return {
    appToken: import.meta.env.VITE_FEISHU_APP_TOKEN || '',
    tableId: import.meta.env.VITE_FEISHU_TABLE_ID || ''
  }
}

// 获取友好的错误消息
export function getFriendlyError(error) {
  if (!error) {
    return { friendlyMessage: '未知错误' }
  }
  
  if (error.message) {
    if (error.message.includes('401')) {
      return { friendlyMessage: '认证失败，请检查飞书应用配置' }
    }
    if (error.message.includes('403')) {
      return { friendlyMessage: '权限不足，请检查飞书应用权限' }
    }
    if (error.message.includes('404')) {
      return { friendlyMessage: '资源不存在，请检查表格ID是否正确' }
    }
    if (error.message.includes('timeout')) {
      return { friendlyMessage: '请求超时，请检查网络连接' }
    }
    return { friendlyMessage: error.message }
  }
  
  return { friendlyMessage: '未知错误' }
}

// 搜索飞书表格记录
export async function searchRecords(appToken, tableId, options = {}) {
  try {
    // 这里应该是实际的飞书 API 调用
    // 由于是模拟环境，返回空数据
    return {
      items: []
    }
  } catch (error) {
    console.error('飞书 API 调用失败:', error)
    throw error
  }
}

// 获取单条记录
export async function getRecord(appToken, tableId, recordId) {
  try {
    // 这里应该是实际的飞书 API 调用
    // 由于是模拟环境，返回空数据
    return null
  } catch (error) {
    console.error('获取飞书记录失败:', error)
    throw error
  }
}

// 更新记录
export async function updateRecord(appToken, tableId, recordId, fields) {
  try {
    // 这里应该是实际的飞书 API 调用
    // 由于是模拟环境，返回成功
    return { success: true }
  } catch (error) {
    console.error('更新飞书记录失败:', error)
    throw error
  }
}
