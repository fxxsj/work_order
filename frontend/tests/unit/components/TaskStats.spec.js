/**
 * TaskStats 组件单元测试
 */

import { shallowMount, createLocalVue } from '@vue/test-utils'
import TaskStats from '@/views/task/components/TaskStats.vue'

const localVue = createLocalVue()

describe('TaskStats.vue', () => {
  let wrapper

  const factory = (propsData = {}) => {
    return shallowMount(TaskStats, {
      localVue,
      propsData,
      stubs: {
        'el-card': true,
        'el-row': true,
        'el-col': true
      }
    })
  }

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
  })

  describe('渲染测试', () => {
    test('应该正确渲染统计卡片', () => {
      wrapper = factory()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.task-stats').exists()).toBe(true)
    })

    test('应该显示 4 个统计卡片', () => {
      wrapper = factory()

      const statCards = wrapper.findAll('.stat-card')
      expect(statCards.length).toBe(4)
    })
  })

  describe('统计数据计算', () => {
    test('应该正确计算总任务数', () => {
      const tasks = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'in_progress' },
        { id: 3, status: 'completed' }
      ]

      wrapper = factory({ tasks })

      expect(wrapper.vm.totalTasks).toBe(3)
    })

    test('应该正确计算待开始任务数', () => {
      const tasks = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'pending' },
        { id: 3, status: 'in_progress' }
      ]

      wrapper = factory({ tasks })

      expect(wrapper.vm.pendingCount).toBe(2)
    })

    test('应该正确计算进行中任务数', () => {
      const tasks = [
        { id: 1, status: 'in_progress' },
        { id: 2, status: 'in_progress' },
        { id: 3, status: 'completed' }
      ]

      wrapper = factory({ tasks })

      expect(wrapper.vm.inProgressCount).toBe(2)
    })

    test('应该正确计算已完成任务数', () => {
      const tasks = [
        { id: 1, status: 'completed' },
        { id: 2, status: 'completed' },
        { id: 3, status: 'pending' }
      ]

      wrapper = factory({ tasks })

      expect(wrapper.vm.completedCount).toBe(2)
    })

    test('空任务数组应该返回 0', () => {
      wrapper = factory({ tasks: [] })

      expect(wrapper.vm.totalTasks).toBe(0)
      expect(wrapper.vm.pendingCount).toBe(0)
      expect(wrapper.vm.inProgressCount).toBe(0)
      expect(wrapper.vm.completedCount).toBe(0)
    })
  })

  describe('Props 测试', () => {
    test('应该接收 tasks prop', () => {
      const tasks = [{ id: 1, status: 'pending' }]

      wrapper = factory({ tasks })

      expect(wrapper.vm.tasks).toEqual(tasks)
    })

    test('tasks prop 默认应该是空数组', () => {
      wrapper = factory()

      expect(wrapper.vm.tasks).toEqual([])
    })
  })

  describe('边界情况', () => {
    test('应该处理 null 任务', () => {
      const tasks = [
        { id: 1, status: 'pending' },
        null,
        { id: 2, status: 'completed' }
      ]

      wrapper = factory({ tasks })

      // 不应该抛出错误
      expect(wrapper.vm.totalTasks).toBe(3)
    })

    test('应该处理未定义状态的任务', () => {
      const tasks = [
        { id: 1, status: 'pending' },
        { id: 2, status: undefined },
        { id: 3, status: 'completed' }
      ]

      wrapper = factory({ tasks })

      expect(wrapper.vm.totalTasks).toBe(3)
      expect(wrapper.vm.pendingCount).toBe(1)
      expect(wrapper.vm.completedCount).toBe(1)
    })
  })
})
