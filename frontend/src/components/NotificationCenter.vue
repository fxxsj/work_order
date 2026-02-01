<template>
  <div class="notification-center">
    <!-- 铃铛图标 -->
    <el-badge
      :value="unreadCountDisplay"
      :hidden="!hasUnread"
      class="notification-badge"
    >
      <el-button
        class="notification-bell"
        :class="{ 'has-error': connectionError }"
        circle
        icon="el-icon-bell"
        @click="toggleDropdown"
      >
        <i v-if="connectionError" class="el-icon-warning connection-error-icon"></i>
      </el-button>
    </el-badge>

    <!-- 下拉面板 -->
    <el-popover
      ref="popover"
      v-model="dropdownVisible"
      placement="bottom-end"
      width="380"
      trigger="manual"
      popper-class="notification-popover"
    >
      <div v-loading="loading" class="notification-panel">
        <!-- 头部 -->
        <div class="notification-header">
          <span class="notification-title">通知</span>
          <div class="notification-actions">
            <el-button
              v-if="hasUnread"
              type="text"
              size="mini"
              @click="markAllAsRead"
            >
              全部已读
            </el-button>
            <el-button
              type="text"
              size="mini"
              @click="goToNotificationPage"
            >
              查看全部
            </el-button>
          </div>
        </div>

        <!-- 连接状态指示器 -->
        <div
          v-if="connectionStatus !== 'connected'"
          class="connection-status"
          :class="connectionStatus"
        >
          <i :class="connectionStatusIcon"></i>
          <span>{{ connectionStatusText }}</span>
        </div>

        <!-- 通知列表 -->
        <div class="notification-list">
          <template v-if="notifications.length > 0">
            <div
              v-for="notification in displayedNotifications"
              :key="notification.id"
              class="notification-item"
              :class="{ 'is-unread': !notification.is_read, 'is-expanded': expandedId === notification.id }"
              @click="handleNotificationClick(notification)"
            >
              <!-- 紧凑视图 -->
              <div class="notification-compact">
                <div class="notification-icon">
                  <i :class="getNotificationIcon(notification)"></i>
                </div>
                <div class="notification-content">
                  <div class="notification-title-text">
                    {{ notification.data?.title || notification.title }}
                  </div>
                  <div class="notification-time">
                    {{ formatTime(notification.created_at || notification.timestamp) }}
                  </div>
                </div>
                <div v-if="!notification.is_read" class="unread-dot"></div>
              </div>

              <!-- 展开详情 -->
              <div v-if="expandedId === notification.id" class="notification-details">
                <p class="notification-message">
                  {{ notification.data?.message || notification.message }}
                </p>
                <div v-if="notification.data" class="notification-meta">
                  <span v-if="notification.data.workorder_number" class="meta-item">
                    <i class="el-icon-document"></i>
                    {{ notification.data.workorder_number }}
                  </span>
                  <span v-if="notification.data.process_name" class="meta-item">
                    <i class="el-icon-s-operation"></i>
                    {{ notification.data.process_name }}
                  </span>
                </div>
                <div class="notification-actions-row">
                  <el-button
                    v-if="canNavigate(notification)"
                    type="primary"
                    size="mini"
                    @click.stop="navigateToTask(notification)"
                  >
                    查看任务
                  </el-button>
                  <el-button
                    type="text"
                    size="mini"
                    @click.stop="markAsRead(notification.id)"
                  >
                    标记已读
                  </el-button>
                  <el-button
                    type="text"
                    size="mini"
                    @click.stop="deleteNotification(notification.id)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </template>
          <el-empty v-else description="暂无通知" :image-size="80" />
        </div>
      </div>

      <div slot="reference" class="notification-reference"></div>
    </el-popover>

    <!-- 声音设置开关 -->
    <el-tooltip content="通知声音" placement="bottom">
      <el-switch
        v-model="soundEnabled"
        class="sound-toggle"
        active-text=""
        inactive-text=""
        @change="onSoundToggle"
      />
    </el-tooltip>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'

