/**
 * Vuex 性能优化工具
 * P2 性能优化 - 减少 Vuex 响应式开销
 */

/**
 * 创建冻结状态（不可变数据）
 * 冻结的对象不会被 Vue 转换为响应式，减少性能开销
 * @param {any} data - 要冻结的数据
 * @returns {any} 冻结后的数据
 */
export function freezeState(data) {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境使用 Object.freeze
    if (data && typeof data === 'object') {
      return Object.freeze(data)
    }
  }
  return data
}

/**
 * 创建浅冻结状态
 * 只冻结第一层属性，深层属性仍然可变
 * @param {any} data - 要冻结的数据
 * @returns {any} 冻结后的数据
 */
export function shallowFreeze(data) {
  if (process.env.NODE_ENV === 'production') {
    if (data && typeof data === 'object' && !Object.isFrozen(data)) {
      Object.freeze(data)
    }
  }
  return data
}

/**
 * 批量提交 mutations
 * 减少组件多次 commit 造成的重复渲染
 * @param {Object} store - Vuex store 实例
 * @param {Array} mutations - mutation 数组 [{ type, payload }]
 */
export function batchCommit(store, mutations) {
  store._committing = true

  try {
    mutations.forEach(({ type, payload }) => {
      store.commit(type, payload)
    })
  } finally {
    store._committing = false
  }
}

/**
 * 创建带缓存的 getter
 * 使用记忆化避免重复计算
 * @param {Function} getter - getter 函数
 * @param {Function} keyGenerator - 缓存键生成函数
 * @returns {Function} 带缓存的 getter
 */
export function createCachedGetter(getter, keyGenerator = (...args) => JSON.stringify(args)) {
  const cache = new Map()

  return (...args) => {
    const key = keyGenerator(...args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = getter(...args)
    cache.set(key, result)

    // 限制缓存大小
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    return result
  }
}

/**
 * 创建带缓存的选择器
 * 用于从 store 中选择数据
 * @param {Function} selector - 选择器函数
 * @returns {Function} 带缓存的选择器
 */
export function createSelector(selector) {
  let lastResult
  let lastArgs

  return (...args) => {
    // 检查参数是否变化
    const argsChanged = !lastArgs || args.some((arg, i) => arg !== lastArgs[i])

    if (!argsChanged) {
      return lastResult
    }

    lastArgs = args
    lastResult = selector(...args)
    return lastResult
  }
}

/**
 * 创建局部状态
 * 避免将所有状态都放在 Vuex 中
 * @param {Object} initialState - 初始状态
 * @returns {Object} 局部状态对象
 */
export function createLocalState(initialState = {}) {
  let state = { ...initialState }

  return {
    getState() {
      return state
    },
    setState(newState) {
      state = { ...state, ...newState }
    },
    resetState() {
      state = { ...initialState }
    }
  }
}

/**
 * 监听 store 变化（带防抖）
 * 减少频繁的 watch 回调
 * @param {Object} store - Vuex store
 * @param {Function} getter - getter 函数
 * @param {Function} callback - 回调函数
 * @param {Object} options - 选项
 * @returns {Function} 取消监听函数
 */
export function watchWithDebounce(store, getter, callback, options = {}) {
  const { debounceMs = 300, immediate = false } = options

  let timeoutId = null
  let lastValue = getter(store.state, store.getters)

  const debouncedCallback = (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      callback(newValue, lastValue)
      lastValue = newValue
    }, debounceMs)
  }

  const unwatch = store.watch(
    (state, getters) => getter(state, getters),
    debouncedCallback,
    { immediate }
  )

  // 返回取消监听函数
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    unwatch()
  }
}

/**
 * 创建模块化的 action
 * 帮助创建可复用的 action
 * @param {Function} handler - action 处理函数
 * @returns {Function} action 函数
 */
export function createAction(handler) {
  return async ({ commit, dispatch, state, getters, rootState, rootGetters }, payload) => {
    try {
      const result = await handler(
        { commit, dispatch, state, getters, rootState, rootGetters },
        payload
      )
      return { success: true, data: result }
    } catch (error) {
      console.error('Action error:', error)
      return { success: false, error }
    }
  }
}

/**
 * 创建带加载状态的 action
 * @param {Function} handler - action 处理函数
 * @param {String} loadingKey - loading state 的 key
 * @returns {Function} action 函数
 */
export function createLoadingAction(handler, loadingKey = 'loading') {
  return createAction(async ({ commit }, payload) => {
    commit(`SET_${loadingKey}`, true)

    try {
      const result = await handler({ commit }, payload)
      return result
    } finally {
      commit(`SET_${loadingKey}`, false)
    }
  })
}

export default {
  freezeState,
  shallowFreeze,
  batchCommit,
  createCachedGetter,
  createSelector,
  createLocalState,
  watchWithDebounce,
  createAction,
  createLoadingAction
}
