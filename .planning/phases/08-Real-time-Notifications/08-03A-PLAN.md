---
phase: 08-Real-time-Notifications
plan: 03A
type: execute
wave: 2
depends_on: ["08-01B", "08-02B"]
files_modified:
  - frontend/package.json
  - frontend/src/api/modules/notification.js
  - frontend/src/api/modules/index.js
  - frontend/src/composables/useWebSocket.js
  - frontend/src/store/modules/notification.js
  - frontend/src/store/index.js
autonomous: true

must_haves:
  truths:
    - "WebSocket connects automatically when user is authenticated"
    - "WebSocket reconnects with exponential backoff after disconnect"
    - "BroadcastChannel synchronizes notifications across browser tabs"
    - "Notification store persists unread count to localStorage"
    - "Unread count badge shows 99+ when count exceeds 99"
  artifacts:
    - path: "frontend/src/api/modules/notification.js"
      provides: "Notification API client"
      contains: "markAsRead", "markAllAsRead", "getUnreadCount"
    - path: "frontend/src/composables/useWebSocket.js"
      provides: "WebSocket connection management composable"
      contains: "useWebSocket", "connect", "disconnect", "BroadcastChannel"
    - path: "frontend/src/store/modules/notification.js"
      provides: "Vuex store for notifications"
      contains: "ADD_NOTIFICATION", "MARK_AS_READ", "unreadCount"
  key_links:
    - from: "useWebSocket.onmessage"
      to: "frontend/src/store/modules/notification.js"
      via: "store.dispatch('notification/addNotification')"
      pattern: "store\\.dispatch.*notification/addNotification"
    - from: "BroadcastChannel"
      to: "other browser tabs"
      via: "cross-tab communication API"
      pattern: "new BroadcastChannel.*notification"
---

<objective>
Create notification API module, WebSocket composable, and Vuex store for frontend notification system.

Purpose: Build the foundational frontend infrastructure for notifications including the API client, WebSocket connection management with reconnection logic, cross-tab synchronization, and Vuex store for state management.

Output: Working notification API module, WebSocket composable with exponential backoff reconnection, and Vuex store with localStorage persistence.
</objective>

<execution_context>
@/home/chenjiaxing/.claude/get-shit-done/workflows/execute-plan.md
@/home/chenjiaxing/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/08-Real-time-Notifications/08-CONTEXT.md
@.planning/phases/08-Real-time-Notifications/08-02B-PLAN.md
@frontend/package.json
@frontend/src/api/base/BaseAPI.js
@frontend/src/store/index.js
</context>

<tasks>

<task type="auto">
  <name>Create notification API module</name>
  <files>frontend/src/api/modules/notification.js</files>
  <action>
    Create frontend/src/api/modules/notification.js following the BaseAPI pattern:

    Extend BaseAPI with base endpoint '/api/notifications/' and provide:
    1. Standard CRUD methods (inherited from BaseAPI)
    2. Custom methods: markAsRead, markAllAsRead, getUnreadCount, delete, deleteAllRead

    Implementation:
    ```javascript
    import request from '@/api/index'
    import { BaseAPI } from '@/api/base/BaseAPI'

    class NotificationAPI extends BaseAPI {
      constructor() {
        super('/api/notifications/', request)
      }

      // 标记单个通知为已读
      markAsRead(id) {
        return this.request({
          url: `${this.baseURL}${id}/mark_read/`,
          method: 'post'
        })
      }

      // 标记所有通知为已读
      markAllAsRead() {
        return this.request({
          url: `${this.baseURL}mark_all_read/`,
          method: 'post'
        })
      }

      // 获取未读数量
      getUnreadCount() {
        return this.request({
          url: `${this.baseURL}unread_count/`,
          method: 'get'
        })
      }

      // 获取通知统计
      getStatistics() {
        return this.request({
          url: `${this.baseURL}statistics/`,
          method: 'get'
        })
      }

      // 删除通知
      delete(id) {
        return this.request({
          url: `${this.baseURL}${id}/`,
          method: 'delete'
        })
      }

      // 删除所有已读
      deleteAllRead() {
        return this.request({
          url: `${this.baseURL}delete_all_read/`,
          method: 'delete'
        })
      }
    }

    export const notificationAPI = new NotificationAPI()
    ```

    Also add to frontend/src/api/modules/index.js:
    ```javascript
    export { notificationAPI } from './notification'
    ```
  </action>
  <verify>grep -q "notificationAPI\|markAsRead\|getUnreadCount" frontend/src/api/modules/notification.js && grep -q "notificationAPI" frontend/src/api/modules/index.js</verify>
  <done>notificationAPI module created with BaseAPI extension and custom notification methods, exported from index.js</done>
