/**
 * Service 层基础类
 *
 * 提供统一的业务逻辑处理框架，将业务逻辑从 Vue 组件中分离
 * 提高代码可维护性和可测试性
 */

/**
 * 基础 Service 类
 * 提供通用的业务逻辑处理方法
 */
class BaseService {
  /**
   * 构造函数
   * @param {Object} apiClient - API 客户端实例
   */
  constructor(apiClient) {
    this.apiClient = apiClient
    this.loading = false
    this.error = null
  }

  /**
   * 处理 API 错误
   * @param {Error} error - 错误对象
   * @returns {string} 用户友好的错误消息
   */
  handleError(error) {
    console.error('Service Error:', error)

    if (error.response) {
      // 服务器返回错误响应
      const { status, data } = error.response

      switch (status) {
        case 400:
          return data.error || data.detail || '请求参数错误'
        case 401:
          return '未授权，请重新登录'
        case 403:
          return '没有权限执行此操作'
        case 404:
          return '请求的资源不存在'
        case 409:
          return data.error || '数据已被其他用户修改，请刷新后重试'
        case 500:
          return '服务器错误，请稍后重试'
        default:
          return data.error || data.detail || `服务器错误 (${status})`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      return '网络错误，请检查网络连接'
    } else {
      // 发生了触发请求错误的问题
      return error.message || '未知错误'
    }
  }

  /**
   * 执行 API 请求并处理通用逻辑
   * @param {Function} apiCall - API 调用函数
   * @param {Object} options - 选项
   * @param {boolean} options.showLoading - 是否显示加载状态
   * @param {boolean} options.showError - 是否显示错误消息
   * @param {Function} options.errorMessage - 自定义错误消息处理
   * @returns {Promise} API 调用结果
   */
  async execute(apiCall, options = {}) {
    const {
      showLoading = true,
      showError = true,
      errorMessage = null
    } = options

    if (showLoading) {
      this.loading = true
      this.error = null
    }

    try {
      const result = await apiCall()
      return { success: true, data: result.data }
    } catch (error) {
      const errorMsg = errorMessage
        ? errorMessage(error)
        : this.handleError(error)

      this.error = errorMsg

      if (showError) {
        // 可以在这里集成全局错误提示组件
        console.error('API Error:', errorMsg)
      }

      return {
        success: false,
        error: errorMsg,
        data: null
      }
    } finally {
      if (showLoading) {
        this.loading = false
      }
    }
  }

  /**
   * 批量执行多个 API 请求
   * @param {Array<Function>} apiCalls - API 调用函数数组
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 所有请求的结果
   */
  async executeBatch(apiCalls, options = {}) {
    const { stopOnError = true } = options
    const results = []

    for (const apiCall of apiCalls) {
      const result = await this.execute(apiCall, options)
      results.push(result)

      if (!result.success && stopOnError) {
        break
      }
    }

    return results
  }

  /**
   * 分页数据处理
   * @param {Array} items - 所有数据项
   * @param {number} page - 当前页码
   * @param {number} pageSize - 每页大小
   * @returns {Object} 分页结果
   */
  paginate(items, page = 1, pageSize = 20) {
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      data: items.slice(start, end),
      total: items.length,
      page,
      pageSize,
      totalPages: Math.ceil(items.length / pageSize)
    }
  }

  /**
   * 数据排序
   * @param {Array} items - 数据项
   * @param {string} field - 排序字段
   * @param {string} order - 排序方向 'asc' | 'desc'
   * @returns {Array} 排序后的数据
   */
  sort(items, field, order = 'asc') {
    return [...items].sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'string') {
        return order === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return order === 'asc' ? aVal - bVal : bVal - aVal
    })
  }

  /**
   * 数据过滤
   * @param {Array} items - 数据项
   * @param {Object} filters - 过滤条件
   * @returns {Array} 过滤后的数据
   */
  filter(items, filters) {
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          return true
        }

        const itemValue = item[key]

        // 支持模糊匹配（字符串）
        if (typeof value === 'string' && typeof itemValue === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase())
        }

        // 支持数组包含
        if (Array.isArray(value)) {
          return value.includes(itemValue)
        }

        // 精确匹配
        return itemValue === value
      })
    })
  }

  /**
   * 深度克隆对象
   * @param {*} obj - 要克隆的对象
   * @returns {*} 克隆后的对象
   */
  clone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }

    if (obj instanceof Array) {
      return obj.map(item => this.clone(item))
    }

    if (obj instanceof Object) {
      const clonedObj = {}
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          clonedObj[key] = this.clone(obj[key])
        }
      }
      return clonedObj
    }
  }

  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  debounce(func, delay = 300) {
    let timeoutId = null
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(this, args)
      }, delay)
    }
  }

  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} interval - 时间间隔（毫秒）
   * @returns {Function} 节流后的函数
   */
  throttle(func, interval = 300) {
    let lastTime = 0
    return (...args) => {
      const now = Date.now()
      if (now - lastTime >= interval) {
        lastTime = now
        func.apply(this, args)
      }
    }
  }
}

export default BaseService
