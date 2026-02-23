import axios from 'axios'
import { getApiBaseUrl } from '../config'
import { clearAuthToken, getAuthToken } from './authToken'
import { redirectToLoginWithRedirect } from '../utils/navigation'

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
    }
    return Promise.reject(error)
  }
)
