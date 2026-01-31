<template>
  <div class="task-section" v-loading="loading">
    <!-- 统计头部 -->
    <div class="task-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ taskStats.total }}</div>
            <div class="stat-label">全部任务</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item draft">
            <div class="stat-value">{{ taskStats.draft }}</div>
            <div class="stat-label">草稿任务</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item pending">
            <div class="stat-value">{{ taskStats.pending }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item completed">
            <div class="stat-value">{{ taskStats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 任务列表 -->
    <div v-if="tasks.length > 0" class="task-list">
      <el-table
        :data="tasks"
        border
        style="width: 100%"
        size="small"
      >
        <el-table-column
          prop="id"
          label="ID"
          width="80"
          align="center"
        />
        <el-table-column label="工序" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.process_name || scope.row.work_order_process_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="任务内容" min-width="200">
          <template slot-scope="scope">
            {{ scope.row.work_content || scope.row.task_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="部门" width="120">
          <template slot-scope="scope">
            {{ scope.row.department_name || scope.row.assigned_department_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作员" width="100">
          <template slot-scope="scope">
            {{ scope.row.operator_name || scope.row.assigned_operator_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              size="small"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120" align="center">
          <template slot-scope="scope">
            {{ scope.row.quantity_completed || 0 }} / {{ scope.row.production_quantity || 0 }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="暂无任务" :image-size="80">
        <template v-if="editable">
          <el-button type="primary" size="small" @click="$emit('generate-tasks')">
            生成任务
          </el-button>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskSection',
  props: {
    workOrderId: {
      type: [String, Number],
      default: null
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
    taskStats() {
      const stats = {
        total: 0,
        draft: 0,
        pending: 0,
        completed: 0
      }

      const taskList = this.tasks || []
      stats.total = taskList.length

      taskList.forEach(task => {
        if (task.status === 'draft' || task.is_draft) {
          stats.draft++
        } else if (task.status === 'pending' || task.status === 'in_progress') {
          stats.pending++
        } else if (task.status === 'completed') {
          stats.completed++
        }
      })

      return stats
    }
  },
  methods: {
    getStatusType(status) {
      const statusMap = {
        'draft': 'info',
        'pending': 'warning',
        'in_progress': 'primary',
        'completed': 'success',
        'cancelled': 'danger'
      }
      return statusMap[status] || 'info'
    },
    getStatusText(status) {
      const statusTextMap = {
        'draft': '草稿',
        'pending': '待处理',
        'in_progress': '进行中',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      return statusTextMap[status] || status
    }
  }
}
</script>

<style scoped>
.task-section {
  margin-top: 10px;
}

.task-stats {
  background: #f5f7fa;
  padding: 15px 20px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.stat-item.draft .stat-value {
  color: #909399;
}

.stat-item.pending .stat-value {
  color: #e6a23c;
}

.stat-item.completed .stat-value {
  color: #67c23a;
}

.task-list {
  margin-top: 15px;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.el-table {
  margin-top: 0;
}
</style>
