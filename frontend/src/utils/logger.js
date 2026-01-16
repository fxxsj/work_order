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
    }
    // TODO: 生产环境可以发送到日志服务（如 Sentry）
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
