/**
 * 表单验证服务
 *
 * 提供统一的表单验证逻辑，避免在各个组件中重复编写验证代码
 */

/**
 * 表单验证服务类
 */
class FormValidationService {
  constructor() {
    this._errors = {}
  }

  /**
   * 验证必填字段
   * @param {*} value - 字段值
   * @param {string} fieldName - 字段名称
   * @returns {Object} 验证结果 { valid: boolean, message: string }
   */
  required(value, fieldName = '该字段') {
    if (value === null || value === undefined || value === '') {
      const message = `${fieldName}不能为空`
      this._errors[fieldName] = message
      return {
        valid: false,
        message
      }
    }

    if (Array.isArray(value) && value.length === 0) {
      const message = `${fieldName}不能为空`
      this._errors[fieldName] = message
      return {
        valid: false,
        message
      }
    }

    return { valid: true }
  }

  /**
   * 验证数字范围
   * @param {number} value - 数字值
   * @param {Object} options - 选项 { min, minInclusive, max, maxInclusive }
   * @returns {Object} 验证结果
   */
  numberRange(value, options = {}) {
    const {
      min,
      minInclusive = true,
      max,
      maxInclusive = true
    } = options

    if (typeof value !== 'number' || isNaN(value)) {
      const message = '请输入有效的数字'
      this._errors.value = message
      return {
        valid: false,
        message
      }
    }

    if (min !== undefined) {
      if (minInclusive && value < min) {
        const message = `不能小于 ${min}`
        this._errors.value = message
        return {
          valid: false,
          message
        }
      }
      if (!minInclusive && value <= min) {
        const message = `必须大于 ${min}`
        this._errors.value = message
        return {
          valid: false,
          message
        }
      }
    }

    if (max !== undefined) {
      if (maxInclusive && value > max) {
        const message = `不能大于 ${max}`
        this._errors.value = message
        return {
          valid: false,
          message
        }
      }
      if (!maxInclusive && value >= max) {
        const message = `必须小于 ${max}`
        this._errors.value = message
        return {
          valid: false,
          message
        }
      }
    }

    return { valid: true }
  }

  /**
   * 验证字符串长度
   * @param {string} value - 字符串值
   * @param {Object} options - 选项 { min, max }
   * @returns {Object} 验证结果
   */
  stringLength(value, options = {}) {
    const { min, max } = options

    // 将非字符串值转换为字符串
    let strValue = value
    if (typeof value !== 'string') {
      strValue = String(value)
    }

    const length = strValue.trim().length

    if (min !== undefined && length < min) {
      return {
        valid: false,
        message: `长度不能少于 ${min} 个字符`
      }
    }

    if (max !== undefined && length > max) {
      return {
        valid: false,
        message: `长度不能超过 ${max} 个字符`
      }
    }

    return { valid: true }
  }

