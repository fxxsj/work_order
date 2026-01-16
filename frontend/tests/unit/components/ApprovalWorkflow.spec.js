/**
 * ApprovalWorkflow 组件单元测试
 */

/* global describe, test, expect, beforeEach, afterEach, jest */

import { shallowMount, createLocalVue } from '@vue/test-utils'
import ApprovalWorkflow from '@/views/workorder/components/ApprovalWorkflow.vue'

const localVue = createLocalVue()

describe('ApprovalWorkflow.vue', () => {
  let wrapper

  const mockWorkOrder = {
    id: 1,
    approval_status: 'pending',
    approval_logs: [
      {
        approver_name: '张三',
        approval_status: 'approved',
        comment: '审核意见',
        approved_at: '2026-01-10T10:00:00'
      }
    ]
  }

  const factory = (propsData = {}) => {
    return shallowMount(ApprovalWorkflow, {
      localVue,
      propsData: {
        workOrder: mockWorkOrder,
        canApprove: true,
        canResubmit: true,
        canRequestReapproval: true,
        ...propsData
      },
      stubs: {
        'el-card': true,
        'el-form': true,
        'el-form-item': true,
        'el-input': true,
        'el-button': true,
        'el-alert': true,
        'el-timeline': true,
        'el-timeline-item': true
      }
    })
  }

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
  })

  describe('渲染测试', () => {
    test('应该正确渲染审核流程组件', () => {
      wrapper = factory()

      expect(wrapper.exists()).toBe(true)
    })

    test('待审核状态且可以审核时应该显示审核表单', () => {
      wrapper = factory({
        workOrder: { ...mockWorkOrder, approval_status: 'pending' },
        canApprove: true
      })

      expect(wrapper.vm.isPendingApproval).toBe(true)
      expect(wrapper.vm.canApprove).toBe(true)
    })

    test('已拒绝状态且可以重新提交时应该显示重新提交表单', () => {
      wrapper = factory({
        workOrder: { ...mockWorkOrder, approval_status: 'rejected' },
        canResubmit: true
      })

      expect(wrapper.vm.isRejected).toBe(true)
      expect(wrapper.vm.canResubmit).toBe(true)
    })

    test('已审核状态且可以请求重新审核时应该显示请求表单', () => {
      wrapper = factory({
        workOrder: { ...mockWorkOrder, approval_status: 'approved' },
        canRequestReapproval: true
      })

      expect(wrapper.vm.isApproved).toBe(true)
      expect(wrapper.vm.canRequestReapproval).toBe(true)
    })

    test('有审核历史时应该显示时间线', () => {
      wrapper = factory({
        workOrder: {
          ...mockWorkOrder,
          approval_logs: [
            { approver_name: '张三', approval_status: 'approved', approved_at: '2026-01-10' }
          ]
        }
      })

      expect(wrapper.vm.hasApprovalLogs).toBe(true)
    })
  })

  describe('计算属性测试', () => {
    test('应该正确返回审核状态', () => {
      wrapper = factory()

      expect(wrapper.vm.approvalStatus).toBe('pending')
    })

    test('应该判断是否为待审核状态', () => {
      wrapper = factory({ workOrder: { ...mockWorkOrder, approval_status: 'pending' } })

      expect(wrapper.vm.isPendingApproval).toBe(true)
    })

    test('应该判断是否为已审核状态', () => {
      wrapper = factory({ workOrder: { ...mockWorkOrder, approval_status: 'approved' } })

      expect(wrapper.vm.isApproved).toBe(true)
    })

    test('应该判断是否为已拒绝状态', () => {
      wrapper = factory({ workOrder: { ...mockWorkOrder, approval_status: 'rejected' } })

      expect(wrapper.vm.isRejected).toBe(true)
    })

    test('应该判断是否有审核历史', () => {
      wrapper = factory({
        workOrder: { ...mockWorkOrder, approval_logs: [{ approver_name: '张三' }] }
      })

      expect(wrapper.vm.hasApprovalLogs).toBe(true)
    })

    test('空审核历史数组应该返回 false', () => {
      wrapper = factory({ workOrder: { ...mockWorkOrder, approval_logs: [] } })

      expect(wrapper.vm.hasApprovalLogs).toBe(false)
    })

    test('null 审核历史应该返回 false', () => {
      wrapper = factory({ workOrder: { ...mockWorkOrder, approval_logs: null } })

      expect(wrapper.vm.hasApprovalLogs).toBe(false)
    })
  })

  describe('事件测试 - 审核操作', () => {
    test('通过审核应该触发 approve 事件', async () => {
      wrapper = factory()

      await wrapper.vm.handleApprove('approved')

      expect(wrapper.emitted('approve')).toBeTruthy()
      expect(wrapper.emitted('approve')[0]).toEqual([{
        status: 'approved',
        comment: wrapper.vm.approvalForm.comment
      }])
    })

    test('拒绝审核应该触发 approve 事件', async () => {
      wrapper = factory()

      wrapper.vm.showRejectionReason = true
      wrapper.vm.approvalForm.rejection_reason = '质量不符合要求'

      await wrapper.vm.handleApprove('rejected')

      expect(wrapper.emitted('approve')).toBeTruthy()
      expect(wrapper.emitted('approve')[0]).toEqual([
        expect.objectContaining({
          status: 'rejected',
          rejection_reason: '质量不符合要求'
        })
      ])
    })

    test('拒绝审核时应该显示拒绝原因输入框', async () => {
      wrapper = factory()

      await wrapper.vm.handleApprove('rejected')

      expect(wrapper.vm.showRejectionReason).toBe(true)
    })
  })

  describe('事件测试 - 重新提交', () => {
    test('重新提交应该触发 resubmit 事件', async () => {
      wrapper = factory()

      wrapper.vm.resubmitForm.reason = '已修改问题'
      await wrapper.vm.handleResubmit()

      expect(wrapper.emitted('resubmit')).toBeTruthy()
      expect(wrapper.emitted('resubmit')[0]).toEqual([{
        reason: '已修改问题'
      }])
    })
  })

  describe('事件测试 - 请求重新审核', () => {
    test('请求重新审核应该触发 request-reapproval 事件', async () => {
      wrapper = factory()

      // Mock form validation
      wrapper.vm.$refs.reapprovalFormRef = {
        validate: jest.fn((callback) => callback(true))
      }

      wrapper.vm.reapprovalForm.reason = '需要修改规格'
      await wrapper.vm.handleRequestReapproval()

      expect(wrapper.emitted('request-reapproval')).toBeTruthy()
      expect(wrapper.emitted('request-reapproval')[0]).toEqual([{
        reason: '需要修改规格'
      }])
    })
  })

  describe('方法测试', () => {
    test('getApprovalStatusText 应该返回正确的状态文本', () => {
      wrapper = factory()

      expect(wrapper.vm.getApprovalStatusText('pending')).toBe('待审核')
      expect(wrapper.vm.getApprovalStatusText('approved')).toBe('已通过')
      expect(wrapper.vm.getApprovalStatusText('rejected')).toBe('已拒绝')
      expect(wrapper.vm.getApprovalStatusText('unknown')).toBe('unknown')
    })

    test('formatDateTime 应该格式化日期时间', () => {
      wrapper = factory()

      const formatted = wrapper.vm.formatDateTime('2026-01-15T10:30:00')
      expect(formatted).toMatch(/\d{4}\/\d{2}\/\d{2}/)
    })

    test('formatDateTime 应该处理 null 值', () => {
      wrapper = factory()

      const formatted = wrapper.vm.formatDateTime(null)
      expect(formatted).toBe('-')
    })
  })

  describe('边界情况', () => {
    test('所有权限为 false 时不应该显示任何表单', () => {
      wrapper = factory({
        canApprove: false,
        canResubmit: false,
        canRequestReapproval: false
      })

      expect(wrapper.vm.canApprove).toBe(false)
      expect(wrapper.vm.canResubmit).toBe(false)
      expect(wrapper.vm.canRequestReapproval).toBe(false)
    })

    test('没有审核历史时不应该显示时间线', () => {
      wrapper = factory({
        workOrder: { ...mockWorkOrder, approval_logs: [] }
      })

      expect(wrapper.vm.hasApprovalLogs).toBe(false)
    })

    test('审核历史为 null 时应该正常工作', () => {
      wrapper = factory({
        workOrder: { ...mockWorkOrder, approval_logs: null }
      })

      expect(wrapper.vm.hasApprovalLogs).toBe(false)
    })

    test('审核历史记录缺少必要字段时应该正常显示', () => {
      wrapper = factory({
        workOrder: {
          ...mockWorkOrder,
          approval_logs: [
            { approver_name: '张三' } // 缺少其他字段
          ]
        }
      })

      expect(wrapper.vm.hasApprovalLogs).toBe(true)
    })
  })

  describe('Watch 测试', () => {
    test('审核状态变为 pending 时应该重置 showRejectionReason', async () => {
      wrapper = factory({
        workOrder: { ...mockWorkOrder, approval_status: 'rejected' }
      })

      wrapper.vm.showRejectionReason = true

      // 改变审核状态
      await wrapper.setProps({
        workOrder: { ...mockWorkOrder, approval_status: 'pending' }
      })

      expect(wrapper.vm.showRejectionReason).toBe(false)
    })
  })

  describe('Props 测试', () => {
    test('应该接收 workOrder prop', () => {
      wrapper = factory()

      expect(wrapper.vm.workOrder).toEqual(mockWorkOrder)
    })

    test('应该接收 canApprove prop', () => {
      wrapper = factory({ canApprove: false })

      expect(wrapper.vm.canApprove).toBe(false)
    })

    test('应该接收 canResubmit prop', () => {
      wrapper = factory({ canResubmit: false })

      expect(wrapper.vm.canResubmit).toBe(false)
    })

    test('应该接收 canRequestReapproval prop', () => {
      wrapper = factory({ canRequestReapproval: false })

      expect(wrapper.vm.canRequestReapproval).toBe(false)
    })

    test('所有权限 prop 默认应该是 false', () => {
      wrapper = factory({
        canApprove: undefined,
        canResubmit: undefined,
        canRequestReapproval: undefined
      })

      expect(wrapper.vm.canApprove).toBe(false)
      expect(wrapper.vm.canResubmit).toBe(false)
      expect(wrapper.vm.canRequestReapproval).toBe(false)
    })
  })
})