export default {
  name: 'NotificationCenter',

  setup() {
    const store = useStore()
    const router = useRouter()
    const popover = ref(null)
    const dropdownVisible = ref(false)
    const expandedId = ref(null)

    const { isConnected, isConnecting, hasError, connectionState } = useWebSocket()
    const soundEnabled = ref(localStorage.getItem('notification_sound_enabled') === 'true')

    const notifications = computed(() => store.state.notification.notifications)
    const unreadCount = computed(() => store.state.notification.unreadCount)
    const hasUnread = computed(() => unreadCount.value > 0)
    const unreadCountDisplay = computed(() => unreadCount.value > 99 ? '99+' : unreadCount.value)
    const loading = computed(() => store.state.notification.loading)

    const connectionStatus = computed(() => {
      if (hasError.value) return 'error'
      if (isConnecting.value) return 'connecting'
      if (isConnected.value) return 'connected'
      return 'disconnected'
    })

    const connectionError = computed(() => hasError.value)
    const displayedNotifications = computed(() => notifications.value.slice(0, 10))

    const toggleDropdown = () => {
      dropdownVisible.value = !dropdownVisible.value
      if (dropdownVisible.value && notifications.value.length === 0) {
        loadNotifications()
      }
    }

    const loadNotifications = async () => {
      try {
        await store.dispatch('notification/fetchNotifications', { page_size: 20 })
      } catch (e) {
        console.error('Failed to load notifications:', e)
      }
    }

    const handleNotificationClick = (notification) => {
      if (expandedId.value === notification.id) {
        expandedId.value = null
      } else {
        expandedId.value = notification.id
        if (!notification.is_read) {
          markAsRead(notification.id)
        }
      }
    }

    const markAsRead = async (id) => {
      try {
        await store.dispatch('notification/markAsRead', id)
      } catch (e) {
        console.error('Failed to mark as read:', e)
      }
    }

    const markAllAsRead = async () => {
      try {
        await store.dispatch('notification/markAllAsRead')
      } catch (e) {
        console.error('Failed to mark all as read:', e)
      }
    }

    const deleteNotification = async (id) => {
      try {
        await store.dispatch('notification/deleteNotification', id)
      } catch (e) {
        console.error('Failed to delete notification:', e)
      }
    }

    const canNavigate = (notification) => notification.data?.task_id || notification.task_id

    const navigateToTask = (notification) => {
      const taskId = notification.data?.task_id || notification.task_id
      if (taskId) {
        dropdownVisible.value = false
        router.push({ name: 'TaskDetail', params: { id: taskId } })
      }
    }

    const goToNotificationPage = () => {
      dropdownVisible.value = false
      router.push({ name: 'Notifications' })
    }

    const formatTime = (timeStr) => {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

      return date.toLocaleDateString()
    }

    const getNotificationIcon = (notification) => {
      const type = notification.event_type || notification.notification_type
      const iconMap = {
        task_assigned: 'el-icon-user-solid',
        task_completed: 'el-icon-circle-check',
        task_started: 'el-icon-video-play',
        workorder_created: 'el-icon-document',
        workorder_approved: 'el-icon-success',
        workorder_rejected: 'el-icon-error',
        deadline_warning: 'el-icon-warning',
        system_announcement: 'el-icon-bell'
      }
      return iconMap[type] || 'el-icon-bell'
    }

    const onSoundToggle = (value) => {
      localStorage.setItem('notification_sound_enabled', value.toString())
    }

    let refreshInterval = null
    onMounted(() => {
      loadNotifications()
      store.dispatch('notification/fetchUnreadCount')
      refreshInterval = setInterval(() => {
        store.dispatch('notification/fetchUnreadCount')
      }, 60000)
    })

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    })

    watch(unreadCount, (newVal, oldVal) => {
      if (newVal > oldVal) {
        // 有新通知，仅更新计数，不自动弹出（符合上下文决策）
      }
    })

    return {
      popover,
      dropdownVisible,
      expandedId,
      notifications,
      displayedNotifications,
      hasUnread,
      unreadCountDisplay,
      loading,
      connectionStatus,
      connectionError,
      connectionState,
      soundEnabled,
      toggleDropdown,
      handleNotificationClick,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      canNavigate,
      navigateToTask,
      goToNotificationPage,
      formatTime,
      getNotificationIcon,
      onSoundToggle
    }
  },

  computed: {
    connectionStatusIcon() {
      const icons = {
        connecting: 'el-icon-loading',
        connected: 'el-icon-circle-check',
        disconnected: 'el-icon-warning',
        error: 'el-icon-circle-close'
      }
      return icons[this.connectionStatus] || 'el-icon-warning'
    },

    connectionStatusText() {
      const texts = {
        connecting: '连接中...',
        connected: '已连接',
        disconnected: '连接已断开',
        error: '连接错误'
      }
      return texts[this.connectionStatus] || '未知状态'
    }
  }
}
</script>

<style scoped>
.notification-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-badge {
  margin-right: 0;
}

.notification-bell {
  border: none;
  background: transparent;
  font-size: 20px;
  padding: 8px;
}

.notification-bell:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.notification-bell.has-error {
  color: #F56C6C;
}

.connection-error-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 10px;
}

.sound-toggle {
  --el-switch-off-color: #dcdfe6;
  --el-switch-on-color: #409EFF;
}

.notification-reference {
  display: none;
}

.notification-panel {
  max-height: 500px;
  overflow-y: auto;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 12px;
  border-bottom: 1px solid #ebeef5;
}

.connection-status.connecting {
  color: #909399;
}

.connection-status.connected {
  color: #67c23a;
}

.connection-status.disconnected,
.connection-status.error {
  color: #f56c6c;
}

.notification-list {
  max-height: 350px;
  overflow-y: auto;
}

.notification-item {
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.is-unread {
  background-color: #fef0f0;
}

.notification-compact {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #606266;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title-text {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f56c6c;
}

.notification-details {
  padding: 0 16px 12px 60px;
}

.notification-message {
  font-size: 13px;
  color: #606266;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.notification-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.notification-actions-row {
  display: flex;
  gap: 8px;
}
</style>
