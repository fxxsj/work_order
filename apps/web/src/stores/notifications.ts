import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { buildNotificationsWsUrl } from '../config'
import { getAuthToken } from '../lib/authToken'
import { getUnreadCount, getWsTicket } from '../api/notifications'

type WsState = 'disconnected' | 'connecting' | 'connected' | 'error'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    wsState: 'disconnected' as WsState,
    unreadCount: 0,
    lastMessageAt: null as string | null
  }),
  actions: {
    async refreshUnreadCount() {
      try {
        this.unreadCount = await getUnreadCount()
      } catch {
        // ignore
      }
    },
    async connectIfNeeded() {
      if (this.wsState === 'connecting' || this.wsState === 'connected') return

      const token = getAuthToken()
      if (!token) return
      this.wsState = 'connecting'

      let socket: WebSocket | null = null
      let reconnectAttempts = 0
      let reconnectTimeout: number | null = null
      let heartbeatTimer: number | null = null

      const cleanupTimers = () => {
        if (reconnectTimeout) window.clearTimeout(reconnectTimeout)
        reconnectTimeout = null
        if (heartbeatTimer) window.clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }

      const scheduleReconnect = () => {
        cleanupTimers()
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000)
        reconnectAttempts += 1
        reconnectTimeout = window.setTimeout(() => void connect(), delay)
      }

      const startHeartbeat = () => {
        if (heartbeatTimer) window.clearInterval(heartbeatTimer)
        heartbeatTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000)
      }

      const buildUrl = async () => {
        try {
          const ticket = await getWsTicket()
          return buildNotificationsWsUrl({ ticket })
        } catch {
          return buildNotificationsWsUrl({ token })
        }
      }

      const connect = async () => {
        try {
          const url = await buildUrl()
          if (!url) {
            this.wsState = 'disconnected'
            return
          }
          socket = new WebSocket(url)

          socket.onopen = () => {
            this.wsState = 'connected'
            reconnectAttempts = 0
            startHeartbeat()
          }

          socket.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data)
              if (msg.type === 'notification' && msg.data) {
                this.lastMessageAt = new Date().toISOString()
                this.unreadCount += 1
                ElMessage.info(msg.data.title || '收到新通知')
              }
            } catch {
              // ignore
            }
          }

          socket.onclose = () => {
            this.wsState = 'disconnected'
            cleanupTimers()
            scheduleReconnect()
          }

          socket.onerror = () => {
            this.wsState = 'error'
          }
        } catch {
          this.wsState = 'error'
          scheduleReconnect()
        }
      }

      void connect()
    }
  }
})
