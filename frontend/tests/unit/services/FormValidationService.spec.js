/**
 * FormValidationService 单元测试
 */

import formValidationService from '@/services/FormValidationService'

describe('FormValidationService', () => {
  describe('required', () => {
    test('应该验证必填字段 - 有值', () => {
      const result = formValidationService.required('test', '测试字段')
      expect(result.valid).toBe(true)
    })

    test('应该验证必填字段 - 空字符串', () => {
      const result = formValidationService.required('', '测试字段')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('测试字段不能为空')
    })

    test('应该验证必填字段 - null', () => {
      const result = formValidationService.required(null, '测试字段')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('测试字段不能为空')
    })

    test('应该验证必填字段 - undefined', () => {
      const result = formValidationService.required(undefined, '测试字段')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('测试字段不能为空')
    })

    test('应该验证必填字段 - 空数组', () => {
      const result = formValidationService.required([], '测试字段')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('测试字段不能为空')
    })

    test('应该验证必填字段 - 非空数组', () => {
      const result = formValidationService.required([1, 2, 3], '测试字段')
      expect(result.valid).toBe(true)
    })

    test('应该验证必填字段 - 数字0', () => {
      const result = formValidationService.required(0, '测试字段')
      expect(result.valid).toBe(true)
    })
  })

  describe('numberRange', () => {
    test('应该验证数字在范围内', () => {
      const result = formValidationService.numberRange(50, { min: 1, max: 100 })
      expect(result.valid).toBe(true)
    })

    test('应该验证数字小于最小值（不包含）', () => {
      const result = formValidationService.numberRange(0, { min: 1, max: 100, minInclusive: false })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('必须大于 1')
    })

    test('应该验证数字小于最小值（包含）', () => {
      const result = formValidationService.numberRange(1, { min: 1, max: 100, minInclusive: true })
      expect(result.valid).toBe(true)
    })

    test('应该验证数字大于最大值（不包含）', () => {
      const result = formValidationService.numberRange(101, { min: 1, max: 100, maxInclusive: false })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('必须小于 100')
    })

    test('应该验证数字大于最大值（包含）', () => {
      const result = formValidationService.numberRange(100, { min: 1, max: 100, maxInclusive: true })
      expect(result.valid).toBe(true)
    })

    test('应该验证非数字', () => {
      const result = formValidationService.numberRange('abc', { min: 1, max: 100 })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('请输入有效的数字')
    })

    test('应该验证NaN', () => {
      const result = formValidationService.numberRange(NaN, { min: 1, max: 100 })
      expect(result.valid).toBe(false)
    })

    test('应该只验证最小值', () => {
      const result = formValidationService.numberRange(50, { min: 1 })
      expect(result.valid).toBe(true)
    })

    test('应该只验证最大值', () => {
      const result = formValidationService.numberRange(50, { max: 100 })
      expect(result.valid).toBe(true)
    })
  })

  describe('stringLength', () => {
    test('应该验证字符串长度在范围内', () => {
      const result = formValidationService.stringLength('test', { min: 2, max: 10 })
      expect(result.valid).toBe(true)
    })

    test('应该验证字符串太短', () => {
      const result = formValidationService.stringLength('a', { min: 2, max: 10 })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('长度不能少于 2 个字符')
    })

    test('应该验证字符串太长', () => {
      const result = formValidationService.stringLength('abcdefghijk', { min: 2, max: 10 })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('长度不能超过 10 个字符')
    })

    test('应该验证空字符串', () => {
      const result = formValidationService.stringLength('', { min: 1, max: 10 })
      expect(result.valid).toBe(false)
    })

    test('应该只验证最小长度', () => {
      const result = formValidationService.stringLength('test', { min: 2 })
      expect(result.valid).toBe(true)
    })

    test('应该只验证最大长度', () => {
      const result = formValidationService.stringLength('test', { max: 10 })
      expect(result.valid).toBe(true)
    })

    test('应该处理非字符串值', () => {
      const result = formValidationService.stringLength(123, { min: 1, max: 10 })
      expect(result.valid).toBe(true) // 数字转换为字符串
    })
  })

  describe('dateRange', () => {
    test('应该验证日期在范围内', () => {
      const date = new Date('2026-06-15')
      const min = new Date('2026-01-01')
      const max = new Date('2026-12-31')
      const result = formValidationService.dateRange(date, { min, max })
      expect(result.valid).toBe(true)
    })

    test('应该验证日期早于最小值', () => {
      const date = new Date('2025-12-31')
      const min = new Date('2026-01-01')
      const result = formValidationService.dateRange(date, { min })
      expect(result.valid).toBe(false)
    })

    test('应该验证日期晚于最大值', () => {
      const date = new Date('2027-01-01')
      const max = new Date('2026-12-31')
      const result = formValidationService.dateRange(date, { max })
      expect(result.valid).toBe(false)
    })

    test('应该验证无效日期', () => {
      const result = formValidationService.dateRange('invalid', { min: new Date() })
      expect(result.valid).toBe(false)
    })

    test('应该验证null日期', () => {
      const result = formValidationService.dateRange(null, { min: new Date() })
      expect(result.valid).toBe(false)
    })
  })

  describe('email', () => {
    test('应该验证有效邮箱', () => {
      const result = formValidationService.email('test@example.com')
      expect(result.valid).toBe(true)
    })

    test('应该验证无效邮箱 - 缺少@', () => {
      const result = formValidationService.email('testexample.com')
      expect(result.valid).toBe(false)
    })

    test('应该验证无效邮箱 - 缺少域名', () => {
      const result = formValidationService.email('test@')
      expect(result.valid).toBe(false)
    })

    test('应该验证无效邮箱 - 空字符串', () => {
      const result = formValidationService.email('')
      expect(result.valid).toBe(false)
    })

    test('应该验证带有+的邮箱', () => {
      const result = formValidationService.email('test+tag@example.com')
      expect(result.valid).toBe(true)
    })
  })

  describe('phone', () => {
    test('应该验证有效手机号 - 11位', () => {
      const result = formValidationService.phone('13800138000')
      expect(result.valid).toBe(true)
    })

    test('应该验证有效手机号 - 带连字符', () => {
      const result = formValidationService.phone('138-0013-8000')
      expect(result.valid).toBe(true)
    })

    test('应该验证无效手机号 - 太短', () => {
      const result = formValidationService.phone('123456')
      expect(result.valid).toBe(false)
    })

    test('应该验证无效手机号 - 非数字', () => {
      const result = formValidationService.phone('abcdefghijk')
      expect(result.valid).toBe(false)
    })

    test('应该验证空字符串', () => {
      const result = formValidationService.phone('')
      expect(result.valid).toBe(false)
    })
  })

  describe('validateWorkOrderForm', () => {
    test('应该验证有效的施工单表单', () => {
      const formData = {
        customer: 1,
        production_quantity: 100,
        delivery_date: '2026-12-31'
      }

      const result = formValidationService.validateWorkOrderForm(formData)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('应该验证无效的施工单表单 - 缺少客户', () => {
      const formData = {
        customer: null,
        production_quantity: 100,
        delivery_date: '2026-12-31'
      }

      const result = formValidationService.validateWorkOrderForm(formData)
      expect(result.valid).toBe(false)
      expect(result.errors.customer).toBeDefined()
    })

    test('应该验证无效的施工单表单 - 生产数量小于1', () => {
      const formData = {
        customer: 1,
        production_quantity: 0,
        delivery_date: '2026-12-31'
      }

      const result = formValidationService.validateWorkOrderForm(formData)
      expect(result.valid).toBe(false)
      expect(result.errors.production_quantity).toBeDefined()
    })

    test('应该验证无效的施工单表单 - 交货日期早于今天', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const formData = {
        customer: 1,
        production_quantity: 100,
        delivery_date: yesterday.toISOString().split('T')[0]
      }

      const result = formValidationService.validateWorkOrderForm(formData)
      expect(result.valid).toBe(false)
      expect(result.errors.delivery_date).toBeDefined()
    })

    test('应该验证无效的施工单表单 - 多个错误', () => {
      const formData = {
        customer: null,
        production_quantity: -10,
        delivery_date: '2026-12-31'
      }

      const result = formValidationService.validateWorkOrderForm(formData)
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(0)
    })
  })

  describe('validateTaskCompleteForm', () => {
    test('应该验证有效的任务完成表单', () => {
      const formData = {
        quantity_completed: 100,
        notes: '已完成'
      }

      const result = formValidationService.validateTaskCompleteForm(formData)
      expect(result.valid).toBe(true)
    })

    test('应该验证制版任务完成 - 需要选择图稿', () => {
      const formData = {
        task_type: 'plate_making',
        has_artwork: true,
        artwork_ids: [],
        quantity_completed: 1
      }

      const result = formValidationService.validateTaskCompleteForm(formData)
      expect(result.valid).toBe(false)
      expect(result.errors.artwork_ids).toBeDefined()
    })

    test('应该验证制版任务完成 - 图稿已选择', () => {
      const formData = {
        task_type: 'plate_making',
        has_artwork: true,
        artwork_ids: [1, 2],
        quantity_completed: 1
      }

      const result = formValidationService.validateTaskCompleteForm(formData)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateBatch', () => {
    test('应该批量验证字段 - 全部通过', () => {
      const fields = {
        customer: (value) => formValidationService.required(value, '客户'),
        quantity: (value) => formValidationService.numberRange(value, { min: 1 })
      }

      const data = {
        customer: 1,
        quantity: 100
      }

      const result = formValidationService.validateBatch(fields, data)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('应该批量验证字段 - 有错误', () => {
      const fields = {
        customer: (value) => formValidationService.required(value, '客户'),
        quantity: (value) => formValidationService.numberRange(value, { min: 1 })
      }

      const data = {
        customer: null,
        quantity: 100
      }

      const result = formValidationService.validateBatch(fields, data)
      expect(result.valid).toBe(false)
      expect(result.errors.customer).toBeDefined()
    })

    test('应该批量验证字段 - 多个错误', () => {
      const fields = {
        customer: (value) => formValidationService.required(value, '客户'),
        quantity: (value) => formValidationService.numberRange(value, { min: 1 }),
        email: (value) => formValidationService.email(value)
      }

      const data = {
        customer: null,
        quantity: -10,
        email: 'invalid'
      }

      const result = formValidationService.validateBatch(fields, data)
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBe(3)
    })
  })

  describe('错误管理', () => {
    test('hasErrors 应该返回 false 当没有错误时', () => {
      expect(formValidationService.hasErrors()).toBe(false)
    })

    test('clearErrors 应该清除所有错误', () => {
      // 先添加一些错误
      formValidationService.required('', '测试')
      formValidationService.numberRange(-10, { min: 1 })

      expect(formValidationService.hasErrors()).toBe(true)

      // 清除错误
      formValidationService.clearErrors()
      expect(formValidationService.hasErrors()).toBe(false)
    })

    test('getFirstError 应该返回第一个错误', () => {
      formValidationService.required('', '字段1')
      formValidationService.required(null, '字段2')

      const firstError = formValidationService.getFirstError()
      expect(firstError).toBeDefined()
      expect(typeof firstError).toBe('string')
    })

    test('getFirstError 应该返回空字符串当没有错误时', () => {
      formValidationService.clearErrors()
      const firstError = formValidationService.getFirstError()
      expect(firstError).toBe('')
    })
  })

  describe('validateCustomerForm', () => {
    test('应该验证有效的客户表单', () => {
      const formData = {
        name: '测试客户',
        code: 'CUST001'
      }

      const result = formValidationService.validateCustomerForm(formData)
      expect(result.valid).toBe(true)
    })

    test('应该验证无效的客户表单 - 缺少名称', () => {
      const formData = {
        name: '',
        code: 'CUST001'
      }

      const result = formValidationService.validateCustomerForm(formData)
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBeDefined()
    })
  })

  describe('validateProductForm', () => {
    test('应该验证有效的产品表单', () => {
      const formData = {
        name: '测试产品',
        code: 'PROD001',
        unit_price: 10.5
      }

      const result = formValidationService.validateProductForm(formData)
      expect(result.valid).toBe(true)
    })

    test('应该验证无效的产品表单 - 价格为负', () => {
      const formData = {
        name: '测试产品',
        code: 'PROD001',
        unit_price: -10
      }

      const result = formValidationService.validateProductForm(formData)
      expect(result.valid).toBe(false)
      expect(result.errors.unit_price).toBeDefined()
    })
  })
})
