/**
 * Vuex Store 主文件
 * 模块化状态管理
 */

import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

// 导入模块
import user from './modules/user'
import ui from './modules/ui'
import workOrder from './modules/workOrder'
import task from './modules/task'
import cache from './modules/cache'

Vue.use(Vuex)

const store = new Vuex.Store({
  // 模块
  modules: {
    user,
    ui,
    workOrder,
    task,
    cache
  },

  // 全局 state（用于跨模块的共享状态）
  state: {
    appVersion: '2.0.0',
    lastUpdate: null
  },

  // 全局 getters
  getters: {
    // 应用版本
    appVersion: (state) => state.appVersion,

    // 是否已初始化
    isInitialized: (state) => state.lastUpdate !== null
  },

  // 全局 mutations
  mutations: {
    SET_LAST_UPDATE(state, timestamp) {
      state.lastUpdate = timestamp
    }
  },

  // 全局 actions
  actions: {
    // 初始化应用
    async initApp({ dispatch, commit }) {
      try {
        // 恢复用户会话
        await dispatch('user/restoreSession')

        // 设置初始化时间
        commit('SET_LAST_UPDATE', Date.now())

        return { success: true }
      } catch (error) {
        console.error('应用初始化失败:', error)
        return { success: false, error }
      }
    },

    // 重置所有状态
    resetAll({ dispatch }) {
      dispatch('user/clearUser')
      dispatch('workOrder/clearSelection')
      dispatch('task/clearSelection')
      dispatch('cache/clearAllCaches')
    }
  },

  // 插件
  plugins: [
    // 持久化配置
    createPersistedState({
      key: 'workorder-v2',
      paths: [
        // 持久化用户模块
        'user.currentUser',
        'user.isAuthenticated',
        'user.permissions',
        'user.roles',

        // 持久化 UI 状态
        'ui.sidebarCollapsed',

        // 持久化任务视图模式
        'task.viewMode',

        // 持久化缓存（带过期时间检查）
        'cache.customerList',
        'cache.processList',
        'cache.materialList',
        'cache.userList'
      ],
      // 存储到 sessionStorage（关闭浏览器即清除）
      storage: window.sessionStorage,

      // 过期后的数据不恢复
      getState: (key, storage) => {
        const value = storage.getItem(key)
        if (!value) return null

        try {
          const parsed = JSON.parse(value)
          const now = Date.now()

          // 检查缓存是否过期
          if (parsed.cache) {
            Object.keys(parsed.cache).forEach(cacheKey => {
              const cache = parsed.cache[cacheKey]
              if (cache.timestamp && now - cache.timestamp > cache.ttl) {
                console.log(`缓存 ${cacheKey} 已过期，清除中...`)
                delete parsed.cache[cacheKey]
              }
            })
          }

          return parsed
        } catch (error) {
          console.error('解析持久化数据失败:', error)
          return null
        }
      }
    })
  ],

  // 严格模式（开发环境）
  strict: process.env.NODE_ENV !== 'production'
})

// ============ 兼容性支持 ============
// 为了平滑过渡，暂时保留旧的 getter 和 action 访问方式

// 旧代码兼容层 - 这些将在后续版本中移除
const compatLayer = {
  // 兼容旧的 userInfo 访问
  get userInfo() {
    return store.getters['user/currentUser']
  },

  // 兼容旧的 selectedWorkOrder 访问
  get selectedWorkOrder() {
    return store.getters['workOrder/selectedWorkOrder']
  },

  // 兼容旧的 processList 访问
  get processList() {
    return store.getters['cache/processList'] || []
  },

  // 兼容旧的 customerList 访问
  get customerList() {
    return store.getters['cache/customerList'] || []
  },

  // 兼容旧的 materialList 访问
  get materialList() {
    return store.getters['cache/materialList'] || []
  },

  // 兼容旧的 isSalesperson getter
  get isSalesperson() {
    return store.getters['user/hasRole']('salesperson')
  },

  // 兼容旧的 userGroups getter
  get userGroups() {
    return store.getters['user/roles']
  }
}

// 将兼容层挂载到 store 上（仅开发环境提示）
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    '[Vuex Store] 正在使用兼容性层。建议更新代码使用新的模块化 API：\n' +
    '  - store.state.userInfo → store.getters["user/currentUser"]\n' +
    '  - store.state.selectedWorkOrder → store.getters["workOrder/selectedWorkOrder"]\n' +
    '  - store.getters.isSalesperson → store.getters["user/hasRole"]("salesperson")\n' +
    '  - store.dispatch("setUserInfo", data) → store.dispatch("user/setUserInfo", data)'
  )
}

// 导出包装后的 store
export default store

// 导出类型定义（用于 TypeScript）
export type { Store } from 'vuex'
