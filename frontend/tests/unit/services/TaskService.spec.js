/**
 * TaskService 单元测试
 */

import taskService from '@/services/TaskService'

// Mock API 客户端
jest.mock('@/api/workorder', () => ({
  workOrderTaskAPI: {
    getList: jest.fn(),
    getDetail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    update_quantity: jest.fn(),
    complete: jest.fn(),
    assign: jest.fn(),
    split: jest.fn()
  }
}))

describe('TaskService', () => {
  beforeEach(() => {
    // 清除所有 mock
    jest.clearAllMocks()
  })

  describe('calculateProgress', () => {
    test('应该正确计算进度百分比', () => {
      const task = {
        production_quantity: 100,
        quantity_completed: 50
      }
      expect(taskService.calculateProgress(task)).toBe(50)
    })

    test('生产数量为0时应该返回0', () => {
      const task = {
        production_quantity: 0,
        quantity_completed: 0
      }
      expect(taskService.calculateProgress(task)).toBe(0)
    })

    test('完成数量超过生产数量时应该返回100', () => {
      const task = {
        production_quantity: 100,
        quantity_completed: 120
      }
      expect(taskService.calculateProgress(task)).toBe(100)
    })

    test('完成数量等于生产数量时应该返回100', () => {
      const task = {
        production_quantity: 100,
        quantity_completed: 100
      }
      expect(taskService.calculateProgress(task)).toBe(100)
    })

    test('完成数量为0时应该返回0', () => {
      const task = {
        production_quantity: 100,
        quantity_completed: 0
      }
      expect(taskService.calculateProgress(task)).toBe(0)
    })
  })

  describe('canComplete', () => {
    test('已完成的任务不能再次完成', () => {
      const task = {
        status: 'completed',
        task_type: 'general'
      }
      expect(taskService.canComplete(task)).toBe(false)
    })

    test('已取消的任务不能完成', () => {
      const task = {
        status: 'cancelled',
        task_type: 'general'
      }
      expect(taskService.canComplete(task)).toBe(false)
    })

    test('制版任务需要图稿确认', () => {
      const task = {
        task_type: 'plate_making',
        status: 'in_progress',
        artwork: { confirmed: false }
      }
      expect(taskService.canComplete(task)).toBe(false)
    })

    test('制版任务图稿已确认时可以完成', () => {
      const task = {
        task_type: 'plate_making',
        status: 'in_progress',
        artwork: { confirmed: true }
      }
      expect(taskService.canComplete(task)).toBe(true)
    })

    test('制版任务没有图稿时可以完成', () => {
      const task = {
        task_type: 'plate_making',
        status: 'in_progress',
        artwork: null
      }
      expect(taskService.canComplete(task)).toBe(true)
    })

    test('正常的进行中任务可以完成', () => {
      const task = {
        task_type: 'general',
        status: 'in_progress'
      }
      expect(taskService.canComplete(task)).toBe(true)
    })

    test('待开始的任务可以完成', () => {
      const task = {
        task_type: 'general',
        status: 'pending'
      }
      expect(taskService.canComplete(task)).toBe(true)
    })
  })

  describe('getCannotCompleteReason', () => {
    test('已完成的任务返回已完成提示', () => {
      const task = {
        status: 'completed'
      }
      expect(taskService.getCannotCompleteReason(task)).toBe('任务已完成')
    })

    test('已取消的任务返回已取消提示', () => {
      const task = {
        status: 'cancelled'
      }
      expect(taskService.getCannotCompleteReason(task)).toBe('任务已取消')
    })

    test('制版任务图稿未确认返回相应提示', () => {
      const task = {
        task_type: 'plate_making',
        status: 'in_progress',
        artwork: { confirmed: false }
      }
      expect(taskService.getCannotCompleteReason(task)).toBe('需要确认图稿')
    })

    test('制版任务刀模未确认返回相应提示', () => {
      const task = {
        task_type: 'plate_making',
        status: 'in_progress',
        artwork: { confirmed: true },
        die: { confirmed: false }
      }
      expect(taskService.getCannotCompleteReason(task)).toBe('需要确认刀模')
    })

    test('可以完成的任务返回空字符串', () => {
      const task = {
        task_type: 'general',
        status: 'in_progress'
      }
      expect(taskService.getCannotCompleteReason(task)).toBe('')
    })
  })

  describe('isOverdue', () => {
    test('已完成的任务不算逾期', () => {
      const task = {
        deadline: '2026-01-01',
        status: 'completed'
      }
      expect(taskService.isOverdue(task)).toBe(false)
    })

    test('已取消的任务不算逾期', () => {
      const task = {
        deadline: '2026-01-01',
        status: 'cancelled'
      }
      expect(taskService.isOverdue(task)).toBe(false)
    })

    test('没有截止日期的任务不算逾期', () => {
      const task = {
        deadline: null,
        status: 'in_progress'
      }
      expect(taskService.isOverdue(task)).toBe(false)
    })

    test('截止日期早于今天的进行中任务算逾期', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const task = {
        deadline: pastDate.toISOString(),
        status: 'in_progress'
      }
      expect(taskService.isOverdue(task)).toBe(true)
    })

    test('截止日期晚于今天的任务不算逾期', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      const task = {
        deadline: futureDate.toISOString(),
        status: 'in_progress'
      }
      expect(taskService.isOverdue(task)).toBe(false)
    })
  })

  describe('getRemainingDays', () => {
    test('应该返回正确的剩余天数', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)

      const task = {
        deadline: futureDate.toISOString(),
        status: 'in_progress'
      }
      expect(taskService.getRemainingDays(task)).toBe(5)
    })

    test('逾期任务应该返回负数', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 3)

      const task = {
        deadline: pastDate.toISOString(),
        status: 'in_progress'
      }
      expect(taskService.getRemainingDays(task)).toBe(-3)
    })

    test('没有截止日期应该返回null', () => {
      const task = {
        deadline: null,
        status: 'in_progress'
      }
      expect(taskService.getRemainingDays(task)).toBeNull()
    })

    test('已完成的任务应该返回null', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)

      const task = {
        deadline: futureDate.toISOString(),
        status: 'completed'
      }
      expect(taskService.getRemainingDays(task)).toBeNull()
    })
  })

  describe('validateSplit', () => {
    test('至少需要2个子任务', () => {
      const task = { production_quantity: 100 }
      const splits = [
        { production_quantity: 100 }
      ]

      const result = taskService.validateSplit(task, splits)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('至少需要2个子任务')
    })

    test('子任务数量总和不能超过父任务', () => {
      const task = { production_quantity: 100 }
      const splits = [
        { production_quantity: 60 },
        { production_quantity: 50 }
      ]

      const result = taskService.validateSplit(task, splits)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('子任务数量总和不能超过父任务数量')
    })

    test('子任务数量为0应该报错', () => {
      const task = { production_quantity: 100 }
      const splits = [
        { production_quantity: 50 },
        { production_quantity: 0 }
      ]

      const result = taskService.validateSplit(task, splits)
      expect(result.valid).toBe(false)
    })

    test('验证通过应该返回valid=true', () => {
      const task = { production_quantity: 100 }
      const splits = [
        { production_quantity: 50 },
        { production_quantity: 50 }
      ]

      const result = taskService.validateSplit(task, splits)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('getStatusText', () => {
    test('应该返回正确的状态文本', () => {
      expect(taskService.getStatusText('pending')).toBe('待开始')
      expect(taskService.getStatusText('in_progress')).toBe('进行中')
      expect(taskService.getStatusText('completed')).toBe('已完成')
      expect(taskService.getStatusText('cancelled')).toBe('已取消')
    })

    test('未知状态应该返回原值', () => {
      expect(taskService.getStatusText('unknown')).toBe('unknown')
    })
  })

  describe('getStatusType', () => {
    test('应该返回正确的Element UI Tag类型', () => {
      expect(taskService.getStatusType('pending')).toBe('info')
      expect(taskService.getStatusType('in_progress')).toBe('warning')
      expect(taskService.getStatusType('completed')).toBe('success')
      expect(taskService.getStatusType('cancelled')).toBe('danger')
    })

    test('未知状态应该返回info', () => {
      expect(taskService.getStatusType('unknown')).toBe('info')
    })
  })

  describe('formatDateTime', () => {
    test('应该正确格式化日期时间', () => {
      const date = '2026-01-15T10:30:00'
      const formatted = taskService.formatDateTime(date)
      expect(formatted).toBe('2026-01-15 10:30:00')
    })

    test('空值应该返回空字符串', () => {
      expect(taskService.formatDateTime(null)).toBe('')
      expect(taskService.formatDateTime('')).toBe('')
      expect(taskService.formatDateTime(undefined)).toBe('')
    })

    test('无效日期应该返回空字符串', () => {
      expect(taskService.formatDateTime('invalid')).toBe('')
    })
  })

  describe('getStatusOptions', () => {
    test('应该返回所有状态选项', () => {
      const options = taskService.getStatusOptions()
      expect(options).toHaveLength(4)
      expect(options[0]).toEqual({ value: 'pending', label: '待开始' })
      expect(options[1]).toEqual({ value: 'in_progress', label: '进行中' })
      expect(options[2]).toEqual({ value: 'completed', label: '已完成' })
      expect(options[3]).toEqual({ value: 'cancelled', label: '已取消' })
    })
  })

  describe('getTaskTypeOptions', () => {
    test('应该返回所有任务类型选项', () => {
      const options = taskService.getTaskTypeOptions()
      expect(options.length).toBeGreaterThan(0)
      expect(options.some(opt => opt.value === 'plate_making')).toBe(true)
      expect(options.some(opt => opt.value === 'printing')).toBe(true)
      expect(options.some(opt => opt.value === 'general')).toBe(true)
    })
  })
})
