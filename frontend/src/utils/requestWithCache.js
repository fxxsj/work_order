/**
 * 带缓存的请求封装
 * P2 性能优化 - axios 请求拦截器集成缓存
 */

import axios from 'axios'
import apiCache from './apiCache'
import { MessageBox } from 'element-ui'

// 创建 axios 实例
const service = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000
})

/**
 * 缓存配置
 */
const cacheConfig = {
  // 默认缓存时间（毫秒）
  defaultTTL: 5 * 60 * 1000, // 5 分钟

  // 不缓存的 URL 模式
  excludePatterns: [],

  // 需要缓存的 URL 模式及其 TTL
  includePatterns: {
    // 部门列表 - 缓存 10 分钟
    '/departments/': 10 * 60 * 1000,
    // 工序列表 - 缓存 10 分钟
    '/processes/': 10 * 60 * 1000,
    // 客户列表 - 缓存 5 分钟
    '/customers/': 5 * 60 * 1000,
    // 产品列表 - 缓存 5 分钟
    '/products/': 5 * 60 * 1000,
    // 物料列表 - 缓存 5 分钟
    '/materials/': 5 * 60 * 1000
  }
}

/**
 * 判断是否应该缓存该请求
 * @param {object} config - axios 请求配置
 * @returns {boolean} 是否缓存
 */
function shouldCache(config) {
  // 只缓存 GET 请求
  if (config.method !== 'get') {
    return false
  }

  const url = config.url

  // 检查是否在排除列表中
  for (const pattern of cacheConfig.excludePatterns) {
    if (url.includes(pattern)) {
      return false
    }
  }

  // 检查是否在包含列表中
  for (const pattern in cacheConfig.includePatterns) {
    if (url.includes(pattern)) {
      return true
    }
  }

  // 默认不缓存
  return false
}

/**
 * 获取缓存 TTL
 * @param {string} url - 请求 URL
 * @returns {number} TTL（毫秒）
 */
function getCacheTTL(url) {
  for (const pattern in cacheConfig.includePatterns) {
    if (url.includes(pattern)) {
      return cacheConfig.includePatterns[pattern]
    }
  }
  return cacheConfig.defaultTTL
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // 如果应该缓存，先检查缓存
    if (shouldCache(config)) {
      const cacheKey = apiCache.generateKey(config.url, config.params, config.method)

      if (cacheKey) {
        const cachedData = apiCache.get(cacheKey)
        if (cachedData) {
          console.log('[API Cache] Hit:', cacheKey)

          // 返回缓存的数据
          config.adapter = () => Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK (Cached)',
            headers: {},
            config,
            request: {},
            fromCache: true
          })
        }
      }
    }

    return config
  },
  (error) => {
    console.error('[Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 如果响应来自缓存，直接返回
    if (response.fromCache) {
      return response
    }

    // 如果应该缓存，保存到缓存
    if (shouldCache(response.config)) {
      const cacheKey = apiCache.generateKey(
        response.config.url,
        response.config.params,
        response.config.method
      )

      if (cacheKey) {
        const ttl = getCacheTTL(response.config.url)
        apiCache.set(cacheKey, response.data, ttl)
        console.log('[API Cache] Set:', cacheKey, 'TTL:', ttl / 1000, 's')
      }
    }

    return response
  },
  (error) => {
    console.error('[Response Error]', error)

    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response

      switch (status) {
        case 401:
          // 未授权，跳转到登录页
          MessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
          })
          break

        case 403:
          // 无权限
          MessageBox.alert('您没有权限执行此操作', '权限不足', {
            type: 'error'
          })
          break

        case 404:
          // 资源不存在
          console.error('[API] 资源不存在:', error.config.url)
          break

        case 500:
          // 服务器错误
          MessageBox.alert('服务器错误，请稍后重试', '错误', {
            type: 'error'
          })
          break

        default:
          // 其他错误
          {
            const message = data?.message || data?.detail || '请求失败，请稍后重试'
            MessageBox.alert(message, '错误', {
              type: 'error'
            })
          }
          break
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      MessageBox.alert('网络错误，请检查您的网络连接', '网络错误', {
        type: 'error'
      })
    } else {
      // 请求配置出错
      MessageBox.alert('请求配置错误', '错误', {
        type: 'error'
      })
    }

    return Promise.reject(error)
  }
)

/**
 * 清除所有缓存
 */
export function clearAllCache() {
  apiCache.clear()
  console.log('[API Cache] Cleared all cache')
}

/**
 * 清除指定 URL 模式的缓存
 * @param {string} pattern - URL 模式
 */
export function clearCacheByPattern(pattern) {
  apiCache.clearPattern(pattern)
  console.log('[API Cache] Cleared cache pattern:', pattern)
}

/**
 * 获取缓存统计
 * @returns {object} 缓存统计信息
 */
export function getCacheStats() {
  return apiCache.getStats()
}

export default service
