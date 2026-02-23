import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getApiBaseUrl } from '../config'
import { clearAuthToken, getAuthToken } from './authToken'
import { redirectToLoginWithRedirect } from '../utils/navigation'

export function getHttpErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data
  if (typeof data?.error === 'string') return data.error
  if (typeof data?.detail === 'string') return data.detail
  if (data && typeof data === 'object') {
    try {
      return JSON.stringify(data)
    } catch {
      // ignore
    }
  }
  return error?.message || fallback
}

export const http = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  withCredentials: true
})

http.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

let lastNetworkErrorToastAt = 0
let lastNetworkErrorToastMessage = ''

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status
    if (status === 401) {
      clearAuthToken()
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (!currentPath.includes('/login')) {
        redirectToLoginWithRedirect(currentPath)
      }
    } else if (!error?.response) {
      const message = getHttpErrorMessage(error, '网络异常，请稍后重试')
      const now = Date.now()
      if (message !== lastNetworkErrorToastMessage || now - lastNetworkErrorToastAt > 3000) {
        lastNetworkErrorToastMessage = message
        lastNetworkErrorToastAt = now
        ElMessage.error(message)
      }
    }
    return Promise.reject(error)
  }
)
