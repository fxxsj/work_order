/**
 * TaskCard 组件单元测试
 */

import { shallowMount, createLocalVue } from '@vue/test-utils'
import TaskCard from '@/views/task/components/TaskCard.vue'
import { taskService, permissionService, workOrderService } from '@/services'

// Mock Service 层
jest.mock('@/services', () => ({
  taskService: {
    calculateProgress: jest.fn(),
    isOverdue: jest.fn(),
    getRemainingDays: jest.fn(),
    canComplete: jest.fn(),
    getStatusType: jest.fn()
  },
  permissionService: {
    canOperateTask: jest.fn()
  },
  workOrderService: {
    getPriorityType: jest.fn()
  }
}))

const localVue = createLocalVue()

describe('TaskCard.vue', () => {
  let wrapper

  const mockTask = {
    id: 1,
    work_content: '测试任务内容',
    task_type: 'printing',
    task_type_display: '印刷',
    status: 'in_progress',
    status_display: '进行中',
    production_quantity: 100,
    quantity_completed: 50,
    quantity_defective: 5,
    deadline: '2026-01-20',
    assigned_operator_name: '张三',
    work_order_process_info: {
      work_order: {
        order_number: 'WO2026001',
        priority: 'high',
        priority_display: '高'
      },
      process: {
        name: '印刷'
      }
    }
  }

  const factory = (propsData = {}) => shallowMount(TaskCard, {
    localVue,
    propsData: {
      task: mockTask,
      editable: true,
      ...propsData
    },
    stubs: {
      'el-tag': true,
      'el-button': true,
      'el-progress': true
    }
  })

  beforeEach(() => {
    // 设置默认的 mock 返回值
    taskService.calculateProgress.mockReturnValue(50)
    taskService.isOverdue.mockReturnValue(false)
    taskService.getRemainingDays.mockReturnValue(5)
    taskService.canComplete.mockReturnValue(true)
    taskService.getStatusType.mockReturnValue('')
    permissionService.canOperateTask.mockReturnValue(true)
    workOrderService.getPriorityType.mockReturnValue('warning')
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
    jest.clearAllMocks()
  })

  describe('渲染测试', () => {
    test('应该正确渲染任务卡片', () => {
      wrapper = factory()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.task-card').exists()).toBe(true)
    })

    test('应该显示施工单号', () => {
      wrapper = factory()

      expect(wrapper.find('.task-order-number').text()).toBe('WO2026001')
    })

    test('应该显示任务内容', () => {
      wrapper = factory()

      expect(wrapper.find('.task-title').text()).toBe('测试任务内容')
    })

    test('应该显示操作员', () => {
      wrapper = factory()

      expect(wrapper.vm.operatorName).toBe('张三')
    })

    test('应该显示进度文本', () => {
      wrapper = factory()

      expect(wrapper.vm.progressText).toBe('50 / 100')
    })

    test('应该显示不良品提示', () => {
      wrapper = factory()

      expect(wrapper.vm.hasDefective).toBe(true)
      expect(wrapper.find('.task-defective').exists()).toBe(true)
    })
  })

  describe('计算属性测试', () => {
    test('应该计算进度百分比', () => {
      wrapper = factory()

      expect(taskService.calculateProgress).toHaveBeenCalledWith(mockTask)
      expect(wrapper.vm.progressPercentage).toBe(50)
    })

    test('逾期任务应该有特殊样式', () => {
      taskService.isOverdue.mockReturnValue(true)
      wrapper = factory()

      expect(wrapper.vm.isOverdue).toBe(true)
      expect(wrapper.find('.task-card-overdue').exists()).toBe(true)
    })

    test('应该计算截止日期文本', () => {
      wrapper = factory()

      expect(taskService.getRemainingDays).toHaveBeenCalledWith(mockTask)
      expect(wrapper.vm.deadlineText).toBe('5 天后到期')
    })

    test('应该计算截止日期样式类', () => {
      taskService.getRemainingDays.mockReturnValue(-1)
      wrapper = factory()

      expect(wrapper.vm.deadlineClass).toBe('deadline-overdue')
    })

    test('无截止日期时不显示截止日期文本', () => {
      taskService.getRemainingDays.mockReturnValue(null)
      wrapper = factory()

      expect(wrapper.vm.deadlineText).toBeNull()
    })

    test('应该判断是否可以更新', () => {
      wrapper = factory()

      expect(wrapper.vm.canUpdate).toBe(true)
    })

    test('应该判断是否可以分派', () => {
      wrapper = factory()

      expect(permissionService.canOperateTask).toHaveBeenCalledWith(mockTask, 'assign')
      expect(wrapper.vm.canAssign).toBe(true)
    })

    test('应该判断是否可以完成', () => {
      wrapper = factory()

      expect(taskService.canComplete).toHaveBeenCalledWith(mockTask)
      expect(wrapper.vm.canComplete).toBe(true)
    })

    test('不可编辑时不应该显示操作按钮', () => {
      wrapper = factory({ editable: false })

      expect(wrapper.vm.canUpdate).toBe(false)
      expect(wrapper.vm.canAssign).toBe(false)
      expect(wrapper.vm.canComplete).toBe(false)
    })
  })

  describe('事件测试', () => {
    test('点击卡片应该触发 click 事件', async () => {
      wrapper = factory()

      await wrapper.find('.task-card').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')[0]).toEqual([mockTask])
    })

    test('点击更新按钮应该触发 update 事件', async () => {
      wrapper = factory()

      await wrapper.vm.handleUpdate()

      expect(wrapper.emitted('update')).toBeTruthy()
      expect(wrapper.emitted('update')[0]).toEqual([mockTask])
    })

    test('点击分派按钮应该触发 assign 事件', async () => {
      wrapper = factory()

      await wrapper.vm.handleAssign()

      expect(wrapper.emitted('assign')).toBeTruthy()
      expect(wrapper.emitted('assign')[0]).toEqual([mockTask])
    })

    test('点击完成按钮应该触发 complete 事件', async () => {
      wrapper = factory()

      await wrapper.vm.handleComplete()

      expect(wrapper.emitted('complete')).toBeTruthy()
      expect(wrapper.emitted('complete')[0]).toEqual([mockTask])
    })
  })

  describe('边界情况', () => {
    test('缺少施工单信息时应该显示 "-"', () => {
      const taskWithoutOrder = { ...mockTask, work_order_process_info: null }
      wrapper = factory({ task: taskWithoutOrder })

      expect(wrapper.vm.orderNumber).toBe('-')
    })

    test('未分配操作员时应该显示 "未分配"', () => {
      const taskWithoutOperator = { ...mockTask, assigned_operator_name: null }
      wrapper = factory({ task: taskWithoutOperator })

      expect(wrapper.vm.operatorName).toBe('未分配')
    })

    test('没有不良品时不应该显示不良品提示', () => {
      const taskWithoutDefective = { ...mockTask, quantity_defective: 0 }
      wrapper = factory({ task: taskWithoutDefective })

      expect(wrapper.vm.hasDefective).toBe(false)
    })

    test('已完成的任务不应该显示更新和完成按钮', () => {
      const completedTask = { ...mockTask, status: 'completed' }
      taskService.canComplete.mockReturnValue(false) // 已完成的任务不能完成
      wrapper = factory({ task: completedTask })

      expect(wrapper.vm.canUpdate).toBe(false)
      expect(wrapper.vm.canComplete).toBe(false)
    })
  })

  describe('样式类测试', () => {
    test('逾期任务应该添加 task-card-overdue 类', () => {
      taskService.isOverdue.mockReturnValue(true)
      wrapper = factory()

      expect(wrapper.find('.task-card').classes()).toContain('task-card-overdue')
    })

    test('不逾期任务不应该添加 task-card-overdue 类', () => {
      taskService.isOverdue.mockReturnValue(false)
      wrapper = factory()

      expect(wrapper.find('.task-card').classes()).not.toContain('task-card-overdue')
    })
  })
})
