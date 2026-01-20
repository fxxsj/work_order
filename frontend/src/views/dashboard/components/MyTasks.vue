<template>
  <div class="my-tasks">
    <el-card>
      <div slot="header" class="card-header">
        <span>我的待处理任务</span>
        <el-button type="primary" size="small" @click="$emit('view-all')">
          查看全部
        </el-button>
      </div>
      <el-table :data="tasks" style="width: 100%">
        <el-table-column label="施工单号" width="150">
          <template slot-scope="scope">
            <el-link
              v-if="scope.row.work_order_process_info?.work_order?.id"
              type="primary"
              @click="$router.push(`/workorders/${scope.row.work_order_process_info.work_order.id}`)"
            >
              {{ scope.row.work_order_process_info.work_order.order_number || '-' }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="work_content"
          label="任务内容"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <span :class="'status-badge status-' + scope.row.status">
              {{ getTaskStatusDisplay(scope.row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template slot-scope="scope">
            <el-progress
              :percentage="getTaskProgress(scope.row)"
              :color="getTaskProgress(scope.row) === 100 ? '#67C23A' : '#409EFF'"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              @click="$router.push(`/tasks`)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
const TASK_STATUS_MAP = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

export default {
  name: 'MyTasks',
  props: {
    tasks: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getTaskProgress(task) {
      if (!task.production_quantity || task.production_quantity === 0) return 0
      const progress = (task.quantity_completed / task.production_quantity) * 100
      return Math.min(Math.round(progress), 100)
    },
    getTaskStatusDisplay(status) {
      return TASK_STATUS_MAP[status] || status
    }
  }
}
</script>

<style scoped>
.my-tasks {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
