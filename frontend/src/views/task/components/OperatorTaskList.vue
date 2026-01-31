<template>
  <div class="operator-task-list">
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-card"
        :class="`priority-${task.priority}`"
        @click="$emit('task-click', task)"
      >
        <div class="task-header">
          <el-tag :type="getStatusType(task.status)" size="small">
            {{ task.status_display }}
          </el-tag>
          <el-tag v-if="task.priority === 'urgent'" type="danger" size="small">紧急</el-tag>
        </div>
        <div class="task-content">{{ task.work_content }}</div>
        <div class="task-meta">
          <span>{{ task.work_order_process_info?.work_order?.order_number || '-' }}</span>
          <span>{{ task.work_order_process_info?.process?.name || '-' }}</span>
        </div>
        <div class="task-progress" v-if="task.production_quantity">
          <el-progress
            :percentage="getProgress(task)"
            :stroke-width="6"
            :show-text="false"
          />
          <span class="progress-text">{{ task.quantity_completed }}/{{ task.production_quantity }}</span>
        </div>
        <div class="task-actions" v-if="showClaimButton && !task.assigned_operator">
          <el-button
            type="primary"
            size="small"
            :loading="claimingTaskId === task.id"
            @click.stop="$emit('claim', task)"
          >
            认领
          </el-button>
        </div>
      </div>
    </el-scrollbar>
    <el-empty v-if="tasks.length === 0" :description="emptyText" />
  </div>
</template>

<script>
import taskService from '@/services/TaskService'

export default {
  name: 'OperatorTaskList',

  props: {
    tasks: {
      type: Array,
      default: () => []
    },
    showClaimButton: {
      type: Boolean,
      default: false
    },
    claimingTaskId: {
      type: Number,
      default: null
    },
    emptyText: {
      type: String,
      default: '暂无任务'
    }
  },

  methods: {
    getStatusType(status) {
      return taskService.getStatusType(status)
    },
    getProgress(task) {
      return taskService.calculateProgress(task)
    }
  }
}
</script>

<style scoped>
.operator-task-list {
  height: 400px;
}

.scrollbar-wrapper {
  height: 100%;
}

.task-card {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 3px solid #DCDFE6;
}

.task-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.task-card.priority-urgent {
  border-left-color: #F56C6C;
}

.task-card.priority-high {
  border-left-color: #E6A23C;
}

.task-card.priority-normal {
  border-left-color: #409EFF;
}

.task-card.priority-low {
  border-left-color: #909399;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-content {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
  min-width: 60px;
  text-align: right;
}

.task-actions {
  margin-top: 12px;
  text-align: right;
}
</style>
