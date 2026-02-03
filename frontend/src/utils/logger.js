/**
 * 统一日志工具
 * 提供统一的日志记录功能
 */
const logger = {
  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Error} error - 错误对象
   */
  error(message, error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error)
    } else {
      // 生产环境：收集错误日志
      this.collectErrorLog(message, error)
    }
  },

  /**
   * 生产环境收集错误日志
   * @param {string} message - 日志消息
   * @param {Error} error - 错误对象
   */
  collectErrorLog(message, error) {
    // 可以扩展为发送到日志服务（如 Sentry）
    // 暂时保存到本地存储
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]')
      logs.push({
        timestamp: new Date().toISOString(),
        message,
        error: error?.message || String(error),
        stack: error?.stack
      })
      // 只保留最近 50 条
      if (logs.length > 50) {
        logs.shift()
      }
      localStorage.setItem('error_logs', JSON.stringify(logs))
    } catch (e) {
      // 忽略存储错误
    }
  },

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {*} data - 附加数据
   */
  warn(message, data) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, data)
    }
  },

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {*} data - 附加数据
   */
  info(message, data) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, data)
    }
  },

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {*} data - 附加数据
   */
  debug(message, data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data)
    }
  }
}

export default logger