</task>

<task type="auto">
  <name>Create WebSocket composable with reconnection and BroadcastChannel</name>
  <files>frontend/src/composables/useWebSocket.js</files>
  <action>
    Create frontend/src/composables/useWebSocket.js:

    This composable manages WebSocket connection with:
    1. Token-based authentication via query string
    2. Exponential backoff reconnection (1s, 2s, 4s, 8s, ... max 60s)
    3. BroadcastChannel for cross-tab sync
    4. Connection state tracking (connecting, connected, disconnected, error)
    5. Heartbeat/ping handling
    6. Auto-connect on mount when authenticated

    Implementation:
    ```javascript
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
        const token = store.getters['user/token']
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

      // 指数退避重连
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
    ```

    Key features per context decisions:
    - Exponential backoff: 1s, 2s, 4s, 8s, ... max 60s
    - BroadcastChannel for multi-tab sync
    - Only connects when user is authenticated
    - Heartbeat every 30 seconds
  </action>
  <verify>grep -E "useWebSocket|BroadcastChannel|scheduleReconnect|exponential|reconnect" frontend/src/composables/useWebSocket.js && grep -q "store\.dispatch.*notification/addNotification" frontend/src/composables/useWebSocket.js</verify>
  <done>useWebSocket composable manages connection with exponential backoff reconnection, BroadcastChannel sync, heartbeat, and calls store.dispatch for notification actions</done>
</task>

