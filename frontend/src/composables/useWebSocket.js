/**
 * WebSocket Composable for Vue 2.7
 * 管理 WebSocket 连接，支持自动重连、心跳检测和跨标签页同步
 *
 * 用法（在 Options API 组件中）:
 * import { useWebSocket } from '@/composables/useWebSocket'
 * export default {
 *   ...useWebSocket(),
 *   mounted() {
 *     this.setupWebSocket(this.$store)
 *   }
 * }
 */
import { ref } from 'vue'

const BROADCAST_CHANNEL_NAME = 'notification-sync'

export function useWebSocket() {
  // 返回 data 函数
  const data = () => ({
    isConnected: false,
    isConnecting: false,
    hasError: false,
    connectionState: 'disconnected'
  })

  // WebSocket 实例变量（非响应式）
  let socket = null
  let reconnectAttempts = 0
  let reconnectTimeout = null
  let heartbeatInterval = null
  let broadcastChannel = null

  // 构建WebSocket URL
  const buildWebSocketUrl = (store) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = process.env.VUE_APP_WS_HOST || window.location.host
    const token = store.getters['user/token']
    return `${protocol}//${host}/ws/notifications/?token=${token}`
  }

  // 处理接收到的消息
  const handleMessage = (data, store) => {
    switch (data.type) {
      case 'connection_established':
        console.log('[WebSocket] Connection established for user:', data.user_id)
        break
      case 'notification':
        if (data.data) {
          store.dispatch('notification/addNotification', data.data)
          // 跨标签页同步
          broadcastChannel?.postMessage({
            type: 'new_notification',
            data: data.data
          })
        }
        break
      case 'heartbeat':
        // 心跳响应
        break
    }
  }

  // 指数退避重连 (1s, 2s, 4s, 8s, ... max 60s)
  const scheduleReconnect = (store) => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000)
    reconnectAttempts++

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)

    reconnectTimeout = setTimeout(() => {
      connect(store)
    }, delay)
  }

  const startHeartbeat = () => {
    stopHeartbeat()
    heartbeatInterval = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }

  const connect = (store) => {
    if (socket?.readyState === WebSocket.OPEN) {
      return
    }

    store.isConnected = false
    store.isConnecting = true
    store.connectionState = 'connecting'

    try {
      socket = new WebSocket(buildWebSocketUrl(store))

      socket.onopen = () => {
        console.log('[WebSocket] Connected')
        store.isConnected = true
        store.isConnecting = false
        store.hasError = false
        store.connectionState = 'connected'
        reconnectAttempts = 0
        startHeartbeat()
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data, store)
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e)
        }
      }

      socket.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code)
        store.isConnected = false
        store.isConnecting = false
        store.connectionState = 'disconnected'
        stopHeartbeat()
        scheduleReconnect(store)
      }

      socket.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        store.isConnected = false
        store.isConnecting = false
        store.hasError = true
        store.connectionState = 'error'
      }
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error)
      store.isConnected = false
      store.isConnecting = false
      store.hasError = true
      store.connectionState = 'error'
      scheduleReconnect(store)
    }
  }

  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    stopHeartbeat()
    if (socket) {
      socket.close()
      socket = null
    }
    store.isConnected = false
    store.connectionState = 'disconnected'
  }

  const setupBroadcastChannel = (store) => {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'new_notification') {
        store.dispatch('notification/addNotification', event.data.data)
      } else if (event.data.type === 'mark_read') {
        store.dispatch('notification/decrementUnreadCount')
      }
    }
  }

  const cleanupBroadcastChannel = () => {
    if (broadcastChannel) {
      broadcastChannel.close()
      broadcastChannel = null
    }
  }

  // 返回混合对象，在 Options API 中展开使用
  return {
    data,
    methods: {
      connect(store) {
        connect(store)
      },
      disconnect() {
        disconnect()
      },
      setupWebSocket(store) {
        setupBroadcastChannel(store)
        if (store.getters['user/isAuthenticated']) {
          connect(store)
        }
      },
      cleanupWebSocket() {
        disconnect()
        cleanupBroadcastChannel()
      }
    }
  }
}

export default useWebSocket