  /**
   * 验证日期范围
   * @param {string|Date} value - 日期值
   * @param {Object} options - 选项 { minDate, maxDate }
   * @returns {Object} 验证结果
   */
  dateRange(value, options = {}) {
    // 支持两种参数名：min/max 和 minDate/maxDate
    const minDate = options.minDate || options.min
    const maxDate = options.maxDate || options.max

    if (!value) {
      return {
        valid: false,
        message: '请输入日期'
      }
    }

    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        message: '请输入有效的日期'
      }
    }

    if (minDate) {
      const min = new Date(minDate)
      // 重置时间为 00:00:00 以进行纯日期比较
      min.setHours(0, 0, 0, 0)
      const compareDate = new Date(date)
      compareDate.setHours(0, 0, 0, 0)

      if (compareDate < min) {
        return {
          valid: false,
          message: `日期不能早于 ${minDate}`
        }
      }
    }

    if (maxDate) {
      const max = new Date(maxDate)
      // 重置时间为 00:00:00 以进行纯日期比较
      max.setHours(0, 0, 0, 0)
      const compareDate = new Date(date)
      compareDate.setHours(0, 0, 0, 0)

      if (compareDate > max) {
        return {
          valid: false,
          message: `日期不能晚于 ${maxDate}`
        }
      }
    }

    return { valid: true }
  }

  /**
   * 验证邮箱地址
   * @param {string} value - 邮箱地址
   * @returns {Object} 验证结果
   */
  email(value) {
    if (!value || typeof value !== 'string') {
      return {
        valid: false,
        message: '请输入邮箱地址'
      }
    }

    const email = value.trim()
    if (email === '') {
      return {
        valid: false,
        message: '请输入邮箱地址'
      }
    }

    // 简单的邮箱验证正则
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        message: '请输入有效的邮箱地址'
      }
    }

    return { valid: true }
  }

  /**
   * 验证手机号码
   * @param {string} value - 手机号码
   * @returns {Object} 验证结果
   */
  phone(value) {
    if (!value || typeof value !== 'string') {
      return {
        valid: false,
        message: '请输入手机号码'
      }
    }

    const phone = value.trim()
    if (phone === '') {
      return {
        valid: false,
        message: '请输入手机号码'
      }
    }

    // 移除所有非数字字符
    const cleanPhone = phone.replace(/\D/g, '')

    // 中国手机号：1开头，11位数字
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(cleanPhone)) {
      return {
        valid: false,
        message: '请输入有效的手机号码'
      }
    }

    return { valid: true }
  }

  /**
   * 验证施工单表单
   * @param {Object} formData - 表单数据
   * @returns {Object} 验证结果 { valid: boolean, errors: Object }
   */
  validateWorkOrderForm(formData) {
    const errors = {}

    // 客户验证
    const customerResult = this.required(formData.customer, '客户')
    if (!customerResult.valid) {
      errors.customer = customerResult.message
    }

    // 生产数量验证
    if (formData.production_quantity) {
      const quantityResult = this.numberRange(formData.production_quantity, {
        min: 1,
        max: 1000000
      })
      if (!quantityResult.valid) {
        errors.production_quantity = quantityResult.message
      }
    } else {
      errors.production_quantity = '生产数量不能为空'
    }

    // 交货日期验证
    if (formData.delivery_date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dateResult = this.dateRange(formData.delivery_date, {
        minDate: today
      })
      if (!dateResult.valid) {
        errors.delivery_date = dateResult.message
      }
    } else {
      errors.delivery_date = '交货日期不能为空'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 验证任务完成表单
   * @param {Object} formData - 表单数据
   * @returns {Object} 验证结果
   */
  validateTaskCompleteForm(formData) {
    const errors = {}

    // 制版任务必须选择图稿
    if (formData.task_type === 'plate_making' && formData.has_artwork) {
      if (!formData.artwork_ids || formData.artwork_ids.length === 0) {
        errors.artwork_ids = '请选择图稿'
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 验证任务拆分表单
   * @param {Object} task - 原任务
   * @param {Array} splits - 拆分方案
   * @returns {Object} 验证结果
   */
  validateTaskSplitForm(task, splits) {
    const errors = {}

    // 验证拆分数量
    if (!splits || splits.length < 2) {
      errors.splits = '至少需要拆分为 2 个子任务'
      return {
        valid: false,
        errors
      }
    }

    // 验证总数量
    const totalQuantity = splits.reduce((sum, split) => sum + (split.production_quantity || 0), 0)

    if (totalQuantity !== task.production_quantity) {
      errors.splits = `拆分后的总数量(${totalQuantity})必须等于原任务数量(${task.production_quantity})`
      return {
        valid: false,
        errors
      }
    }

    // 验证每个拆分
    splits.forEach((split, index) => {
      if (!split.production_quantity || split.production_quantity <= 0) {
        errors[`splits.${index}.quantity`] = '数量必须大于 0'
      }
    })

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 验证客户表单
   * @param {Object} formData - 表单数据
   * @returns {Object} 验证结果
   */
  validateCustomerForm(formData) {
    const errors = {}

    // 客户名称
    const nameResult = this.required(formData.name, '客户名称')
    if (!nameResult.valid) {
      errors.name = nameResult.message
    } else {
      const nameLengthResult = this.stringLength(formData.name, {
        min: 2,
        max: 100
      })
      if (!nameLengthResult.valid) {
        errors.name = nameLengthResult.message
      }
    }

    // 联系人
    if (formData.contact_person) {
      const contactResult = this.stringLength(formData.contact_person, {
        max: 50
      })
      if (!contactResult.valid) {
        errors.contact_person = contactResult.message
      }
    }

    // 电话
    if (formData.phone) {
      const phoneRegEx = /^1[3-9]\d{9}$/
      if (!phoneRegEx.test(formData.phone)) {
        errors.phone = '请输入有效的手机号码'
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 验证产品表单
   * @param {Object} formData - 表单数据
   * @returns {Object} 验证结果
   */
  validateProductForm(formData) {
    const errors = {}

    // 产品名称
    const nameResult = this.required(formData.name, '产品名称')
    if (!nameResult.valid) {
      errors.name = nameResult.message
    }

    // 产品编号
    const codeResult = this.required(formData.code, '产品编号')
    if (!codeResult.valid) {
      errors.code = codeResult.message
    }

    // 价格
    const priceValue = formData.unit_price !== undefined ? formData.unit_price : formData.price
    if (priceValue !== undefined) {
      const priceResult = this.numberRange(priceValue, {
        min: 0,
        minInclusive: true
      })
      if (!priceResult.valid) {
        errors.unit_price = priceResult.message
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 批量验证表单字段
   * @param {Object} rules - 验证规则 { fieldName: validator }
   * @param {Object} data - 表单数据
   * @returns {Object} 验证结果
   */
  validateBatch(rules, data) {
    const errors = {}

    Object.entries(rules).forEach(([fieldName, validator]) => {
      const result = validator(data[fieldName], data)
      if (!result.valid) {
        errors[fieldName] = result.message
      }
    })

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 清除表单验证错误
   * @param {Object} _errors - 错误对象（可选，用于兼容）
   * @param {string|Array} fields - 要清除的字段，如果不指定则清除所有
   * @returns {Object} 清除后的错误对象
   */
  // eslint-disable-next-line no-unused-vars
  clearErrors(_errors = {}, fields) {
    if (!fields) {
      this._errors = {}
      return {}
    }

    const fieldsToClear = Array.isArray(fields) ? fields : [fields]
    fieldsToClear.forEach(field => {
      delete this._errors[field]
    })

    return { ...this._errors }
  }

  /**
   * 检查表单是否有错误
   * @param {Object} errors - 错误对象（可选，用于兼容）
   * @returns {boolean} 是否有错误
   */
  hasErrors(errors = {}) {
    const errorObj = Object.keys(errors).length > 0 ? errors : this._errors
    return Object.keys(errorObj).length > 0
  }

  /**
   * 获取第一个错误消息
   * @param {Object} errors - 错误对象（可选，用于兼容）
   * @returns {string} 第一个错误消息
   */
  getFirstError(errors = {}) {
    const errorObj = Object.keys(errors).length > 0 ? errors : this._errors
    const firstField = Object.keys(errorObj)[0]
    return firstField ? errorObj[firstField] : ''
  }
}

// 创建单例实例
const formValidationService = new FormValidationService()

export default formValidationService
