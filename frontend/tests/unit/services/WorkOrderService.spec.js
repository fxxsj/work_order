/**
 * WorkOrderService 单元测试
 */

import workOrderService, { WorkOrderService } from '@/services/WorkOrderService'

// Mock API 客户端
jest.mock('@/api/workorder', () => ({
  workOrderAPI: {
    list: jest.fn(),
    getDetail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    submitForApproval: jest.fn(),
    review: jest.fn(),
    start: jest.fn(),
    complete: jest.fn(),
    cancel: jest.fn(),
    getProcesses: jest.fn(),
    getTasks: jest.fn(),
    getLogs: jest.fn()
  }
}))

describe('WorkOrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateProgress', () => {
    test('应该根据预计算的进度返回', () => {
      const workOrder = {
        progress_percentage: 50
      }
      expect(workOrderService.calculateProgress(workOrder)).toBe(50)
    })

    test('没有预计算进度时应该根据任务状态计算', () => {
      const workOrder = {
        progress_percentage: null,
        tasks: [
          { status: 'completed' },
          { status: 'completed' },
          { status: 'in_progress' },
          { status: 'pending' }
        ]
      }
      expect(workOrderService.calculateProgress(workOrder)).toBe(50)
    })

    test('没有任务时应该返回0', () => {
      const workOrder = {
        progress_percentage: null,
        tasks: []
      }
      expect(workOrderService.calculateProgress(workOrder)).toBe(0)
    })

    test('进度超过100时应该限制为100', () => {
      const workOrder = {
        progress_percentage: 150
      }
      expect(workOrderService.calculateProgress(workOrder)).toBe(100)
    })

    test('进度小于0时应该限制为0', () => {
      const workOrder = {
        progress_percentage: -10
      }
      expect(workOrderService.calculateProgress(workOrder)).toBe(0)
    })
  })

  describe('getStatusText', () => {
    test('应该返回正确的状态文本', () => {
      expect(workOrderService.getStatusText('pending')).toBe('待开始')
      expect(workOrderService.getStatusText('in_progress')).toBe('进行中')
      expect(workOrderService.getStatusText('completed')).toBe('已完成')
      expect(workOrderService.getStatusText('cancelled')).toBe('已取消')
    })

    test('未知状态应该返回原值', () => {
      expect(workOrderService.getStatusText('unknown')).toBe('unknown')
    })
  })

  describe('getApprovalStatusText', () => {
    test('应该返回正确的审核状态文本', () => {
      expect(workOrderService.getApprovalStatusText('pending')).toBe('待审核')
      expect(workOrderService.getApprovalStatusText('approved')).toBe('已审核')
      expect(workOrderService.getApprovalStatusText('rejected')).toBe('已拒绝')
    })

    test('未知审核状态应该返回原值', () => {
      expect(workOrderService.getApprovalStatusText('unknown')).toBe('unknown')
    })
  })

  describe('getPriorityText', () => {
    test('应该返回正确的优先级文本', () => {
      expect(workOrderService.getPriorityText('low')).toBe('低')
      expect(workOrderService.getPriorityText('normal')).toBe('普通')
      expect(workOrderService.getPriorityText('high')).toBe('高')
      expect(workOrderService.getPriorityText('urgent')).toBe('紧急')
    })

    test('未知优先级应该返回普通', () => {
      expect(workOrderService.getPriorityText('unknown')).toBe('普通')
    })
  })

  describe('getPriorityType', () => {
    test('应该返回正确的Element UI Tag类型', () => {
      expect(workOrderService.getPriorityType('low')).toBe('info')
      expect(workOrderService.getPriorityType('normal')).toBe('')
      expect(workOrderService.getPriorityType('high')).toBe('warning')
      expect(workOrderService.getPriorityType('urgent')).toBe('danger')
    })

    test('未知优先级应该返回空', () => {
      expect(workOrderService.getPriorityType('unknown')).toBe('')
    })
  })

  describe('canEdit', () => {
    test('已取消的施工单不能编辑', () => {
      const workOrder = { status: 'cancelled', approval_status: 'pending' }
      expect(workOrderService.canEdit(workOrder)).toBe(false)
    })

    test('已完成的施工单不能编辑', () => {
      const workOrder = { status: 'completed', approval_status: 'pending' }
      expect(workOrderService.canEdit(workOrder)).toBe(false)
    })

    test('已审核通过的施工单不能编辑（需要特殊权限）', () => {
      const workOrder = { status: 'pending', approval_status: 'approved' }
      expect(workOrderService.canEdit(workOrder)).toBe(false)
    })

    test('待开始且未审核的可以编辑', () => {
      const workOrder = { status: 'pending', approval_status: 'pending' }
      expect(workOrderService.canEdit(workOrder)).toBe(true)
    })

    test('进行中且未审核的可以编辑', () => {
      const workOrder = { status: 'in_progress', approval_status: 'pending' }
      expect(workOrderService.canEdit(workOrder)).toBe(true)
    })
  })

  describe('canDelete', () => {
    test('只有待开始且未提交审核的可以删除', () => {
      const workOrder = { status: 'pending', approval_status: 'pending' }
      expect(workOrderService.canDelete(workOrder)).toBe(true)
    })

    test('进行中的不能删除', () => {
      const workOrder = { status: 'in_progress', approval_status: 'pending' }
      expect(workOrderService.canDelete(workOrder)).toBe(false)
    })

    test('已审核的不能删除', () => {
      const workOrder = { status: 'pending', approval_status: 'approved' }
      expect(workOrderService.canDelete(workOrder)).toBe(false)
    })

    test('已完成的不能删除', () => {
      const workOrder = { status: 'completed', approval_status: 'pending' }
      expect(workOrderService.canDelete(workOrder)).toBe(false)
    })
  })

  describe('canSubmitForApproval', () => {
    test('只有待开始且未审核的可以提交', () => {
      const workOrder = { status: 'pending', approval_status: 'pending' }
      expect(workOrderService.canSubmitForApproval(workOrder)).toBe(true)
    })

    test('已审核的不能提交', () => {
      const workOrder = { status: 'pending', approval_status: 'approved' }
      expect(workOrderService.canSubmitForApproval(workOrder)).toBe(false)
    })

    test('进行中的不能提交', () => {
      const workOrder = { status: 'in_progress', approval_status: 'pending' }
      expect(workOrderService.canSubmitForApproval(workOrder)).toBe(false)
    })
  })

  describe('canStart', () => {
    test('已审核通过且待开始的可以开始', () => {
      const workOrder = { status: 'pending', approval_status: 'approved' }
      expect(workOrderService.canStart(workOrder)).toBe(true)
    })

    test('未审核的不能开始', () => {
      const workOrder = { status: 'pending', approval_status: 'pending' }
      expect(workOrderService.canStart(workOrder)).toBe(false)
    })

    test('已拒绝的不能开始', () => {
      const workOrder = { status: 'pending', approval_status: 'rejected' }
      expect(workOrderService.canStart(workOrder)).toBe(false)
    })

    test('进行中的不能开始', () => {
      const workOrder = { status: 'in_progress', approval_status: 'approved' }
      expect(workOrderService.canStart(workOrder)).toBe(false)
    })
  })

  describe('isCompleted', () => {
    test('已完成状态应该返回true', () => {
      const workOrder = { status: 'completed' }
      expect(workOrderService.isCompleted(workOrder)).toBe(true)
    })

    test('其他状态应该返回false', () => {
      expect(workOrderService.isCompleted({ status: 'pending' })).toBe(false)
      expect(workOrderService.isCompleted({ status: 'in_progress' })).toBe(false)
      expect(workOrderService.isCompleted({ status: 'cancelled' })).toBe(false)
    })
  })

  describe('isOverdue', () => {
    test('已完成的不算逾期', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const workOrder = {
        delivery_date: pastDate.toISOString(),
        status: 'completed'
      }
      expect(workOrderService.isOverdue(workOrder)).toBe(false)
    })

    test('没有交货日期的不算逾期', () => {
      const workOrder = {
        delivery_date: null,
        status: 'in_progress'
      }
      expect(workOrderService.isOverdue(workOrder)).toBe(false)
    })

    test('交货日期早于今天的进行中施工单算逾期', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const workOrder = {
        delivery_date: pastDate.toISOString().split('T')[0],
        status: 'in_progress'
      }
      expect(workOrderService.isOverdue(workOrder)).toBe(true)
    })

    test('交货日期晚于今天的不算逾期', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      const workOrder = {
        delivery_date: futureDate.toISOString().split('T')[0],
        status: 'in_progress'
      }
      expect(workOrderService.isOverdue(workOrder)).toBe(false)
    })
  })

  describe('getRemainingDays', () => {
    test('应该返回正确的剩余天数', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)

      const workOrder = {
        delivery_date: futureDate.toISOString().split('T')[0],
        status: 'in_progress'
      }
      expect(workOrderService.getRemainingDays(workOrder)).toBe(5)
    })

    test('逾期应该返回负数', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 3)

      const workOrder = {
        delivery_date: pastDate.toISOString().split('T')[0],
        status: 'in_progress'
      }
      expect(workOrderService.getRemainingDays(workOrder)).toBe(-3)
    })

    test('没有交货日期应该返回null', () => {
      const workOrder = {
        delivery_date: null,
        status: 'in_progress'
      }
      expect(workOrderService.getRemainingDays(workOrder)).toBeNull()
    })

    test('已完成的应该返回null', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)

      const workOrder = {
        delivery_date: futureDate.toISOString().split('T')[0],
        status: 'completed'
      }
      expect(workOrderService.getRemainingDays(workOrder)).toBeNull()
    })
  })

  describe('formatWorkOrderForDisplay', () => {
    test('应该格式化施工单数据', () => {
      const workOrder = {
        id: 1,
        order_number: 'WO2026001',
        status: 'pending',
        approval_status: 'pending',
        priority: 'high',
        delivery_date: '2026-12-31',
        production_quantity: 100,
        progress_percentage: 50
      }

      const formatted = workOrderService.formatWorkOrderForDisplay(workOrder)

      expect(formatted.status_text).toBe('待开始')
      expect(formatted.approval_status_text).toBe('待审核')
      expect(formatted.priority_text).toBe('高')
      expect(formatted.priority_type).toBe('warning')
      expect(formatted.progress_percentage).toBe(50)
      expect(formatted.can_edit).toBe(true)
      expect(formatted.can_delete).toBe(true)
      expect(formatted.is_completed).toBe(false)
    })

    test('已审核通过的施工单不能编辑', () => {
      const workOrder = {
        status: 'pending',
        approval_status: 'approved'
      }

      const formatted = workOrderService.formatWorkOrderForDisplay(workOrder)
      expect(formatted.can_edit).toBe(false)
    })
  })

  describe('getStatistics', () => {
    test('应该正确计算统计信息', () => {
      const workOrders = [
        { status: 'pending', approval_status: 'pending' },
        { status: 'pending', approval_status: 'approved' },
        { status: 'in_progress', approval_status: 'approved' },
        { status: 'completed', approval_status: 'approved' },
        { status: 'cancelled', approval_status: 'pending' }
      ]

      const stats = workOrderService.getStatistics(workOrders)

      expect(stats.total).toBe(5)
      expect(stats.pending).toBe(2)
      expect(stats.in_progress).toBe(1)
      expect(stats.completed).toBe(1)
      expect(stats.cancelled).toBe(1)
      expect(stats.pending_approval).toBe(2)
      expect(stats.approved).toBe(3)
      expect(stats.rejected).toBe(0)
    })

    test('空数组应该返回零统计', () => {
      const stats = workOrderService.getStatistics([])
      expect(stats.total).toBe(0)
      expect(stats.pending).toBe(0)
      expect(stats.in_progress).toBe(0)
    })
  })

  describe('枚举导出', () => {
    test('应该导出WorkOrderStatus枚举', () => {
      expect(WorkOrderService.WorkOrderStatus).toBeDefined()
      expect(WorkOrderService.WorkOrderStatus.PENDING).toBe('pending')
      expect(WorkOrderService.WorkOrderStatus.IN_PROGRESS).toBe('in_progress')
      expect(WorkOrderService.WorkOrderStatus.COMPLETED).toBe('completed')
      expect(WorkOrderService.WorkOrderStatus.CANCELLED).toBe('cancelled')
    })

    test('应该导出ApprovalStatus枚举', () => {
      expect(WorkOrderService.ApprovalStatus).toBeDefined()
      expect(WorkOrderService.ApprovalStatus.PENDING).toBe('pending')
      expect(WorkOrderService.ApprovalStatus.APPROVED).toBe('approved')
      expect(WorkOrderService.ApprovalStatus.REJECTED).toBe('rejected')
    })

    test('应该导出Priority枚举', () => {
      expect(WorkOrderService.Priority).toBeDefined()
      expect(WorkOrderService.Priority.LOW).toBe('low')
      expect(WorkOrderService.Priority.NORMAL).toBe('normal')
      expect(WorkOrderService.Priority.HIGH).toBe('high')
      expect(WorkOrderService.Priority.URGENT).toBe('urgent')
    })
  })
})
