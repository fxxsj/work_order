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

// ============ 开发环境提示 ============
// 提示开发者使用新的模块化 API
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    '[Vuex Store] 已启用模块化架构。建议使用新的模块化 API：\n' +
    '  - store.state.userInfo → store.getters["user/currentUser"]\n' +
    '  - store.state.selectedWorkOrder → store.getters["workOrder/selectedWorkOrder"]\n' +
    '  - store.getters.isSalesperson → store.getters["user/hasRole"]("salesperson")\n' +
    '  - store.dispatch("setUserInfo", data) → store.dispatch("user/setUserInfo", data)\n' +
    '\n' +
    '向后兼容层已启用，旧代码仍可正常工作。'
  )
}

// 向后兼容层（添加 setUserInfo action 和 currentUser getter 支持）
const originalDispatch = store.dispatch
const originalGetters = {}

// 拦截 getters 访问，添加向后兼容
Object.defineProperty(store, 'getters', {
  get() {
    // 合并模块化的 getters 和向后兼容的 getters
    const moduleGetters = store._getters || {}
    return new Proxy(moduleGetters, {
      get(target, prop) {
        // 如果访问的是旧的非命名空间 getter，重定向到新的命名空间 getter
        if (prop === 'currentUser' || prop === 'userInfo') {
          console.log(`[Vuex Store] 向后兼容: getters.${prop} → getters["user/currentUser"]`)
          return target['user/currentUser']
        }
        if (prop === 'isAuthenticated') {
          console.log(`[Vuex Store] 向后兼容: getters.${prop} → getters["user/isAuthenticated"]`)
          return target['user/isAuthenticated']
        }
        if (prop === 'isSalesperson') {
          console.log(`[Vuex Store] 向后兼容: getters.${prop} → getters["user/isSalesperson"]`)
          return target['user/isSalesperson']
        }
        // 其他 getter 正常返回
        return target[prop]
      }
    })
  },
  set(value) {
    store._getters = value
  }
})

store.dispatch = function(action, payload) {
  // 拦截 setUserInfo 调用并重定向到 initUser
  if (action === 'user/setUserInfo') {
    console.warn('[Vuex Store] 检测到过时的 setUserInfo 调用，正在重定向到 user/initUser')
    return originalDispatch.call(store, 'user/initUser', payload)
  }
  // 其他 action 正常处理
  return originalDispatch.call(store, action, payload)
}

// 导出 store
export default store
