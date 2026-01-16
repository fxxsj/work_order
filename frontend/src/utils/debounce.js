/**
 * 防抖工具函数
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout

  return function executedFunction(...args) {
    const context = this

    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(context, args)
  }
}

/**
 * 节流工具函数
 * 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效
 * @param {Function} func - 要节流的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, wait = 300) {
  let timeout
  let previous = 0

  return function executedFunction(...args) {
    const context = this
    const now = Date.now()

    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(context, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(context, args)
      }, remaining)
    }
  }
}

/**
 * Vue Mixin：自动为搜索方法添加防抖
 * 使用方式：
 * 1. 在组件中导入此 mixin
 * 2. 定义 handleSearch 方法
 * 3. 在模板中使用 @input="handleSearchDebounced"
 */
export const searchDebounceMixin = {
  data() {
    return {
      searchDebounceWait: 300
    }
  },

  created() {
    // 自动为 handleSearch 方法创建防抖版本
    if (this.handleSearch) {
      this.handleSearchDebounced = debounce(this.handleSearch, this.searchDebounceWait)
    }
  }
}

export default {
  debounce,
  throttle,
  searchDebounceMixin
}
