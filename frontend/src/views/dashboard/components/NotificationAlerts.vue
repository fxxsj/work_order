<template>
  <div class="notification-alerts">
    <!-- 未读通知提醒（所有用户可见） -->
    <el-alert
      v-if="unreadCount > 0"
      type="info"
      :closable="false"
      show-icon
      class="alert-item"
    >
      <template slot="title">
        <span>您有 <strong class="count-text">{{ unreadCount }}</strong> 条未读通知</span>
        <el-link type="primary" :underline="false" class="action-link" @click="$emit('view-notifications')">
          查看通知
        </el-link>
      </template>
    </el-alert>

    <!-- 待审核施工单提醒（仅业务员可见） -->
    <el-alert
      v-if="isSalesperson && pendingApprovalCount > 0"
      type="warning"
      :closable="false"
      show-icon
      class="alert-item"
    >
      <template slot="title">
        <span>您有 <strong class="count-text warning">{{ pendingApprovalCount }}</strong> 个待审核的施工单，请及时处理。</span>
        <el-link type="primary" :underline="false" class="action-link" @click="$emit('view-pending-approvals')">
          点击查看
        </el-link>
      </template>
    </el-alert>

    <!-- 紧急优先级提醒（管理员可见） -->
    <el-alert
      v-if="isAdmin && urgentPriorityCount > 0"
      type="error"
      :closable="false"
      show-icon
      class="alert-item"
    >
      <template slot="title">
        <span>有 <strong class="count-text error">{{ urgentPriorityCount }}</strong> 个紧急优先级的施工单需要处理</span>
        <el-link type="primary" :underline="false" class="action-link" @click="$emit('view-urgent-priority')">
          查看详情
        </el-link>
      </template>
    </el-alert>

    <!-- 即将到期提醒（管理员可见） -->
    <el-alert
      v-if="isAdmin && upcomingDeadlineCount > 0"
      type="warning"
      :closable="false"
      show-icon
      class="alert-item"
    >
      <template slot="title">
        <span>有 <strong class="count-text warning">{{ upcomingDeadlineCount }}</strong> 个即将到期的施工单（7天内）需要关注</span>
        <el-link type="primary" :underline="false" class="action-link" @click="$emit('view-upcoming-deadline')">
          查看详情
        </el-link>
      </template>
    </el-alert>
  </div>
</template>

<script>
export default {
  name: 'NotificationAlerts',
  props: {
    unreadCount: {
      type: Number,
      default: 0
    },
    pendingApprovalCount: {
      type: Number,
      default: 0
    },
    urgentPriorityCount: {
      type: Number,
      default: 0
    },
    upcomingDeadlineCount: {
      type: Number,
      default: 0
    },
    isSalesperson: {
      type: Boolean,
      default: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.notification-alerts {
  margin-bottom: 20px;
}

.alert-item {
  margin-bottom: 10px;
}

.alert-item:last-child {
  margin-bottom: 0;
}

.count-text {
  color: #409EFF;
  font-size: 16px;
}

.count-text.warning {
  color: #E6A23C;
}

.count-text.error {
  color: #F56C6C;
}

.action-link {
  margin-left: 10px;
}
</style>
