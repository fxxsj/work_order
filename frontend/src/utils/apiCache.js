/**
 * API 请求缓存工具
 * P2 性能优化 - 减少 API 重复请求
 */

class APICache {
  constructor() {
    this.cache = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 默认缓存 5 分钟
    this.maxCacheSize = 100 // 最大缓存条目数
  }

  /**
   * 生成缓存键
   * @param {string} url - 请求 URL
   * @param {object} params - 请求参数
   * @param {string} method - 请求方法
   * @returns {string} 缓存键
   */
  generateKey(url, params = {}, method = 'GET') {
    // 只缓存 GET 请求
    if (method !== 'GET') return null

    // 将参数排序后序列化
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {})

    return `${method}:${url}:${JSON.stringify(sortedParams)}`
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存的数据或 null
   */
  get(key) {
    if (!key || !this.cache.has(key)) {
      return null
    }

    const cached = this.cache.get(key)

    // 检查是否过期
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * 设置缓存数据
   * @param {string} key - 缓存键
   * @param {any} data - 要缓存的数据
   * @param {number} ttl - 缓存时间（毫秒）
   */
  set(key, data, ttl = this.defaultTTL) {
    if (!key) return

    // 限制缓存大小
    if (this.cache.size >= this.maxCacheSize) {
      // 删除最旧的缓存
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    })
  }

  /**
   * 清除指定缓存
   * @param {string} key - 缓存键
   */
  clear(key) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * 清除指定 URL 模式的所有缓存
   * @param {string} pattern - URL 模式（支持通配符 *）
   */
  clearPattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'))

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {object} 缓存统计
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// 创建单例
const apiCache = new APICache()

// 定期清理过期缓存（每分钟）
setInterval(() => {
  apiCache.cleanup()
}, 60 * 1000)

export default apiCache
