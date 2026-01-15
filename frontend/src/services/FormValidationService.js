/**
 * 表单验证服务
 *
 * 提供统一的表单验证逻辑，避免在各个组件中重复编写验证代码
 */

/**
 * 表单验证服务类
 */
class FormValidationService {
  /**
   * 验证必填字段
   * @param {*} value - 字段值
   * @param {string} fieldName - 字段名称
   * @returns {Object} 验证结果 { valid: boolean, message: string }
   */
  required(value, fieldName = '该字段') {
    if (value === null || value === undefined || value === '') {
      return {
        valid: false,
        message: `${fieldName}不能为空`
      }
    }

    if (Array.isArray(value) && value.length === 0) {
      return {
        valid: false,
        message: `${fieldName}不能为空`
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
      return {
        valid: false,
        message: '请输入有效的数字'
      }
    }

    if (min !== undefined) {
      if (minInclusive && value < min) {
        return {
          valid: false,
          message: `不能小于 ${min}`
        }
      }
      if (!minInclusive && value <= min) {
        return {
          valid: false,
          message: `必须大于 ${min}`
        }
      }
    }

    if (max !== undefined) {
      if (maxInclusive && value > max) {
        return {
          valid: false,
          message: `不能大于 ${max}`
        }
      }
      if (!maxInclusive && value >= max) {
        return {
          valid: false,
          message: `必须小于 ${max}`
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

    if (typeof value !== 'string') {
      return {
        valid: false,
        message: '请输入有效的字符串'
      }
    }

    const length = value.trim().length

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
    const { minDate, maxDate } = options

    if (!value) {
      return { valid: true } // 空值由 required 验证
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
      if (date < min) {
        return {
          valid: false,
          message: `日期不能早于 ${minDate}`
        }
      }
    }

    if (maxDate) {
      const max = new Date(maxDate)
      if (date > max) {
        return {
          valid: false,
          message: `日期不能晚于 ${maxDate}`
        }
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

    // 产品验证
    if (!formData.products || formData.products.length === 0) {
      errors.products = '请至少选择一个产品'
    }

    // 工序验证
    if (!formData.processes || formData.processes.length === 0) {
      errors.processes = '请至少选择一个工序'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 验证任务完成表单
   * @param {Object} task - 任务对象
   * @param {Object} formData - 表单数据
   * @returns {Object} 验证结果
   */
  validateTaskCompleteForm(task, formData) {
    const errors = {}

    // 制版任务必须确认图稿和刀模
    if (task.task_type === 'plate_making') {
      if (task.artwork && !task.artwork.confirmed) {
        errors.artwork = '图稿未确认，无法完成任务'
      }
      if (task.die && !task.die.confirmed) {
        errors.die = '刀模未确认，无法完成任务'
      }
    }

    // 完成理由验证（当完成数量小于生产数量时）
    if (formData.quantity_completed && task.production_quantity) {
      if (formData.quantity_completed < task.production_quantity) {
        const reasonResult = this.required(formData.completion_reason, '完成理由')
        if (!reasonResult.valid) {
          errors.completion_reason = reasonResult.message
        }
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
    const totalQuantity = splits.reduce((sum, split) => {
      return sum + (split.production_quantity || 0)
    }, 0)

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
    if (formData.price !== undefined) {
      const priceResult = this.numberRange(formData.price, {
        min: 0,
        minInclusive: true
      })
      if (!priceResult.valid) {
        errors.price = priceResult.message
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 批量验证表单字段
   * @param {Object} formData - 表单数据
   * @param {Object} rules - 验证规则 { fieldName: validator }
   * @returns {Object} 验证结果
   */
  validateBatch(formData, rules) {
    const errors = {}

    Object.entries(rules).forEach(([fieldName, validator]) => {
      const result = validator(formData[fieldName], formData)
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
   * @param {Object} errors - 错误对象
   * @param {string|Array} fields - 要清除的字段
   * @returns {Object} 清除后的错误对象
   */
  clearErrors(errors, fields) {
    const fieldsToClear = Array.isArray(fields) ? fields : [fields]
    const clearedErrors = { ...errors }

    fieldsToClear.forEach(field => {
      delete clearedErrors[field]
    })

    return clearedErrors
  }

  /**
   * 检查表单是否有错误
   * @param {Object} errors - 错误对象
   * @returns {boolean} 是否有错误
   */
  hasErrors(errors) {
    return Object.keys(errors).length > 0
  }

  /**
   * 获取第一个错误消息
   * @param {Object} errors - 错误对象
   * @returns {string|null} 第一个错误消息
   */
  getFirstError(errors) {
    const firstField = Object.keys(errors)[0]
    return firstField ? errors[firstField] : null
  }
}

// 创建单例实例
const formValidationService = new FormValidationService()

export default formValidationService
