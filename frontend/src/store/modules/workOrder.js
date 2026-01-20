/**
 * WorkOrder Module - 施工单模块
 * 管理施工单相关的 UI 状态
 */

// 初始状态
const state = {
  selectedWorkOrder: null,
  selectedWorkOrders: [],
  filters: {
    status: '',
    priority: '',
    approvalStatus: '',
    department: null,
    keyword: '',
    startDate: null,
    endDate: null
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  }
}

// Getters
const getters = {
  // 获取选中的施工单
  selectedWorkOrder: (state) => state.selectedWorkOrder,

  // 获取批量选中的施工单
  selectedWorkOrders: (state) => state.selectedWorkOrders,

  // 是否有选中项
  hasSelection: (state) => state.selectedWorkOrder !== null || state.selectedWorkOrders.length > 0,

  // 获取筛选条件
  filters: (state) => state.filters,

  // 获取分页信息
  pagination: (state) => state.pagination,

  // 是否有激活的筛选条件
  hasActiveFilters: (state) => {
    const { filters } = state
    return !!(
      filters.status ||
      filters.priority ||
      filters.approvalStatus ||
      filters.department ||
      filters.keyword ||
      filters.startDate ||
      filters.endDate
    )
  },

  // 获取激活的筛选条件数量
  activeFiltersCount: (state) => {
    const { filters } = state
    let count = 0
    if (filters.status) count++
    if (filters.priority) count++
    if (filters.approvalStatus) count++
    if (filters.department) count++
    if (filters.keyword) count++
    if (filters.startDate) count++
    if (filters.endDate) count++
    return count
  }
}

// Mutations
const mutations = {
  // 设置选中的施工单
  SET_SELECTED_WORK_ORDER(state, workOrder) {
    state.selectedWorkOrder = workOrder
  },

  // 设置批量选中的施工单
  SET_SELECTED_WORK_ORDERS(state, workOrders) {
    state.selectedWorkOrders = workOrders || []
  },

  // 添加到选中列表
  ADD_TO_SELECTED(state, workOrder) {
    if (workOrder && !state.selectedWorkOrders.find(w => w.id === workOrder.id)) {
      state.selectedWorkOrders.push(workOrder)
    }
  },

  // 从选中列表移除
  REMOVE_FROM_SELECTED(state, workOrder) {
    const index = state.selectedWorkOrders.findIndex(w => w.id === workOrder.id)
    if (index !== -1) {
      state.selectedWorkOrders.splice(index, 1)
    }
  },

  // 切换选中状态
  TOGGLE_SELECTION(state, workOrder) {
    const index = state.selectedWorkOrders.findIndex(w => w.id === workOrder.id)
    if (index !== -1) {
      state.selectedWorkOrders.splice(index, 1)
    } else {
      state.selectedWorkOrders.push(workOrder)
    }
  },

  // 清除选择
  CLEAR_SELECTION(state) {
    state.selectedWorkOrder = null
    state.selectedWorkOrders = []
  },

  // 设置筛选条件
  SET_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters }
  },

  // 重置筛选条件
  RESET_FILTERS(state) {
    state.filters = {
      status: '',
      priority: '',
      approvalStatus: '',
      department: null,
      keyword: '',
      startDate: null,
      endDate: null
    }
  },

  // 设置单个筛选条件
  SET_FILTER(state, { key, value }) {
    state.filters[key] = value
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
  // 选中施工单
  selectWorkOrder({ commit }, workOrder) {
    commit('SET_SELECTED_WORK_ORDER', workOrder)
  },

  // 批量选中施工单
  selectMultipleWorkOrders({ commit }, workOrders) {
    commit('SET_SELECTED_WORK_ORDERS', workOrders)
  },

  // 添加到选中列表
  addToSelection({ commit }, workOrder) {
    commit('ADD_TO_SELECTED', workOrder)
  },

  // 从选中列表移除
  removeFromSelection({ commit }, workOrder) {
    commit('REMOVE_FROM_SELECTED', workOrder)
  },

  // 切换选中状态
  toggleSelection({ commit }, workOrder) {
    commit('TOGGLE_SELECTION', workOrder)
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
