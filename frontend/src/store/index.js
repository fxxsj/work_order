import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 用户信息
    userInfo: null,
    // 选中的施工单
    selectedWorkOrder: null,
    // 工序列表（缓存）
    processList: [],
    // 客户列表（缓存）
    customerList: [],
    // 物料列表（缓存）
    materialList: []
  },
  mutations: {
    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo
    },
    SET_SELECTED_WORK_ORDER(state, workOrder) {
      state.selectedWorkOrder = workOrder
    },
    SET_PROCESS_LIST(state, list) {
      state.processList = list
    },
    SET_CUSTOMER_LIST(state, list) {
      state.customerList = list
    },
    SET_MATERIAL_LIST(state, list) {
      state.materialList = list
    }
  },
  actions: {
    setUserInfo({ commit }, userInfo) {
      commit('SET_USER_INFO', userInfo)
    },
    setSelectedWorkOrder({ commit }, workOrder) {
      commit('SET_SELECTED_WORK_ORDER', workOrder)
    },
    setProcessList({ commit }, list) {
      commit('SET_PROCESS_LIST', list)
    },
    setCustomerList({ commit }, list) {
      commit('SET_CUSTOMER_LIST', list)
    },
    setMaterialList({ commit }, list) {
      commit('SET_MATERIAL_LIST', list)
    }
  },
  modules: {}
})

