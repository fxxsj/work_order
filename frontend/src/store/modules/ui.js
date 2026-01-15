/**
 * UI Module - UI 状态模块
 * 管理 UI 交互状态和全局消息
 */

// 初始状态
const state = {
  sidebarCollapsed: false,
  currentPage: '',
  breadcrumbs: [],
  loading: false,
  loadingText: '',
  globalMessage: null,
  messageType: 'info' // success, warning, error, info
}

// Getters
const getters = {
  // 侧边栏是否折叠
  sidebarCollapsed: (state) => state.sidebarCollapsed,

  // 当前页面
  currentPage: (state) => state.currentPage,

  // 面包屑
  breadcrumbs: (state) => state.breadcrumbs,

  // 是否正在加载
  isLoading: (state) => state.loading,

  // 加载文本
  loadingText: (state) => state.loadingText,

  // 是否有全局消息
  hasMessage: (state) => state.globalMessage !== null,

  // 全局消息
  globalMessage: (state) => state.globalMessage,

  // 消息类型
  messageType: (state) => state.messageType
}

// Mutations
const mutations = {
  // 切换侧边栏
  TOGGLE_SIDEBAR(state) {
    state.sidebarCollapsed = !state.sidebarCollapsed
  },

  // 设置侧边栏状态
  SET_SIDEBAR(state, collapsed) {
    state.sidebarCollapsed = collapsed
  },

  // 设置当前页面
  SET_CURRENT_PAGE(state, page) {
    state.currentPage = page
  },

  // 设置面包屑
  SET_BREADCRUMBS(state, breadcrumbs) {
    state.breadcrumbs = breadcrumbs || []
  },

  // 添加面包屑
  ADD_BREADCRUMB(state, breadcrumb) {
    state.breadcrumbs.push(breadcrumb)
  },

  // 清空面包屑
  CLEAR_BREADCRUMBS(state) {
    state.breadcrumbs = []
  },

  // 设置加载状态
  SET_LOADING(state, { loading, text = '' }) {
    state.loading = loading
    state.loadingText = text
  },

  // 显示加载
  SHOW_LOADING(state, text = '') {
    state.loading = true
    state.loadingText = text
  },

  // 隐藏加载
  HIDE_LOADING(state) {
    state.loading = false
    state.loadingText = ''
  },

  // 设置全局消息
  SET_MESSAGE(state, { message, type = 'info' }) {
    state.globalMessage = message
    state.messageType = type
  },

  // 清除全局消息
  CLEAR_MESSAGE(state) {
    state.globalMessage = null
    state.messageType = 'info'
  }
}

// Actions
const actions = {
  // 切换侧边栏
  toggleSidebar({ commit }) {
    commit('TOGGLE_SIDEBAR')
  },

  // 设置侧边栏状态
  setSidebar({ commit }, collapsed) {
    commit('SET_SIDEBAR', collapsed)
  },

  // 更新当前页面
  updatePage({ commit }, page) {
    commit('SET_CURRENT_PAGE', page)
  },

  // 设置面包屑
  setBreadcrumbs({ commit }, breadcrumbs) {
    commit('SET_BREADCRUMBS', breadcrumbs)
  },

  // 添加面包屑
  addBreadcrumb({ commit }, breadcrumb) {
    commit('ADD_BREADCRUMB', breadcrumb)
  },

  // 清空面包屑
  clearBreadcrumbs({ commit }) {
    commit('CLEAR_BREADCRUMBS')
  },

  // 显示加载
  showLoading({ commit }, text = '') {
    commit('SHOW_LOADING', text)
  },

  // 隐藏加载
  hideLoading({ commit }) {
    commit('HIDE_LOADING')
  },

  // 设置加载状态
  setLoading({ commit }, { loading, text = '' }) {
    commit('SET_LOADING', { loading, text })
  },

  // 显示消息
  showMessage({ commit }, { message, type = 'info' }) {
    commit('SET_MESSAGE', { message, type })
  },

  // 显示成功消息
  showSuccess({ commit }, message) {
    commit('SET_MESSAGE', { message, type: 'success' })
  },

  // 显示警告消息
  showWarning({ commit }, message) {
    commit('SET_MESSAGE', { message, type: 'warning' })
  },

  // 显示错误消息
  showError({ commit }, message) {
    commit('SET_MESSAGE', { message, type: 'error' })
  },

  // 显示信息消息
  showInfo({ commit }, message) {
    commit('SET_MESSAGE', { message, type: 'info' })
  },

  // 清除消息
  clearMessage({ commit }) {
    commit('CLEAR_MESSAGE')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
