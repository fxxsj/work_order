/**
 * Notification Store Module
 * 管理通知状态和未读计数，支持 localStorage 持久化
 */
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
    unreadNotifications: (state) => state.notifications.filter(n => !n.is_read),
    hasUnread: (state) => state.unreadCount > 0,
    unreadCountDisplay: (state) => (state.unreadCount > 99 ? '99+' : state.unreadCount)
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
