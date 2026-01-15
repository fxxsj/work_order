/**
 * TaskFilters 组件单元测试
 */

import { shallowMount, createLocalVue } from '@vue/test-utils'
import TaskFilters from '@/views/task/components/TaskFilters.vue'

const localVue = createLocalVue()

describe('TaskFilters.vue', () => {
  let wrapper

  const departments = [
    { id: 1, name: '印刷部' },
    { id: 2, name: '后道部' },
    { id: 3, name: '制版部' }
  ]

  const factory = (propsData = {}) => {
    return shallowMount(TaskFilters, {
      localVue,
      propsData: {
        departments,
        ...propsData
      },
      stubs: {
        'el-select': true,
        'el-option': true,
        'el-input': true,
        'el-button': true,
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
    test('应该正确渲染筛选器', () => {
      wrapper = factory()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.task-filters').exists()).toBe(true)
    })

    test('应该显示部门选择器', () => {
      wrapper = factory()

      const departmentSelect = wrapper.findAll('el-select-stub')
      expect(departmentSelect.length).toBeGreaterThan(0)
    })

    test('应该显示搜索输入框', () => {
      wrapper = factory()

      const searchInput = wrapper.findAll('el-input-stub')
      expect(searchInput.length).toBeGreaterThan(0)
    })

    test('应该显示刷新和视图切换按钮', () => {
      wrapper = factory()

      const buttons = wrapper.findAll('el-button-stub')
      expect(buttons.length).toBe(2) // 刷新和视图切换
    })
  })

  describe('Props 测试', () => {
    test('应该接收 departments prop', () => {
      wrapper = factory({ departments })

      expect(wrapper.vm.departments).toEqual(departments)
    })

    test('应该接收 selectedDepartment prop', () => {
      wrapper = factory({ selectedDepartment: 1 })

      expect(wrapper.vm.selectedDepartment).toBe(1)
    })

    test('selectedDepartment 默认应该是 null', () => {
      wrapper = factory()

      expect(wrapper.vm.selectedDepartment).toBeNull()
    })

    test('应该接收 searchText prop', () => {
      wrapper = factory({ searchText: '测试搜索' })

      expect(wrapper.vm.searchText).toBe('测试搜索')
    })

    test('应该接收 isListView prop', () => {
      wrapper = factory({ isListView: true })

      expect(wrapper.vm.isListView).toBe(true)
    })

    test('isListView 默认应该是 false', () => {
      wrapper = factory()

      expect(wrapper.vm.isListView).toBe(false)
    })

    test('应该接收 loading prop', () => {
      wrapper = factory({ loading: true })

      expect(wrapper.vm.loading).toBe(true)
    })
  })

  describe('事件测试', () => {
    test('部门变更时应该触发 department-change 事件', async () => {
      wrapper = factory()

      await wrapper.vm.handleDepartmentChange(2)

      expect(wrapper.emitted('department-change')).toBeTruthy()
      expect(wrapper.emitted('department-change')[0]).toEqual([2])
    })

    test('搜索输入时应该触发 search-input 事件', async () => {
      wrapper = factory()

      await wrapper.vm.handleSearchInput('测试内容')

      expect(wrapper.emitted('search-input')).toBeTruthy()
      expect(wrapper.emitted('search-input')[0]).toEqual(['测试内容'])
    })

    test('点击搜索应该触发 search 事件', async () => {
      wrapper = factory()

      await wrapper.vm.handleSearch()

      expect(wrapper.emitted('search')).toBeTruthy()
    })

    test('清空搜索应该触发 clear 事件', async () => {
      wrapper = factory()

      await wrapper.vm.handleClear()

      expect(wrapper.emitted('clear')).toBeTruthy()
    })

    test('点击刷新应该触发 refresh 事件', async () => {
      wrapper = factory()

      await wrapper.vm.handleRefresh()

      expect(wrapper.emitted('refresh')).toBeTruthy()
    })

    test('切换视图应该触发 view-toggle 事件', async () => {
      wrapper = factory()

      await wrapper.vm.handleViewToggle()

      expect(wrapper.emitted('view-toggle')).toBeTruthy()
    })
  })

  describe('边界情况', () => {
    test('空部门列表应该正常工作', () => {
      wrapper = factory({ departments: [] })

      expect(wrapper.vm.departments).toEqual([])
      expect(wrapper.exists()).toBe(true)
    })

    test('null 部门列表应该正常工作', () => {
      wrapper = factory({ departments: null })

      expect(wrapper.exists()).toBe(true)
    })

    test('空搜索文本应该正常工作', () => {
      wrapper = factory({ searchText: '' })

      expect(wrapper.vm.searchText).toBe('')
    })
  })
})
