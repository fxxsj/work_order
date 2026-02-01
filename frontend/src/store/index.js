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
import notification from './modules/notification'

Vue.use(Vuex)

const store = new Vuex.Store({
  // 模块
  modules: {
    user,
    ui,
    workOrder,
    task,
    cache,
    notification
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

// ============ 开发环境提示 ============
// 提示开发者使用新的模块化 API
if (process.env.NODE_ENV !== 'production') {
  console.info(
    '[Vuex Store] 模块化架构已启用。\n' +
    '使用命名空间访问模块：\n' +
    '  - store.getters["user/currentUser"]\n' +
    '  - store.getters["user/isAuthenticated"]\n' +
    '  - store.dispatch("user/initUser", data)\n'
  )
}

// 导出 store
export default store
