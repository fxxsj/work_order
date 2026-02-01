/**
 * WebSocket Composable for Vue 2.7
 * 管理 WebSocket 连接，支持自动重连、心跳检测和跨标签页同步
 *
 * 用法（在 Options API 组件中）:
 * import { useWebSocket } from '@/composables/useWebSocket'
 * export default {
 *   data() {
 *     return {
 *       ...useWebSocket().data(),
 *       // other data
 *     }
 *   },
 *   ...useWebSocket().methods,
 *   mounted() {
 *     this.setupWebSocket(this)
 *   }
 * }
 */

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
  const buildWebSocketUrl = (component) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = process.env.VUE_APP_WS_HOST || window.location.host
    const token = component.$store.getters['user/authToken']
    return `${protocol}//${host}/ws/notifications/?token=${token}`
  }

  // 处理接收到的消息
  const handleMessage = (data, component) => {
    switch (data.type) {
      case 'connection_established':
        console.log('[WebSocket] Connection established for user:', data.user_id)
        break
      case 'notification':
        if (data.data) {
          component.$store.dispatch('notification/addNotification', data.data)
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
  const scheduleReconnect = (component) => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000)
    reconnectAttempts++

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)

    reconnectTimeout = setTimeout(() => {
      connect(component)
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

  const connect = (component) => {
    if (socket?.readyState === WebSocket.OPEN) {
      return
    }

    // Update component data (需要组件实例引用)
    // component 参数从组件的 this 传入

    try {
      socket = new WebSocket(buildWebSocketUrl(component))

      socket.onopen = () => {
        console.log('[WebSocket] Connected')
        component.isConnected = true
        component.isConnecting = false
        component.hasError = false
        component.connectionState = 'connected'
        reconnectAttempts = 0
        startHeartbeat()
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data, component)
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e)
        }
      }

      socket.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code)
        component.isConnected = false
        component.isConnecting = false
        component.connectionState = 'disconnected'
        stopHeartbeat()
        scheduleReconnect(component)
      }

      socket.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        component.isConnected = false
        component.isConnecting = false
        component.hasError = true
        component.connectionState = 'error'
      }
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error)
      component.isConnected = false
      component.isConnecting = false
      component.hasError = true
      component.connectionState = 'error'
      scheduleReconnect(component)
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
    // Note: 需要组件实例来更新状态，这里只关闭连接
  }

  const setupBroadcastChannel = (component) => {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'new_notification') {
        component.$store.dispatch('notification/addNotification', event.data.data)
      } else if (event.data.type === 'mark_read') {
        component.$store.dispatch('notification/decrementUnreadCount')
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
      connect(component) {
        connect(component)
      },
      disconnect() {
        disconnect()
      },
      setupWebSocket(component) {
        setupBroadcastChannel(component)
        if (component.$store.getters['user/isAuthenticated']) {
          connect(component)
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
