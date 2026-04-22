/**
 * 前端监控日志工具
 * 用于记录性能指标、错误信息和用户行为
 */

// 日志级别
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

// 当前日志级别（可通过环境变量控制）
const CURRENT_LOG_LEVEL = LOG_LEVELS[import.meta.env.VITE_LOG_LEVEL || 'INFO'] || LOG_LEVELS.INFO

// 日志前缀
const LOG_PREFIX = {
  DEBUG: '[DEBUG]',
  INFO: '[INFO]',
  WARN: '[WARN]',
  ERROR: '[ERROR]'
}

// 日志颜色
const LOG_COLORS = {
  DEBUG: '#9ca3af',
  INFO: '#3b82f6',
  WARN: '#f59e0b',
  ERROR: '#ef4444'
}

/**
 * 格式化日志消息
 */
const formatMessage = (level, module, message, data = {}) => {
  const timestamp = new Date().toISOString()
  return {
    timestamp,
    level,
    module,
    message,
    data,
    userAgent: navigator.userAgent,
    url: window.location.href,
    performance: {
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      } : null
    }
  }
}

/**
 * 打印日志到控制台
 */
const printLog = (level, logObject) => {
  if (LOG_LEVELS[level] < CURRENT_LOG_LEVEL) return

  const color = LOG_COLORS[level]
  const prefix = LOG_PREFIX[level]
  
  console.log(
    `%c${prefix} ${logObject.module}`,
    `color: ${color}; font-weight: bold;`,
    logObject.message,
    logObject.data
  )
}

/**
 * 发送日志到后端（可选，用于生产环境监控）
 */
const sendToServer = async (logObject) => {
  // 生产环境可以启用
  if (import.meta.env.PROD && import.meta.env.VITE_LOG_SERVER_URL) {
    try {
      await fetch(import.meta.env.VITE_LOG_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logObject),
        keepalive: true
      })
    } catch (e) {
      // 日志上报失败，静默处理
    }
  }
}

/**
 * 日志工具类
 */
export const logger = {
  /**
   * 调试日志
   */
  debug(module, message, data = {}) {
    const logObject = formatMessage('DEBUG', module, message, data)
    printLog('DEBUG', logObject)
  },

  /**
   * 信息日志
   */
  info(module, message, data = {}) {
    const logObject = formatMessage('INFO', module, message, data)
    printLog('INFO', logObject)
    sendToServer(logObject)
  },

  /**
   * 警告日志
   */
  warn(module, message, data = {}) {
    const logObject = formatMessage('WARN', module, message, data)
    printLog('WARN', logObject)
    sendToServer(logObject)
  },

  /**
   * 错误日志
   */
  error(module, message, error, data = {}) {
    const logObject = formatMessage('ERROR', module, message, {
      ...data,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      }
    })
    printLog('ERROR', logObject)
    sendToServer(logObject)
  },

  /**
   * 性能监控开始
   */
  performanceStart(module, action) {
    const key = `${module}:${action}`
    const startTime = performance.now()
    performanceMarkMap.set(key, startTime)
    this.debug(module, `Performance start: ${action}`, { startTime })
  },

  /**
   * 性能监控结束
   */
  performanceEnd(module, action, extraData = {}) {
    const key = `${module}:${action}`
    const startTime = performanceMarkMap.get(key)
    
    if (!startTime) {
      this.warn(module, `Performance end without start: ${action}`)
      return
    }

    const duration = performance.now() - startTime
    const logObject = formatMessage('INFO', module, `Performance: ${action}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...extraData
    })
    
    printLog('INFO', logObject)
    sendToServer(logObject)
    
    // 清除标记
    performanceMarkMap.delete(key)
    
    return duration
  },

  /**
   * 记录页面加载性能
   */
  recordPageLoad() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing
      const navigationStart = timing.navigationStart
      
      const metrics = {
        domReady: timing.domContentLoadedEventEnd - navigationStart,
        pageLoad: timing.loadEventEnd - navigationStart,
        firstPaint: performance.getEntriesByType('paint')
          .filter(entry => entry.name === 'first-contentful-paint')[0]?.startTime || null,
        resourceCount: performance.getEntriesByType('resource').length,
        errorCount: errorCount
      }

      this.info('Performance', 'Page load metrics', metrics)
      return metrics
    }
    return null
  }
}

// 内部状态
const performanceMarkMap = new Map()
let errorCount = 0

/**
 * 全局错误监控
 */
export const setupGlobalErrorMonitor = () => {
  // 监听全局错误
  window.addEventListener('error', (event) => {
    errorCount++
    logger.error('Global', 'Uncaught error', event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  // 监听 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    errorCount++
    logger.error('Global', 'Unhandled promise rejection', event.reason || new Error('Unknown rejection'), {
      reason: String(event.reason)
    })
  })

  // 监听资源加载错误
  window.addEventListener('error', (event) => {
    if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT')) {
      logger.error('Resource', 'Resource load failed', null, {
        src: event.target.src || event.target.href,
        tagName: event.target.tagName
      })
    }
  }, true)

  logger.info('Logger', 'Global error monitor setup complete')
}

/**
 * 记录 API 请求性能
 */
export const trackApiRequest = async (module, url, options = {}) => {
  const startTime = performance.now()
  const controller = new AbortController()
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    
    const duration = performance.now() - startTime
    
    logger.info(module, `API Request: ${url}`, {
      method: options.method || 'GET',
      status: response.status,
      duration: `${duration.toFixed(2)}ms`,
      url
    })
    
    return response
  } catch (error) {
    const duration = performance.now() - startTime
    
    logger.error(module, `API Request failed: ${url}`, error, {
      method: options.method || 'GET',
      duration: `${duration.toFixed(2)}ms`,
      url
    })
    
    throw error
  }
}

export default logger
