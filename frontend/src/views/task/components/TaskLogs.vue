<template>
  <div v-if="task.logs && task.logs.length > 0" style="padding: 20px; background-color: #f5f7fa;">
    <div style="font-weight: bold; margin-bottom: 15px; color: #409EFF;">
      {{ task.work_content }} - 操作记录（{{ task.logs.length }}条）
    </div>
    <el-table
      :data="task.logs"
      border
      size="small"
      style="width: 100%;"
    >
      <el-table-column prop="created_at" label="操作时间" width="160">
        <template slot-scope="scope">
          {{ formatDateTime(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="operator_name" label="操作人" width="120" />
      <el-table-column prop="log_type_display" label="操作类型" width="100" />
      <el-table-column label="数量变化" width="180">
        <template slot-scope="scope">
          <span v-if="scope.row.quantity_before !== null && scope.row.quantity_after !== null">
            {{ scope.row.quantity_before }} → {{ scope.row.quantity_after }}
            <span v-if="scope.row.quantity_increment > 0" style="color: #67C23A; margin-left: 5px; font-weight: bold;">
              (+{{ scope.row.quantity_increment }})
            </span>
            <span v-else-if="scope.row.quantity_increment < 0" style="color: #F56C6C; margin-left: 5px; font-weight: bold;">
              ({{ scope.row.quantity_increment }})
            </span>
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态变化" width="150">
        <template slot-scope="scope">
          <span v-if="scope.row.status_before && scope.row.status_after">
            {{ getStatusText(scope.row.status_before) }} → {{ getStatusText(scope.row.status_after) }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="content"
        label="操作内容"
        min-width="200"
        show-overflow-tooltip
      />
    </el-table>
  </div>
  <div v-else style="padding: 20px; text-align: center; color: #909399;">
    暂无操作记录
  </div>
</template>

<script>
import taskService from '@/services/TaskService'

export default {
  name: 'TaskLogs',
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
  methods: {
    formatDateTime(dateTime) {
      return this.taskService.formatDateTime(dateTime)
    },
    getStatusText(status) {
      return this.taskService.getStatusText(status)
    }
  }
}
</script>
