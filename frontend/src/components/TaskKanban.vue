<template>
  <div class="task-kanban">
    <div class="kanban-container">
      <div
        v-for="column in columns"
        :key="column.status"
        class="kanban-column"
      >
        <div class="column-header">
          <span class="column-title">{{ column.title }}</span>
          <el-badge :value="column.tasks.length" class="column-badge"></el-badge>
        </div>
        <div
          class="column-content"
          :class="`column-${column.status}`"
        >
          <div
            v-for="task in column.tasks"
            :key="task.id"
            class="kanban-card"
            @click="handleTaskClick(task)"
          >
            <div class="card-header">
              <div class="card-title">{{ task.work_content }}</div>
              <el-tag
                :type="getTaskTypeTagType(task.task_type)"
                size="mini"
              >
                {{ getTaskTypeDisplay(task.task_type) }}
              </el-tag>
            </div>
            <div class="card-body">
              <div class="card-info">
                <div class="info-item">
                  <i class="el-icon-document"></i>
                  <span>{{ task.work_order_number || '-' }}</span>
                </div>
                <div class="info-item" v-if="task.assigned_department_name">
                  <i class="el-icon-office-building"></i>
                  <span>{{ task.assigned_department_name }}</span>
                </div>
                <div class="info-item" v-if="task.assigned_operator_name">
                  <i class="el-icon-user"></i>
                  <span>{{ task.assigned_operator_name }}</span>
                </div>
              </div>
              <div class="card-progress" v-if="task.production_quantity > 0">
                <div class="progress-info">
                  <span>{{ task.quantity_completed || 0 }} / {{ task.production_quantity }}</span>
                  <span class="progress-percentage">
                    {{ getProgressPercentage(task) }}%
                  </span>
                </div>
                <el-progress
                  :percentage="getProgressPercentage(task)"
                  :stroke-width="6"
                  :color="getProgressColor(task)"
                ></el-progress>
              </div>
            </div>
            <div class="card-footer">
              <div class="card-meta">
                <span v-if="task.process_name" class="meta-item">
                  <i class="el-icon-setting"></i>
                  {{ task.process_name }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="column.tasks.length === 0" class="empty-column">
            <el-empty description="暂无任务" :image-size="80"></el-empty>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskKanban',
  props: {
    tasks: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    columns() {
      const statusMap = {
        pending: { title: '待开始', status: 'pending' },
        in_progress: { title: '进行中', status: 'in_progress' },
        completed: { title: '已完成', status: 'completed' },
        cancelled: { title: '已取消', status: 'cancelled' }
      }

      return Object.keys(statusMap).map(status => {
        return {
          ...statusMap[status],
          tasks: this.tasks.filter(task => task.status === status)
        }
      })
    }
  },
  methods: {
    getTaskTypeTagType(taskType) {
      const typeMap = {
        plate_making: 'primary',
        cutting: 'success',
        printing: 'warning',
        foiling: 'danger',
        embossing: 'info',
        die_cutting: 'success',
        packaging: 'warning',
        general: 'info'
      }
      return typeMap[taskType] || 'info'
    },
    getTaskTypeDisplay(taskType) {
      const displayMap = {
        plate_making: '制版',
        cutting: '开料',
        printing: '印刷',
        foiling: '烫金',
        embossing: '压凸',
        die_cutting: '模切',
        packaging: '包装',
        general: '通用'
      }
      return displayMap[taskType] || taskType
    },
    getProgressPercentage(task) {
      if (!task.production_quantity || task.production_quantity === 0) {
        return 0
      }
      const completed = task.quantity_completed || 0
      return Math.round((completed / task.production_quantity) * 100)
    },
    getProgressColor(task) {
      const percentage = this.getProgressPercentage(task)
      if (percentage === 100) {
        return '#67c23a'
      } else if (percentage >= 50) {
        return '#409eff'
      } else {
        return '#e6a23c'
      }
    },
    handleTaskClick(task) {
      this.$emit('task-click', task)
    }
  }
}
</script>

<style scoped>
.task-kanban {
  padding: 20px;
  overflow-x: auto;
}

.kanban-container {
  display: flex;
  gap: 20px;
  min-width: fit-content;
}

.kanban-column {
  min-width: 300px;
  max-width: 350px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.column-header {
  padding: 15px 20px;
  background: #fff;
  border-bottom: 2px solid #e4e7ed;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.column-badge {
  margin-left: 10px;
}

.column-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column-content.column-pending {
  background: #f5f7fa;
}

.column-content.column-in_progress {
  background: #ecf5ff;
}

.column-content.column-completed {
  background: #f0f9ff;
}

.column-content.column-cancelled {
  background: #fef0f0;
}

.kanban-card {
  background: #fff;
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e4e7ed;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.kanban-card:nth-child(1) {
  border-left-color: #909399;
}

.column-in_progress .kanban-card {
  border-left-color: #409eff;
}

.column-completed .kanban-card {
  border-left-color: #67c23a;
}

.column-cancelled .kanban-card {
  border-left-color: #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-title {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex: 1;
  margin-right: 8px;
  line-height: 1.4;
  word-break: break-word;
}

.card-body {
  margin-bottom: 12px;
}

.card-info {
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}

.info-item i {
  margin-right: 6px;
  color: #909399;
}

.card-progress {
  margin-top: 10px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}

.progress-percentage {
  font-weight: bold;
  color: #409eff;
}

.card-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-item {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
}

.meta-item i {
  margin-right: 4px;
}

.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 200px;
}

@media (max-width: 1200px) {
  .kanban-column {
    min-width: 250px;
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .kanban-container {
    flex-direction: column;
  }

  .kanban-column {
    width: 100%;
    max-width: 100%;
    height: auto;
    min-height: 300px;
  }
}
</style>