<task type="auto">
  <name>Create notification Vuex store module</name>
  <files>frontend/src/store/modules/notification.js</files>
  <action>
    Create frontend/src/store/modules/notification.js:

    The notification store should:
    1. Maintain list of notifications and unread count
    2. Persist unread count to localStorage for recovery after reload
    3. Provide actions for API calls and mutations for state updates
    4. Handle incoming WebSocket notifications

    Implementation:
    ```javascript
    import { notificationAPI } from '@/api/modules'

    const STATE_KEY = 'notification_state'

    const loadState = () => {
      try {
        const saved = localStorage.getItem(STATE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          return {
            unreadCount: parsed.unreadCount || 0
          }
        }
      } catch (e) {
        console.error('Failed to load notification state:', e)
      }
      return {}
    }

    const saveState = (state) => {
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify({
          unreadCount: state.unreadCount
        }))
      } catch (e) {
        console.error('Failed to save notification state:', e)
      }
    }

    export default {
      namespaced: true,

      state: () => ({
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        ...loadState()
      }),

      getters: {
        unreadNotifications: (state) => {
          return state.notifications.filter(n => !n.is_read)
        },
        hasUnread: (state) => state.unreadCount > 0,
        unreadCountDisplay: (state) => {
          return state.unreadCount > 99 ? '99+' : state.unreadCount
        }
      },

      mutations: {
        SET_NOTIFICATIONS(state, notifications) {
          state.notifications = notifications
        },
        ADD_NOTIFICATION(state, notification) {
          state.notifications.unshift({
            ...notification,
            is_read: false
          })
          if (!notification.is_read) {
            state.unreadCount++
            saveState(state)
          }
        },
        MARK_AS_READ(state, notificationId) {
          const notification = state.notifications.find(n => n.id === notificationId)
          if (notification && !notification.is_read) {
            notification.is_read = true
            state.unreadCount = Math.max(0, state.unreadCount - 1)
            saveState(state)
          }
        },
        MARK_ALL_AS_READ(state) {
          state.notifications.forEach(n => n.is_read = true)
          state.unreadCount = 0
          saveState(state)
        },
        REMOVE_NOTIFICATION(state, notificationId) {
          const index = state.notifications.findIndex(n => n.id === notificationId)
          if (index > -1) {
            const notification = state.notifications[index]
            state.notifications.splice(index, 1)
            if (!notification.is_read) {
              state.unreadCount = Math.max(0, state.unreadCount - 1)
              saveState(state)
            }
          }
        },
        SET_UNREAD_COUNT(state, count) {
          state.unreadCount = count
          saveState(state)
        },
        DECREMENT_UNREAD_COUNT(state) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
          saveState(state)
        },
        SET_LOADING(state, loading) {
          state.loading = loading
        },
        SET_ERROR(state, error) {
          state.error = error
        }
      },

      actions: {
        async fetchNotifications({ commit }, params = {}) {
          commit('SET_LOADING', true)
          try {
            const response = await notificationAPI.getList(params)
            commit('SET_NOTIFICATIONS', response.data.results || response.data)
            return response.data
          } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
          } finally {
            commit('SET_LOADING', false)
          }
        },

        async fetchUnreadCount({ commit }) {
          try {
            const response = await notificationAPI.getUnreadCount()
            commit('SET_UNREAD_COUNT', response.data.unread_count)
            return response.data.unread_count
          } catch (error) {
            console.error('Failed to fetch unread count:', error)
          }
        },

        async markAsRead({ commit }, notificationId) {
          try {
            await notificationAPI.markAsRead(notificationId)
            commit('MARK_AS_READ', notificationId)
            const bc = new BroadcastChannel('notification-sync')
            bc.postMessage({ type: 'mark_read' })
            bc.close()
          } catch (error) {
            console.error('Failed to mark as read:', error)
            throw error
          }
        },

        async markAllAsRead({ commit }) {
          try {
            await notificationAPI.markAllAsRead()
            commit('MARK_ALL_AS_READ')
          } catch (error) {
            console.error('Failed to mark all as read:', error)
            throw error
          }
        },

        async deleteNotification({ commit }, notificationId) {
          try {
            await notificationAPI.delete(notificationId)
            commit('REMOVE_NOTIFICATION', notificationId)
          } catch (error) {
            console.error('Failed to delete notification:', error)
            throw error
          }
        },

        addNotification({ commit }, notification) {
          commit('ADD_NOTIFICATION', notification)
          if (localStorage.getItem('notification_sound_enabled') === 'true') {
            playNotificationSound()
          }
        }
      }
    }

    function playNotificationSound() {
      const audio = new Audio('/static/sounds/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {
        // 忽略自动播放限制错误
      })
    }
    ```

    Add to frontend/src/store/index.js:
    ```javascript
    import notification from './modules/notification'

    export default new Vuex.Store({
      modules: {
        // ... existing modules
        notification,
      }
    })
    ```
  </action>
  <verify>grep -E "ADD_NOTIFICATION|MARK_AS_READ|SET_UNREAD_COUNT|unreadCount|99\+" frontend/src/store/modules/notification.js && grep -q "notification" frontend/src/store/index.js</verify>
  <done>Notification store module manages notifications, unread count with 99+ display, and persists to localStorage</done>
</task>

</tasks>

<verification>
After completing all tasks, verify:

1. Check notificationAPI is exported from modules/index.js
2. Verify useWebSocket has exponential backoff (1s, 2s, 4s, 8s...)
3. Verify BroadcastChannel is used for cross-tab sync
4. Verify store persists unreadCount to localStorage
5. Verify unreadCountDisplay shows 99+ when count > 99
6. Verify notification module is registered in store/index.js
</verification>

<success_criteria>
1. Notification API module extends BaseAPI with custom methods
2. WebSocket composable connects when authenticated
3. Exponential backoff reconnection works (1s, 2s, 4s... max 60s)
4. BroadcastChannel syncs notifications across browser tabs
5. Notification store persists unread count to localStorage
6. Unread count displays 99+ when count exceeds 99
7. Notification module is registered in Vuex store
</success_criteria>

<output>
After completion, create `.planning/phases/08-Real-time-Notifications/08-03A-SUMMARY.md` with:
- API module structure
- WebSocket connection management details
- BroadcastChannel sync implementation
- Store persistence approach
- Any issues with Vue 2.7 Composition API compatibility
</output>
