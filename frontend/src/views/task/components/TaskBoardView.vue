<template>
  <div class="task-board-view">
    <el-row :gutter="20">
      <el-col :span="8">
        <task-column
          status="pending"
          title="待开始"
          :tasks="tasksByStatus.pending"
          :editable="editable"
          :loading="loading"
          @task-click="handleTaskClick"
          @task-update="handleTaskUpdate"
          @task-assign="handleTaskAssign"
          @task-complete="handleTaskComplete"
        />
      </el-col>
      <el-col :span="8">
        <task-column
          status="in_progress"
          title="进行中"
          :tasks="tasksByStatus.in_progress"
          :editable="editable"
          :loading="loading"
          @task-click="handleTaskClick"
          @task-update="handleTaskUpdate"
          @task-assign="handleTaskAssign"
          @task-complete="handleTaskComplete"
        />
      </el-col>
      <el-col :span="8">
        <task-column
          status="completed"
          title="已完成"
          :tasks="tasksByStatus.completed"
          :editable="editable"
          :loading="loading"
          @task-click="handleTaskClick"
          @task-update="handleTaskUpdate"
          @task-assign="handleTaskAssign"
          @task-complete="handleTaskComplete"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import TaskColumn from './TaskColumn.vue'

export default {
  name: 'TaskBoardView',
  components: {
    TaskColumn
  },
  props: {
    tasksByStatus: {
      type: Object,
      required: true
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
.task-board-view {
  margin-top: 20px;
}
</style>
