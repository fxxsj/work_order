import axios from 'axios'
import { Message } from 'element-ui'
import router from '@/router'
import store from '@/store'
import logger from '@/utils/logger'
import unwrapApiResponse from '@/utils/apiResponse'

// 获取 CSRF Token
function getCsrfToken() {
  const name = 'csrftoken'
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

// Token 刷新状态管理
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken'
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 添加 JWT access token
    const token = store.getters['user/authToken'] || localStorage.getItem('access_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`  // JWT Bearer token
    }

    // 添加 CSRF Token（用于 SessionAuthentication）
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }

    return config
  },
  error => {
    logger.error('Request error', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => response.data,
  async error => {
    const originalRequest = error.config

    logger.error('Response error', error)

    if (!error.response) {
      // 网络错误或请求超时
      Message({
        message: '网络连接失败，请检查网络设置',
        type: 'error',
        duration: 3000,
        showClose: true
      })
      return Promise.reject(error)
    }

    const { status, data } = error.response

    // 401 错误处理：尝试刷新 token
    if (status === 401 && !originalRequest._retry) {
      // 避免刷新接口自身陷入循环
      if (originalRequest?.url?.includes('/auth/refresh/')) {
        store.dispatch('user/clearUser')
        if (router.currentRoute.path !== '/login') {
          router.push({
            path: '/login',
            query: { redirect: router.currentRoute.fullPath }
          })
        }
        return Promise.reject(error)
      }
      if (isRefreshing) {
        // 如果正在刷新，加入队列等待
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return service(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // 获取 refresh token
        const refreshToken = store.getters['user/refreshToken'] || localStorage.getItem('refresh_token')

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // 调用刷新端点
        const response = await axios.post('/api/v1/auth/refresh/', {
          refresh: refreshToken
        })

        const refreshPayload = unwrapApiResponse(response.data)
        const { access, refresh: newRefresh } = refreshPayload || {}
        if (!access) {
          throw new Error('No access token in refresh response')
        }

        // 更新 store 中的 tokens
        store.dispatch('user/updateTokens', {
          access,
          refresh: newRefresh
        })

        // 处理队列中的请求
        processQueue(null, access)

        // 重试当前请求
        originalRequest.headers['Authorization'] = `Bearer ${access}`
        return service(originalRequest)

      } catch (err) {
        // 刷新失败，清除用户信息并跳转登录
        processQueue(err, null)
        store.dispatch('user/clearUser')

        // 如果不是登录页面，显示提示并跳转
        if (router.currentRoute.path !== '/login' && !originalRequest?.url?.includes('/auth/user/')) {
          Message({
            message: '登录已过期，请重新登录',
            type: 'warning',
            duration: 2000,
            showClose: true
          })

          router.push({
            path: '/login',
            query: { redirect: router.currentRoute.fullPath }
          })
        }

        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    // 401 重试后仍失败：清理登录状态，避免持续 401
    if (status === 401 && originalRequest._retry) {
      store.dispatch('user/clearUser')
      if (router.currentRoute.path !== '/login') {
        Message({
          message: '登录已过期，请重新登录',
          type: 'warning',
          duration: 2000,
          showClose: true
        })
        router.push({
          path: '/login',
          query: { redirect: router.currentRoute.fullPath }
        })
      }
      return Promise.reject(error)
    }

    // 403 错误处理
    if (status === 403) {
      if (router.currentRoute.path !== '/login') {
        const url = error.config?.url || ''
        const isAuxiliaryOperation = url.includes('/workorder-processes/') ||
                                     url.includes('/workorder-materials/') ||
                                     url.includes('/workorder-products/')

        if (!isAuxiliaryOperation) {
          Message({
            message: data.detail || data.error || '没有权限执行此操作',
            type: 'error',
            duration: 3000,
            showShow: true
          })
        }
      }
    }

    // 404 错误处理
    if (status === 404) {
      Message({
        message: '请求的资源不存在',
        type: 'error',
        duration: 3000,
        showClose: true
      })
    }

    // 500 错误处理
    if (status === 500) {
      Message({
        message: '服务器错误，请稍后重试',
        type: 'error',
        duration: 3000,
        showClose: true
      })
    }

    // 其他错误
    if (status !== 401) {
      Message({
        message: data.detail || data.error || data.message || '请求失败',
        type: 'error',
        duration: 3000,
        showClose: true
      })
    }

    return Promise.reject(error)
  }
)

export default service
