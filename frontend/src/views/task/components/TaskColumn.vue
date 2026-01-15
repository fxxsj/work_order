<template>
  <div class="task-column">
    <div class="column-header" :class="headerClass">
      <span class="column-title">{{ title }}</span>
      <el-badge :value="taskCount" class="column-badge"></el-badge>
    </div>
    <div class="column-content" v-loading="loading">
      <task-card
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :editable="editable"
        @click="handleTaskClick"
        @update="handleTaskUpdate"
        @assign="handleTaskAssign"
        @complete="handleTaskComplete"
      />
      <div v-if="tasks.length === 0" class="empty-column">
        <i class="el-icon-folder-opened"></i>
        <p>{{ emptyText }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { taskService } from '@/services'
import TaskCard from './TaskCard.vue'

export default {
  name: 'TaskColumn',
  components: {
    TaskCard
  },
  props: {
    status: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    tasks: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    taskCount() {
      return this.tasks.length
    },
    headerClass() {
      return taskService.getStatusType(this.status)
    },
    emptyText() {
      const textMap = {
        pending: '暂无待开始任务',
        in_progress: '暂无进行中任务',
        completed: '暂无已完成任务'
      }
      return textMap[this.status] || '暂无任务'
    }
  },
  methods: {
    handleTaskClick(task) {
      this.$emit('task-click', task)
    },
    handleTaskUpdate(task) {
      this.$emit('task-update', task)
    },
    handleTaskAssign(task) {
      this.$emit('task-assign', task)
    },
    handleTaskComplete(task) {
      this.$emit('task-complete', task)
    }
  }
}
</script>

<style scoped>
.task-column {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #F5F7FA;
  border-radius: 8px;
  overflow: hidden;
}

.column-header {
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.column-header.pending {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
}

.column-header.in-progress {
  background: linear-gradient(135deg, #409EFF 0%, #53a8ff 100%);
}

.column-header.completed {
  background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%);
}

.column-title {
  font-size: 16px;
}

.column-badge {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: bold;
}

.column-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  max-height: calc(100vh - 350px);
}

.column-content::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-thumb {
  background-color: #DCDFE6;
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-track {
  background-color: #F5F7FA;
}

.empty-column {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-column i {
  font-size: 48px;
  margin-bottom: 10px;
}

.empty-column p {
  font-size: 14px;
  margin: 0;
}
</style>
