// 日志监控系统

// 日志级别
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

// 当前日志级别
let currentLogLevel = LOG_LEVELS.INFO

// 日志记录器
const logger = {
  // 记录调试信息
  debug: (module, message, data = {}) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] [${module}] ${message}`, data)
    }
  },
  
  // 记录信息
  info: (module, message, data = {}) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(`[INFO] [${module}] ${message}`, data)
    }
  },
  
  // 记录警告
  warn: (module, message, data = {}) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] [${module}] ${message}`, data)
    }
  },
  
  // 记录错误
  error: (module, message, error = null) => {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      // 确保 error 是一个有效的对象
      const safeError = error ? error : 'Unknown error'
      console.error(`[ERROR] [${module}] ${message}`, safeError)
    }
  },
  
  // 记录页面加载性能
  recordPageLoad: () => {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing
      const loadTime = timing.loadEventEnd - timing.navigationStart
      logger.info('Performance', `Page loaded in ${loadTime}ms`)
    }
  }
}

// 跟踪API请求
const trackApiRequest = (endpoint, method, startTime, endTime, success, error) => {
  const duration = endTime - startTime
  const status = success ? 'success' : 'error'
  
  logger.info('API', `${method} ${endpoint}`, {
    status,
    duration: `${duration.toFixed(2)}ms`,
    error: error ? error.message : null
  })
}

// 设置全局错误监控
const setupGlobalErrorMonitor = () => {
  // 捕获全局错误
  window.onerror = (message, source, lineno, colno, error) => {
    logger.error('Global', 'Uncaught error', {
      message,
      source,
      lineno,
      colno,
      error: error ? error.message : null,
      stack: error ? error.stack : null
    })
    return false
  }
  
  // 捕获未处理的Promise拒绝
  window.onunhandledrejection = (event) => {
    logger.error('Global', 'Unhandled promise rejection', {
      reason: event.reason ? event.reason.message : null,
      stack: event.reason ? event.reason.stack : null
    })
  }
  
  // 监听资源加载错误
  window.addEventListener('error', (event) => {
    if (event.target instanceof Element) {
      logger.error('Resource', 'Resource load error', {
        tagName: event.target.tagName,
        src: event.target.src || event.target.href
      })
    }
  }, true)
}

export { setupGlobalErrorMonitor, logger, trackApiRequest }
