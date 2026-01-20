<template>
  <div
    class="task-card"
    :class="{ 'task-card-overdue': isOverdue }"
    @click="handleClick"
  >
    <!-- 卡片头部 -->
    <div class="task-header">
      <div class="task-header-left">
        <span class="task-order-number">
          {{ orderNumber }}
        </span>
        <el-tag
          v-if="priority"
          :type="priorityTagType"
          size="mini"
          style="margin-left: 5px;"
        >
          {{ priorityDisplay }}
        </el-tag>
      </div>
      <el-tag :type="taskTypeTagType" size="mini">
        {{ taskTypeDisplay }}
      </el-tag>
    </div>

    <!-- 卡片内容 -->
    <div class="task-content">
      <div class="task-title">
        {{ task.work_content }}
      </div>

      <!-- 任务信息 -->
      <div class="task-info">
        <div class="task-info-item">
          <i class="el-icon-s-custom"></i>
          {{ operatorName }}
        </div>
        <div class="task-info-item">
          <i class="el-icon-s-data"></i>
          {{ progressText }}
        </div>
      </div>

      <!-- 截止日期 -->
      <div v-if="deadlineText" class="task-deadline" :class="deadlineClass">
        <i class="el-icon-time"></i>
        {{ deadlineText }}
      </div>

      <!-- 不良品提示 -->
      <div v-if="hasDefective" class="task-defective">
        <i class="el-icon-warning"></i>
        不良品：{{ task.quantity_defective }}
      </div>

      <!-- 进度条 -->
      <div class="task-progress">
        <el-progress
          :percentage="progressPercentage"
          :color="progressColor"
          :show-text="false"
          :stroke-width="6"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="task-actions">
      <el-button
        v-if="canUpdate"
        type="primary"
        size="mini"
        icon="el-icon-edit"
        @click.stop="handleUpdate"
      >
        更新
      </el-button>
      <el-button
        v-if="canAssign"
        type="warning"
        size="mini"
        icon="el-icon-user"
        @click.stop="handleAssign"
      >
        分派
      </el-button>
      <el-button
        v-if="canComplete"
        type="success"
        size="mini"
        icon="el-icon-check"
        @click.stop="handleComplete"
      >
        完成
      </el-button>
    </div>
  </div>
</template>

<script>
import { taskService, permissionService, workOrderService } from '@/services'

export default {
  name: 'TaskCard',
  props: {
    task: {
      type: Object,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    orderNumber() {
      return this.task.work_order_process_info?.work_order?.order_number || '-'
    },
    priority() {
      return this.task.work_order_process_info?.work_order?.priority
    },
    priorityDisplay() {
      return this.task.work_order_process_info?.work_order?.priority_display || ''
    },
    priorityTagType() {
      return workOrderService.getPriorityType(this.priority)
    },
    taskTypeDisplay() {
      return this.task.task_type_display || ''
    },
    taskTypeTagType() {
      const typeMap = {
        plate_making: 'success',
        printing: 'primary',
        post_press: 'warning',
        material: 'info'
      }
      return typeMap[this.task.task_type] || ''
    },
    operatorName() {
      return this.task.assigned_operator_name || '未分配'
    },
    progressText() {
      const completed = this.task.quantity_completed || 0
      const total = this.task.production_quantity || 0
      return `${completed} / ${total}`
    },
    progressPercentage() {
      return taskService.calculateProgress(this.task)
    },
    progressColor() {
      const progress = this.progressPercentage
      return progress === 100 ? '#67C23A' : '#409EFF'
    },
    isOverdue() {
      return taskService.isOverdue(this.task)
    },
    deadlineText() {
      const days = taskService.getRemainingDays(this.task)
      if (days === null) return null

      if (days < 0) {
        return `逾期 ${Math.abs(days)} 天`
      } else if (days === 0) {
        return '今天到期'
      } else if (days === 1) {
        return '明天到期'
      } else {
        return `${days} 天后到期`
      }
    },
    deadlineClass() {
      const days = taskService.getRemainingDays(this.task)
      if (days === null) return ''

      if (days < 0) {
        return 'deadline-overdue'
      } else if (days <= 2) {
        return 'deadline-urgent'
      } else {
        return 'deadline-normal'
      }
    },
    hasDefective() {
      return (this.task.quantity_defective || 0) > 0
    },
    canUpdate() {
      if (!this.editable) return false
      return this.task.status !== 'completed' && this.task.status !== 'cancelled'
    },
    canAssign() {
      if (!this.editable) return false
      return permissionService.canOperateTask(this.task, 'assign')
    },
    canComplete() {
      if (!this.editable) return false
      return taskService.canComplete(this.task)
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.task)
    },
    handleUpdate() {
      this.$emit('update', this.task)
    },
    handleAssign() {
      this.$emit('assign', this.task)
    },
    handleComplete() {
      this.$emit('complete', this.task)
    }
  }
}
</script>

<style scoped>
.task-card {
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: white;
}

.task-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.task-card-overdue {
  border-left: 3px solid #F56C6C;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.task-order-number {
  font-size: 12px;
  color: #606266;
  font-weight: bold;
}

.task-content {
  margin-bottom: 12px;
}

.task-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 10px;
  font-weight: 500;
  line-height: 1.5;
}

.task-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-info-item {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
}

.task-info-item i {
  margin-right: 4px;
}

.task-deadline {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.task-deadline i {
  margin-right: 4px;
}

.deadline-normal {
  background-color: #F0F9FF;
  color: #409EFF;
}

.deadline-urgent {
  background-color: #FDF6EC;
  color: #E6A23C;
}

.deadline-overdue {
  background-color: #FEF0F0;
  color: #F56C6C;
}

.task-defective {
  font-size: 12px;
  color: #E6A23C;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.task-defective i {
  margin-right: 4px;
}

.task-progress {
  margin-top: 8px;
}

.task-actions {
  display: flex;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #EBEEF5;
}

.task-actions .el-button {
  flex: 1;
}
</style>
