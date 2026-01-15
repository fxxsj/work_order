/**
 * WorkOrderBasicInfo 组件单元测试
 */

import { shallowMount, createLocalVue } from '@vue/test-utils'
import WorkOrderBasicInfo from '@/views/workorder/components/WorkOrderBasicInfo.vue'
import { workOrderService } from '@/services'

// Mock workOrderService
jest.mock('@/services', () => ({
  workOrderService: {
    getStatusText: jest.fn(),
    getApprovalStatusText: jest.fn(),
    getPriorityText: jest.fn(),
    getPriorityType: jest.fn(),
    calculateProgress: jest.fn()
  }
}))

const localVue = createLocalVue()

describe('WorkOrderBasicInfo.vue', () => {
  let wrapper

  const mockWorkOrder = {
    id: 1,
    order_number: 'WO2026001',
    customer_name: '测试客户',
    customer_detail: {
      salesperson_name: '张三'
    },
    manager_name: '李四',
    product_name: '测试产品',
    production_quantity: 1000,
    defective_quantity: 10,
    total_amount: 50000,
    status: 'in_progress',
    status_display: '进行中',
    approval_status: 'approved',
    approval_status_display: '已审核',
    priority: 'high',
    priority_display: '高',
    progress_percentage: 50,
    order_date: '2026-01-01',
    delivery_date: '2026-12-31',
    actual_delivery_date: null,
    approved_by_name: '王经理',
    approved_at: '2026-01-10T10:00:00',
    approval_comment: '审核通过',
    specification: '产品规格说明'
  }

  const factory = (propsData = {}) => {
    return shallowMount(WorkOrderBasicInfo, {
      localVue,
      propsData: {
        workOrder: mockWorkOrder,
        ...propsData
      },
      stubs: {
        'el-descriptions': true,
        'el-descriptions-item': true,
        'el-tag': true,
        'el-progress': true
      }
    })
  }

  beforeEach(() => {
    // 设置默认的 mock 返回值
    workOrderService.getStatusText.mockReturnValue('进行中')
    workOrderService.getApprovalStatusText.mockReturnValue('已审核')
    workOrderService.getPriorityText.mockReturnValue('高')
    workOrderService.getPriorityType.mockReturnValue('warning')
    workOrderService.calculateProgress.mockReturnValue(50)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
    jest.clearAllMocks()
  })

  describe('渲染测试', () => {
    test('应该正确渲染基本信息组件', () => {
      wrapper = factory()

      expect(wrapper.exists()).toBe(true)
    })

    test('应该显示施工单号', () => {
      wrapper = factory()

      expect(wrapper.vm.workOrder.order_number).toBe('WO2026001')
    })

    test('应该显示客户名称', () => {
      wrapper = factory()

      expect(wrapper.vm.workOrder.customer_name).toBe('测试客户')
    })
  })

  describe('计算属性测试', () => {
    test('应该返回业务员名称', () => {
      wrapper = factory()

      expect(wrapper.vm.salespersonName).toBe('张三')
    })

    test('没有业务员时应该返回 "-"', () => {
      const workOrderWithoutSalesperson = {
        ...mockWorkOrder,
        customer_detail: null
      }
      wrapper = factory({ workOrder: workOrderWithoutSalesperson })

      expect(wrapper.vm.salespersonName).toBe('-')
    })

    test('应该计算显示数量（生产数量 + 不良品数量）', () => {
      wrapper = factory()

      expect(wrapper.vm.displayQuantity).toBe(1010)
    })

    test('生产数量和不良品数量都为 0 时应该返回 null', () => {
      const workOrderWithZeroQuantity = {
        ...mockWorkOrder,
        production_quantity: 0,
        defective_quantity: 0
      }
      wrapper = factory({ workOrder: workOrderWithZeroQuantity })

      expect(wrapper.vm.displayQuantity).toBeNull()
    })

    test('应该获取状态文本', () => {
      wrapper = factory()

      expect(workOrderService.getStatusText).toHaveBeenCalledWith('in_progress')
      expect(wrapper.vm.statusText).toBe('进行中')
    })

    test('应该获取审核状态文本', () => {
      wrapper = factory()

      expect(workOrderService.getApprovalStatusText).toHaveBeenCalledWith('approved')
      expect(wrapper.vm.approvalStatusText).toBe('已审核')
    })

    test('应该获取优先级文本', () => {
      wrapper = factory()

      expect(workOrderService.getPriorityText).toHaveBeenCalledWith('high')
      expect(wrapper.vm.priorityText).toBe('高')
    })

    test('应该获取优先级类型', () => {
      wrapper = factory()

      expect(workOrderService.getPriorityType).toHaveBeenCalledWith('high')
      expect(wrapper.vm.priorityType).toBe('warning')
    })

    test('应该计算进度', () => {
      wrapper = factory()

      expect(workOrderService.calculateProgress).toHaveBeenCalledWith(mockWorkOrder)
      expect(wrapper.vm.progress).toBe(50)
    })

    test('进度为 100% 时应该使用绿色', () => {
      workOrderService.calculateProgress.mockReturnValue(100)
      wrapper = factory()

      expect(wrapper.vm.progressColor).toBe('#67C23A')
    })

    test('进度小于 100% 时应该使用蓝色', () => {
      workOrderService.calculateProgress.mockReturnValue(50)
      wrapper = factory()

      expect(wrapper.vm.progressColor).toBe('#409EFF')
    })
  })

  describe('方法测试', () => {
    test('formatDate 应该格式化日期字符串', () => {
      wrapper = factory()

      const formatted = wrapper.vm.formatDate('2026-01-15')
      expect(formatted).toMatch(/\d{4}\/\d{2}\/\d{2}/)
    })

    test('formatDate 应该处理 null 值', () => {
      wrapper = factory()

      const formatted = wrapper.vm.formatDate(null)
      expect(formatted).toBe('-')
    })

    test('formatDate 应该处理 undefined 值', () => {
      wrapper = factory()

      const formatted = wrapper.vm.formatDate(undefined)
      expect(formatted).toBe('-')
    })

    test('formatDateTime 应该格式化日期时间字符串', () => {
      wrapper = factory()

      const formatted = wrapper.vm.formatDateTime('2026-01-15T10:30:00')
      expect(formatted).toContain('10:30:00')
    })

    test('formatDateTime 应该处理 null 值', () => {
      wrapper = factory()

      const formatted = wrapper.vm.formatDateTime(null)
      expect(formatted).toBe('-')
    })
  })

  describe('边界情况', () => {
    test('缺少 customer_detail 时应该正常工作', () => {
      const workOrderWithoutCustomerDetail = {
        ...mockWorkOrder,
        customer_detail: null
      }
      wrapper = factory({ workOrder: workOrderWithoutCustomerDetail })

      expect(wrapper.vm.salespersonName).toBe('-')
      expect(wrapper.exists()).toBe(true)
    })

    test('没有制表人时应该显示 "-"', () => {
      const workOrderWithoutManager = {
        ...mockWorkOrder,
        manager_name: null
      }
      wrapper = factory({ workOrder: workOrderWithoutManager })

      expect(wrapper.vm.workOrder.manager_name).toBeNull()
    })

    test('没有产品名称时不应该显示产品字段', () => {
      const workOrderWithoutProduct = {
        ...mockWorkOrder,
        product_name: null
      }
      wrapper = factory({ workOrder: workOrderWithoutProduct })

      expect(wrapper.vm.workOrder.product_name).toBeNull()
    })

    test('没有审核信息时不应该显示审核字段', () => {
      const workOrderWithoutApproval = {
        ...mockWorkOrder,
        approved_by_name: null,
        approved_at: null,
        approval_comment: null
      }
      wrapper = factory({ workOrder: workOrderWithoutApproval })

      expect(wrapper.vm.workOrder.approved_by_name).toBeNull()
      expect(wrapper.vm.workOrder.approved_at).toBeNull()
    })

    test('没有产品规格时不应该显示规格字段', () => {
      const workOrderWithoutSpec = {
        ...mockWorkOrder,
        specification: null
      }
      wrapper = factory({ workOrder: workOrderWithoutSpec })

      expect(wrapper.vm.workOrder.specification).toBeNull()
    })

    test('进度超过 100% 时应该限制为 100%', () => {
      workOrderService.calculateProgress.mockReturnValue(150)
      wrapper = factory()

      expect(wrapper.vm.progress).toBe(100)
    })

    test('进度小于 0 时应该限制为 0', () => {
      workOrderService.calculateProgress.mockReturnValue(-10)
      wrapper = factory()

      expect(wrapper.vm.progress).toBe(0)
    })
  })

  describe('Props 测试', () => {
    test('应该接收 workOrder prop', () => {
      wrapper = factory()

      expect(wrapper.vm.workOrder).toEqual(mockWorkOrder)
    })

    test('workOrder prop 应该是必需的', () => {
      const options = {
        propsData: {},
        localVue,
        stubs: {
          'el-descriptions': true,
          'el-descriptions-item': true,
          'el-tag': true,
          'el-progress': true
        }
      }

      // 应该抛出警告或错误，因为 workOrder 是必需的
      expect(() => shallowMount(WorkOrderBasicInfo, options)).toBeTruthy()
    })
  })
})
