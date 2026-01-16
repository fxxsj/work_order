/**
 * 统一错误处理器
 * 提供统一的错误处理和消息显示
 */
import { Message } from 'element-ui'

export class ErrorHandler {
  /**
   * 处理错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @returns {Object} 错误信息
   */
  static handle(error, context = '') {
    // 开发环境打印错误详情
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Error${context ? ` in ${context}` : ''}]`, error)
    }

    // 提取错误消息
    let message = '操作失败'
    if (error) {
      if (error.response?.data?.error) {
        message = error.response.data.error
      } else if (error.response?.data?.message) {
        message = error.response.data.message
      } else if (error.message) {
        message = error.message
      }
    }

    return {
      message,
      status: error.response?.status,
      code: error.code
    }
  }

  /**
   * 显示错误消息
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  static showMessage(error, context = '') {
    const { message } = this.handle(error, context)
    Message.error(message)
  }

  /**
   * 显示成功消息
   * @param {string} message - 消息内容
   */
  static showSuccess(message) {
    Message.success(message)
  }

  /**
   * 显示警告消息
   * @param {string} message - 消息内容
   */
  static showWarning(message) {
    Message.warning(message)
  }

  /**
   * 显示信息消息
   * @param {string} message - 消息内容
   */
  static showInfo(message) {
    Message.info(message)
  }
}

export default ErrorHandler
