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
    // 添加 CSRF Token
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
  response => {
    return response.data
  },
  error => {
    // 对响应错误做点什么
    console.error('Response error:', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        // 清除用户信息
        store.dispatch('setUserInfo', null)
        
        // 如果不是登录页面且不是获取用户信息接口，跳转到登录页
        if (router.currentRoute.path !== '/login' && !error.config.url.includes('/auth/user/')) {
          Message.error('登录已过期，请重新登录')
          router.push({
            path: '/login',
            query: { redirect: router.currentRoute.fullPath }
          })
        }
      } else if (status === 403) {
        // 如果不是登录页面，才显示错误提示
        if (router.currentRoute.path !== '/login') {
          Message.error('没有权限执行此操作')
        }
      } else if (status === 404) {
        Message.error('请求的资源不存在')
      } else if (status === 500) {
        Message.error('服务器错误')
      } else {
        Message.error(data.detail || data.error || '请求失败')
      }
    } else {
      Message.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default service

