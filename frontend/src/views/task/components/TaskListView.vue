<template>
  <div class="task-list-view">
    <el-table
      :data="tasks"
      v-loading="loading"
      border
      style="width: 100%"
      @row-click="handleRowClick"
    >
      <el-table-column prop="id" label="任务ID" width="80" align="center"></el-table-column>

      <el-table-column label="施工单号" width="150">
        <template slot-scope="scope">
          {{ scope.row.work_order_process_info?.work_order?.order_number || '-' }}
        </template>
      </el-table-column>

      <el-table-column prop="work_content" label="任务内容" min-width="200" show-overflow-tooltip></el-table-column>

      <el-table-column label="任务类型" width="120">
        <template slot-scope="scope">
          <el-tag :type="getTaskTypeTagType(scope.row.task_type)" size="small">
            {{ scope.row.task_type_display }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="getStatusTagType(scope.row.status)" size="small">
            {{ scope.row.status_display }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作员" width="120">
        <template slot-scope="scope">
          {{ scope.row.assigned_operator_name || '未分配' }}
        </template>
      </el-table-column>

      <el-table-column label="进度" width="150">
        <template slot-scope="scope">
          <el-progress
            :percentage="calculateProgress(scope.row)"
            :color="getProgressColor(scope.row)"
          ></el-progress>
        </template>
      </el-table-column>

      <el-table-column label="截止日期" width="120">
        <template slot-scope="scope">
          <span :class="{ 'text-overdue': isOverdue(scope.row) }">
            {{ formatDate(scope.row.deadline) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="250" fixed="right">
        <template slot-scope="scope">
          <el-button
            v-if="canUpdate(scope.row)"
            type="primary"
            size="mini"
            icon="el-icon-edit"
            @click.stop="handleUpdate(scope.row)"
          >
            更新
          </el-button>
          <el-button
            v-if="canAssign(scope.row)"
            type="warning"
            size="mini"
            icon="el-icon-user"
            @click.stop="handleAssign(scope.row)"
          >
            分派
          </el-button>
          <el-button
            v-if="canComplete(scope.row)"
            type="success"
            size="mini"
            icon="el-icon-check"
            @click.stop="handleComplete(scope.row)"
          >
            完成
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div style="margin-top: 20px; text-align: right;">
      <el-pagination
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import { taskService, permissionService } from '@/services'

export default {
  name: 'TaskListView',
  props: {
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
    },
    total: {
      type: Number,
      default: 0
    },
    currentPage: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 20
    }
  },
  methods: {
    getTaskTypeTagType(taskType) {
      const typeMap = {
        plate_making: 'success',
        printing: 'primary',
        post_press: 'warning',
        material: 'info'
      }
      return typeMap[taskType] || ''
    },
    getStatusTagType(status) {
      return taskService.getStatusType(status)
    },
    calculateProgress(task) {
      return taskService.calculateProgress(task)
    },
    getProgressColor(task) {
      const progress = this.calculateProgress(task)
      return progress === 100 ? '#67C23A' : '#409EFF'
    },
    isOverdue(task) {
      return taskService.isOverdue(task)
    },
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN')
    },
    canUpdate(task) {
      if (!this.editable) return false
      return task.status !== 'completed' && task.status !== 'cancelled'
    },
    canAssign(task) {
      if (!this.editable) return false
      return permissionService.canOperateTask(task, 'assign')
    },
    canComplete(task) {
      if (!this.editable) return false
      return taskService.canComplete(task)
    },
    handleRowClick(row) {
      this.$emit('row-click', row)
    },
    handleUpdate(task) {
      this.$emit('task-update', task)
    },
    handleAssign(task) {
      this.$emit('task-assign', task)
    },
    handleComplete(task) {
      this.$emit('task-complete', task)
    },
    handleSizeChange(size) {
      this.$emit('page-size-change', size)
    },
    handleCurrentChange(page) {
      this.$emit('page-change', page)
    }
  }
}
</script>

<style scoped>
.task-list-view {
  margin-top: 20px;
}

.text-overdue {
  color: #F56C6C;
  font-weight: bold;
}

.el-table {
  cursor: pointer;
}

.el-table .el-table__row:hover {
  background-color: #F5F7FA;
}
</style>
