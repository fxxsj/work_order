<template>
  <div>
    <el-button
      v-if="canComplete"
      type="success"
      size="mini"
      @click="handleComplete"
    >
      完成
    </el-button>
    <span v-else-if="task.status !== 'completed'" style="color: #909399; font-size: 12px;">
      {{ blockReason }}
    </span>
    <el-button
      v-if="task.status !== 'completed' && !task.auto_calculate_quantity"
      type="primary"
      size="mini"
      style="margin-left: 5px;"
      @click="handleUpdate"
    >
      更新
    </el-button>
    <el-button
      type="warning"
      size="mini"
      style="margin-left: 5px;"
      @click="handleAssign"
    >
      分派
    </el-button>
    <el-button
      v-if="task.status !== 'completed' && !task.is_subtask && !task.subtasks_count"
      type="info"
      size="mini"
      style="margin-left: 5px;"
      @click="handleSplit"
    >
      拆分
    </el-button>
  </div>
</template>

<script>
import taskService from '@/services/TaskService'

export default {
  name: 'TaskActions',
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      taskService
    }
  },
  computed: {
    canComplete() {
      return this.task.status !== 'completed' && this.taskService.canComplete(this.task)
    },
    blockReason() {
      return this.taskService.getCannotCompleteReason(this.task)
    }
  },
  methods: {
    handleComplete() {
      this.$emit('complete', this.task)
    },
    handleUpdate() {
      this.$emit('update', this.task)
    },
    handleAssign() {
      this.$emit('assign', this.task)
    },
    handleSplit() {
      this.$emit('split', this.task)
    }
  }
}
</script>
