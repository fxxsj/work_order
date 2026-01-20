/**
 * Task Module - 任务模块
 * 管理任务相关的 UI 状态
 */

// 初始状态
const state = {
  selectedTask: null,
  selectedTasks: [],
  filters: {
    status: '',
    department: null,
    keyword: '',
    processId: null
  },
  viewMode: 'board', // 'board' 或 'list'
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  }
}

// Getters
const getters = {
  // 获取选中的任务
  selectedTask: (state) => state.selectedTask,

  // 获取批量选中的任务
  selectedTasks: (state) => state.selectedTasks,

  // 是否有选中项
  hasSelection: (state) => state.selectedTask !== null || state.selectedTasks.length > 0,

  // 获取筛选条件
  filters: (state) => state.filters,

  // 获取视图模式
  viewMode: (state) => state.viewMode,

  // 是否为看板视图
  isBoardView: (state) => state.viewMode === 'board',

  // 是否为列表视图
  isListView: (state) => state.viewMode === 'list',

  // 获取分页信息
  pagination: (state) => state.pagination,

  // 是否有激活的筛选条件
  hasActiveFilters: (state) => {
    const { filters } = state
    return !!(
      filters.status ||
      filters.department ||
      filters.keyword ||
      filters.processId
    )
  },

  // 获取激活的筛选条件数量
  activeFiltersCount: (state) => {
    const { filters } = state
    let count = 0
    if (filters.status) count++
    if (filters.department) count++
    if (filters.keyword) count++
    if (filters.processId) count++
    return count
  }
}

// Mutations
const mutations = {
  // 设置选中的任务
  SET_SELECTED_TASK(state, task) {
    state.selectedTask = task
  },

  // 设置批量选中的任务
  SET_SELECTED_TASKS(state, tasks) {
    state.selectedTasks = tasks || []
  },

  // 添加到选中列表
  ADD_TO_SELECTED(state, task) {
    if (task && !state.selectedTasks.find(t => t.id === task.id)) {
      state.selectedTasks.push(task)
    }
  },

  // 从选中列表移除
  REMOVE_FROM_SELECTED(state, task) {
    const index = state.selectedTasks.findIndex(t => t.id === task.id)
    if (index !== -1) {
      state.selectedTasks.splice(index, 1)
    }
  },

  // 切换选中状态
  TOGGLE_SELECTION(state, task) {
    const index = state.selectedTasks.findIndex(t => t.id === task.id)
    if (index !== -1) {
      state.selectedTasks.splice(index, 1)
    } else {
      state.selectedTasks.push(task)
    }
  },

  // 清除选择
  CLEAR_SELECTION(state) {
    state.selectedTask = null
    state.selectedTasks = []
  },

  // 设置筛选条件
  SET_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters }
  },

  // 重置筛选条件
  RESET_FILTERS(state) {
    state.filters = {
      status: '',
      department: null,
      keyword: '',
      processId: null
    }
  },

  // 设置单个筛选条件
  SET_FILTER(state, { key, value }) {
    state.filters[key] = value
  },

  // 设置视图模式
  SET_VIEW_MODE(state, mode) {
    state.viewMode = mode
  },

  // 切换视图模式
  TOGGLE_VIEW_MODE(state) {
    state.viewMode = state.viewMode === 'board' ? 'list' : 'board'
  },

  // 设置分页信息
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination }
  },

  // 重置分页
  RESET_PAGINATION(state) {
    state.pagination = {
      page: 1,
      pageSize: 20,
      total: 0
    }
  }
}

// Actions
const actions = {
  // 选中任务
  selectTask({ commit }, task) {
    commit('SET_SELECTED_TASK', task)
  },

  // 批量选中任务
  selectMultipleTasks({ commit }, tasks) {
    commit('SET_SELECTED_TASKS', tasks)
  },

  // 添加到选中列表
  addToSelection({ commit }, task) {
    commit('ADD_TO_SELECTED', task)
  },

  // 从选中列表移除
  removeFromSelection({ commit }, task) {
    commit('REMOVE_FROM_SELECTED', task)
  },

  // 切换选中状态
  toggleSelection({ commit }, task) {
    commit('TOGGLE_SELECTION', task)
  },

  // 清除选择
  clearSelection({ commit }) {
    commit('CLEAR_SELECTION')
  },

  // 更新筛选条件
  updateFilters({ commit }, filters) {
    commit('SET_FILTERS', filters)
    // 更新筛选条件时重置分页
    commit('RESET_PAGINATION')
  },

  // 重置筛选条件
  resetFilters({ commit }) {
    commit('RESET_FILTERS')
    commit('RESET_PAGINATION')
  },

  // 设置单个筛选条件
  setFilter({ commit }, { key, value }) {
    commit('SET_FILTER', { key, value })
    // 更新筛选条件时重置分页
    commit('RESET_PAGINATION')
  },

  // 设置视图模式
  setViewMode({ commit }, mode) {
    commit('SET_VIEW_MODE', mode)
  },

  // 切换视图模式
  toggleViewMode({ commit }) {
    commit('TOGGLE_VIEW_MODE')
  },

  // 更新分页信息
  updatePagination({ commit }, pagination) {
    commit('SET_PAGINATION', pagination)
  },

  // 跳转到指定页
  goToPage({ commit }, page) {
    commit('SET_PAGINATION', { page })
  },

  // 设置每页数量
  setPageSize({ commit }, pageSize) {
    commit('SET_PAGINATION', { pageSize, page: 1 })
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
