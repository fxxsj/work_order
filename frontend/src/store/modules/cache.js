/**
 * Cache Module - 缓存模块
 * 管理临时数据和缓存
 */

// 缓存配置
const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 默认缓存5分钟
  customerListTTL: 10 * 60 * 1000, // 客户列表缓存10分钟
  processListTTL: 30 * 60 * 1000, // 工序列表缓存30分钟
  materialListTTL: 10 * 60 * 1000, // 物料列表缓存10分钟
  userListTTL: 5 * 60 * 1000 // 用户列表缓存5分钟
}

// 初始状态
const state = {
  // 基础数据缓存
  customerList: {
    data: [],
    timestamp: null,
    ttl: CACHE_CONFIG.customerListTTL
  },
  processList: {
    data: [],
    timestamp: null,
    ttl: CACHE_CONFIG.processListTTL
  },
  materialList: {
    data: [],
    timestamp: null,
    ttl: CACHE_CONFIG.materialListTTL
  },
  userList: {
    data: [],
    timestamp: null,
    ttl: CACHE_CONFIG.userListTTL
  },

  // 临时数据缓存
  tempData: {}
}

// Getters
const getters = {
  // 获取客户列表
  customerList: (state) => {
    const cache = state.customerList
    if (!cache.timestamp) return null

    const now = Date.now()
    if (now - cache.timestamp > cache.ttl) {
      return null // 缓存过期
    }

    return cache.data
  },

  // 获取工序列表
  processList: (state) => {
    const cache = state.processList
    if (!cache.timestamp) return null

    const now = Date.now()
    if (now - cache.timestamp > cache.ttl) {
      return null
    }

    return cache.data
  },

  // 获取物料列表
  materialList: (state) => {
    const cache = state.materialList
    if (!cache.timestamp) return null

    const now = Date.now()
    if (now - cache.timestamp > cache.ttl) {
      return null
    }

    return cache.data
  },

  // 获取用户列表
  userList: (state) => {
    const cache = state.userList
    if (!cache.timestamp) return null

    const now = Date.now()
    if (now - cache.timestamp > cache.ttl) {
      return null
    }

    return cache.data
  },

  // 检查缓存是否有效
  isCacheValid: (state) => (cacheKey) => {
    const cache = state[cacheKey]
    if (!cache || !cache.timestamp) return false

    const now = Date.now()
    return now - cache.timestamp <= cache.ttl
  },

  // 获取临时数据
  tempData: (state) => (key) => {
    return state.tempData[key]
  }
}

// Mutations
const mutations = {
  // 设置客户列表缓存
  SET_CUSTOMER_LIST(state, data) {
    state.customerList = {
      data,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.customerListTTL
    }
  },

  // 设置工序列表缓存
  SET_PROCESS_LIST(state, data) {
    state.processList = {
      data,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.processListTTL
    }
  },

  // 设置物料列表缓存
  SET_MATERIAL_LIST(state, data) {
    state.materialList = {
      data,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.materialListTTL
    }
  },

  // 设置用户列表缓存
  SET_USER_LIST(state, data) {
    state.userList = {
      data,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.userListTTL
    }
  },

  // 清除指定缓存
  CLEAR_CACHE(state, cacheKey) {
    if (state[cacheKey]) {
      state[cacheKey] = {
        data: [],
        timestamp: null,
        ttl: state[cacheKey].ttl
      }
    }
  },

  // 清除所有缓存
  CLEAR_ALL_CACHES(state) {
    Object.keys(state).forEach(key => {
      if (typeof state[key] === 'object' && state[key].timestamp !== undefined) {
        state[key] = {
          data: [],
          timestamp: null,
          ttl: state[key].ttl
        }
      }
    })
  },

  // 设置临时数据
  SET_TEMP_DATA(state, { key, value }) {
    state.tempData[key] = value
  },

  // 清除临时数据
  CLEAR_TEMP_DATA(state, key) {
    if (key) {
      delete state.tempData[key]
    } else {
      state.tempData = {}
    }
  }
}

// Actions
const actions = {
  // 设置客户列表
  setCustomerList({ commit }, data) {
    commit('SET_CUSTOMER_LIST', data)
  },

  // 设置工序列表
  setProcessList({ commit }, data) {
    commit('SET_PROCESS_LIST', data)
  },

  // 设置物料列表
  setMaterialList({ commit }, data) {
    commit('SET_MATERIAL_LIST', data)
  },

  // 设置用户列表
  setUserList({ commit }, data) {
    commit('SET_USER_LIST', data)
  },

  // 清除指定缓存
  clearCache({ commit }, cacheKey) {
    commit('CLEAR_CACHE', cacheKey)
  },

  // 清除所有缓存
  clearAllCaches({ commit }) {
    commit('CLEAR_ALL_CACHES')
  },

  // 设置临时数据
  setTempData({ commit }, payload) {
    commit('SET_TEMP_DATA', payload)
  },

  // 清除临时数据
  clearTempData({ commit }, key) {
    commit('CLEAR_TEMP_DATA', key)
  },

  // 获取缓存数据（如果有效）
  getCacheData({ state, getters }, cacheKey) {
    if (getters.isCacheValid(cacheKey)) {
      return state[cacheKey].data
    }
    return null
  },

  // 刷新缓存（重新加载数据）
  async refreshCache({ commit }, { cacheKey, loadFn }) {
    try {
      const data = await loadFn()
      const mutationMap = {
        customerList: 'SET_CUSTOMER_LIST',
        processList: 'SET_PROCESS_LIST',
        materialList: 'SET_MATERIAL_LIST',
        userList: 'SET_USER_LIST'
      }
      commit(mutationMap[cacheKey], data)
      return { success: true, data }
    } catch (error) {
      console.error(`刷新缓存 ${cacheKey} 失败:`, error)
      return { success: false, error }
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
