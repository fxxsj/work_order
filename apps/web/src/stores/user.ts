import { defineStore } from 'pinia'
import { http } from '../lib/http'
import { clearAuthToken, getAuthToken, setAuthToken } from '../lib/authToken'

export type UserPayload = {
  id: number
  username: string
  token: string
  permissions?: string[]
  groups?: string[]
  is_superuser?: boolean
}

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as UserPayload | null,
    authToken: getAuthToken()
  }),
  getters: {
    isAuthenticated: (state) => !!state.authToken
  },
  actions: {
    async login(username: string, password: string) {
      const res = await http.post('/auth/login/', { username, password })
      const payload = res.data as UserPayload

      if (!payload?.token) {
        throw new Error('登录失败：未返回 token')
      }

      this.currentUser = payload
      this.authToken = payload.token
      setAuthToken(payload.token)
    },
    async fetchCurrentUser() {
      if (!this.authToken) return
      const res = await http.get('/auth/user/')
      this.currentUser = { ...(this.currentUser || {}), ...(res.data as any) }
    },
    logout() {
      this.currentUser = null
      this.authToken = null
      clearAuthToken()
    }
  }
})
