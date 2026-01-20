import axios from 'axios'
import { Message } from 'element-ui'
import router from '@/router'
import store from '@/store'

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

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken'
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 添加认证 Token
    const token = store.getters['user/authToken']
    if (token) {
      config.headers['Authorization'] = `Token ${token}`
    }

    // 添加 CSRF Token（用于 SessionAuthentication）
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }

    return config
  },
  error => {
    // 对请求错误做些什么
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => response.data,
  error => {
    // 对响应错误做点什么
    console.error('Response error:', error)

    if (error.response) {
      const { status, data } = error.response

      if (status === 401) {
        // 清除用户信息（使用新的模块化 API）
        store.dispatch('user/clearUser')

        // 如果不是登录页面且不是获取用户信息接口，跳转到登录页
        if (router.currentRoute.path !== '/login' && !error.config?.url?.includes('/auth/user/')) {
          // 显示友好的错误提示
          Message({
            message: '登录已过期，请重新登录',
            type: 'warning',
            duration: 2000,
            showClose: true
          })

          // 跳转到登录页，携带当前路径作为重定向参数
          router.push({
            path: '/login',
            query: { redirect: router.currentRoute.fullPath }
          })
        }
      } else if (status === 403) {
        // 如果不是登录页面，才显示错误提示
        // 但对于某些辅助操作（如工序、物料），不显示错误消息，因为这些错误已经在业务逻辑中处理
        if (router.currentRoute.path !== '/login') {
          // 检查是否是辅助操作的 API（工序、物料等），这些错误已经在业务逻辑中静默处理
          const url = error.config?.url || ''
          const isAuxiliaryOperation = url.includes('/workorder-processes/') ||
                                       url.includes('/workorder-materials/') ||
                                       url.includes('/workorder-products/')

          if (!isAuxiliaryOperation) {
            Message({
              message: data.detail || data.error || '没有权限执行此操作',
              type: 'error',
              duration: 3000,
              showClose: true
            })
          }
        }
      } else if (status === 404) {
        Message({
          message: '请求的资源不存在',
          type: 'error',
          duration: 3000,
          showClose: true
        })
      } else if (status === 500) {
        Message({
          message: '服务器错误，请稍后重试',
          type: 'error',
          duration: 3000,
          showClose: true
        })
      } else {
        Message({
          message: data.detail || data.error || data.message || '请求失败',
          type: 'error',
          duration: 3000,
          showClose: true
        })
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      Message({
        message: '网络连接失败，请检查网络设置',
        type: 'error',
        duration: 3000,
        showClose: true
      })
    } else {
      // 请求配置出错
      Message({
        message: '请求配置错误: ' + error.message,
        type: 'error',
        duration: 3000,
        showClose: true
      })
    }

    return Promise.reject(error)
  }
)

export default service

