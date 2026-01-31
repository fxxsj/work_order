/**
 * 统一错误处理器
 * 提供统一的错误处理和消息显示
 */
import { Message, MessageBox } from 'element-ui'

export class ErrorHandler {
  /**
   * 判断是否为任务冲突错误
   * @param {Object} error - 错误对象
   * @returns {Boolean}
   */
  static isConflictError(error) {
    if (!error) return false

    // 检查响应状态码
    if (error.response?.status === 409) {
      return true
    }

    // 检查错误代码
    if (error.response?.data?.code === 'task_conflict') {
      return true
    }

    return false
  }

  /**
   * 判断是否为权限错误
   * @param {Object} error - 错误对象
   * @returns {Boolean}
   */
  static isPermissionError(error) {
    if (!error) return false
    return error.response?.status === 403
  }

  /**
   * 处理任务分配/认领错误
   * @param {Object} error - 错误对象
   * @param {Object} options - 选项
   * @returns {Object} 处理后的错误信息
   */
  static handleTaskError(error, options = {}) {
    const { onConflict = null, onPermission = null, onOther = null } = options

    if (this.isConflictError(error)) {
      const conflictData = {
        type: 'conflict',
        message: error.response?.data?.detail || '该任务正在被其他用户操作',
        currentOwner: error.response?.data?.current_owner,
        taskId: error.response?.data?.task_id,
        retry: error.response?.data?.retry
      }

      if (onConflict) {
        onConflict(conflictData)
      } else {
        this.showConflictMessage(conflictData)
      }

      return conflictData
    }

    if (this.isPermissionError(error)) {
      const permData = {
        type: 'permission',
        message: error.response?.data?.detail || '您没有权限执行此操作'
      }

      if (onPermission) {
        onPermission(permData)
      } else {
        this.showMessage(permData.message, 'error')
      }

      return permData
    }

    // 其他错误
    const otherData = {
      type: 'other',
      message: error.response?.data?.detail || error.message || '操作失败'
    }

    if (onOther) {
      onOther(otherData)
    } else {
      this.showMessage(otherData.message, 'error')
    }

    return otherData
  }

  /**
   * 显示冲突错误消息（带重试选项）
   * @param {Object} conflictData - 冲突数据
   */
  static showConflictMessage(conflictData) {
    // 使用 Element UI 的 MessageBox 显示冲突和重试选项
    const { currentOwner, retry } = conflictData

    let message = conflictData.message
    if (currentOwner) {
      message += `\n\n当前操作人：${currentOwner}`
    }

    // 显示确认对话框
    MessageBox.confirm(message, '任务冲突', {
      confirmButtonText: retry?.action_text || '刷新页面',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 用户点击重试 - 刷新页面
      location.reload()
    }).catch(() => {
      // 用户取消
    })
  }

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
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail
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

  /**
   * 处理验证错误（表单验证）
   * @param {Error} error - 错误对象
   * @param {Object} formRef - 表单引用（可选）
   * @returns {Object} 错误字段映射
   */
  static handleValidationError(error, formRef = null) {
    const errors = {}

    if (error.response?.data) {
      const data = error.response.data

      // 处理 DRF 验证错误格式
      if (typeof data === 'object') {
        for (const [field, messages] of Object.entries(data)) {
          if (Array.isArray(messages)) {
            errors[field] = messages.join(', ')
          } else if (typeof messages === 'string') {
            errors[field] = messages
          }
        }
      }

      // 设置表单错误
      if (formRef && typeof formRef.setFields === 'function') {
        const formErrors = {}
        for (const [field, message] of Object.entries(errors)) {
          formErrors[field] = [{ message, field }]
        }
        formRef.setFields(formErrors)
      }
    }

    return errors
  }

  /**
   * 显示确认对话框
   * @param {string} message - 确认消息
   * @param {string} title - 对话框标题
   * @param {Object} options - MessageBox 选项
   * @returns {Promise<boolean>} 用户是否确认
   */
  static confirm(message, title = '确认操作', options = {}) {
    const defaultOptions = {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }

    return MessageBox.confirm(message, title, { ...defaultOptions, ...options })
      .then(() => true)
      .catch(() => false)
  }

  /**
   * 包装异步函数，添加确认对话框
   * @param {Function} asyncFn - 异步函数
   * @param {string} message - 确认消息
   * @param {string} title - 对话框标题
   * @returns {Promise} 执行结果
   */
  static async withConfirm(asyncFn, message, title = '确认操作') {
    const confirmed = await this.confirm(message, title)
    if (!confirmed) {
      throw new Error('cancel')
    }
    return asyncFn()
  }

  /**
   * 包装异步函数，自动处理错误和加载状态
   * @param {Function} asyncFn - 异步函数
   * @param {Object} options - 选项
   * @returns {Promise} 执行结果
   */
  static async withErrorHandling(asyncFn, options = {}) {
    const {
      loadingRef = null,
      successMessage = '操作成功',
      errorMessage = '操作失败',
      showSuccess = true,
      context = ''
    } = options

    try {
      if (loadingRef) {
        loadingRef.value = true
      }

      const result = await asyncFn()

      if (showSuccess) {
        this.showSuccess(successMessage)
      }

      return result
    } catch (error) {
      if (error.message === 'cancel') {
        throw error
      }

      this.showMessage(error, context || errorMessage)
      throw error
    } finally {
      if (loadingRef) {
        loadingRef.value = false
      }
    }
  }
}

export default ErrorHandler
