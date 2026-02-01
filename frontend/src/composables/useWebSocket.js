/**
 * WebSocket Composable
 * 管理 WebSocket 连接，支持自动重连、心跳检测和跨标签页同步
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useStore } from 'vuex'

const BROADCAST_CHANNEL_NAME = 'notification-sync'

export function useWebSocket() {
  const store = useStore()
  const socket = ref(null)
  const connectionState = ref('disconnected')
  const reconnectAttempts = ref(0)
  const reconnectTimeout = ref(null)
  const heartbeatInterval = ref(null)
  const broadcastChannel = ref(null)

  // 构建WebSocket URL
  const buildWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = process.env.VUE_APP_WS_HOST || window.location.host
    const token = store.getters['user/authToken']
    return `${protocol}//${host}/ws/notifications/?token=${token}`
  }

  // 连接WebSocket
  const connect = () => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      return
    }

    connectionState.value = 'connecting'

    try {
      socket.value = new WebSocket(buildWebSocketUrl())

      socket.value.onopen = () => {
        console.log('[WebSocket] Connected')
        connectionState.value = 'connected'
        reconnectAttempts.value = 0
        startHeartbeat()
      }

      socket.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e)
        }
      }

      socket.value.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code)
        connectionState.value = 'disconnected'
        stopHeartbeat()
        scheduleReconnect()
      }

      socket.value.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        connectionState.value = 'error'
      }
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error)
      connectionState.value = 'error'
      scheduleReconnect()
    }
  }

  // 处理接收到的消息
  const handleMessage = (data) => {
    switch (data.type) {
      case 'connection_established':
        console.log('[WebSocket] Connection established for user:', data.user_id)
        break
      case 'notification':
        if (data.data) {
          store.dispatch('notification/addNotification', data.data)
          // 跨标签页同步
          broadcastChannel.value?.postMessage({
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
  const scheduleReconnect = () => {
    if (reconnectTimeout.value) {
      clearTimeout(reconnectTimeout.value)
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 60000)
    reconnectAttempts.value++

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.value})`)

    reconnectTimeout.value = setTimeout(() => {
      connect()
    }, delay)
  }

  const startHeartbeat = () => {
    stopHeartbeat()
    heartbeatInterval.value = setInterval(() => {
      if (socket.value?.readyState === WebSocket.OPEN) {
        socket.value.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }

  const disconnect = () => {
    if (reconnectTimeout.value) {
      clearTimeout(reconnectTimeout.value)
      reconnectTimeout.value = null
    }
    stopHeartbeat()
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    connectionState.value = 'disconnected'
  }

  const setupBroadcastChannel = () => {
    broadcastChannel.value = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    broadcastChannel.value.onmessage = (event) => {
      if (event.data.type === 'new_notification') {
        store.dispatch('notification/addNotification', event.data.data)
      } else if (event.data.type === 'mark_read') {
        store.dispatch('notification/decrementUnreadCount')
      }
    }
  }

  const cleanupBroadcastChannel = () => {
    if (broadcastChannel.value) {
      broadcastChannel.value.close()
      broadcastChannel.value = null
    }
  }

  const isConnected = computed(() => connectionState.value === 'connected')
  const isConnecting = computed(() => connectionState.value === 'connecting')
  const hasError = computed(() => connectionState.value === 'error')

  onMounted(() => {
    setupBroadcastChannel()
    if (store.getters['user/isAuthenticated']) {
      connect()
    }
  })

  onUnmounted(() => {
    disconnect()
    cleanupBroadcastChannel()
  })

  return {
    connectionState: connectionState.value,
    isConnected,
    isConnecting,
    hasError,
    connect,
    disconnect,
    reconnectAttempts
  }
}

export default useWebSocket
