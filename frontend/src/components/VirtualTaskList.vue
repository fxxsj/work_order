<template>
  <div class="virtual-task-list">
    <VirtualList
      :items="tasks"
      :item-size="60"
      :height="listHeight"
      :has-more="hasMore"
      :loading="loading"
      :show-pagination="showPagination"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      @row-click="handleTaskClick"
      @load-more="handleLoadMore"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <!-- 表头列定义 -->
      <template #columns>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="施工单号" width="150" />
        <el-table-column label="工序" width="120" />
        <el-table-column prop="work_content" label="任务内容" min-width="200" />
        <el-table-column label="分派部门" width="120" />
        <el-table-column label="状态" width="100" />
        <el-table-column label="优先级" width="80" />
        <el-table-column label="操作" width="200" fixed="right" />
      </template>

      <!-- 列表项模板 -->
      <template #item="{ item, index }">
        <div
          class="task-item"
          :class="{
            'task-item-pending': item.status === 'pending',
            'task-item-progress': item.status === 'in_progress',
            'task-item-completed': item.status === 'completed'
          }"
        >
          <!-- ID -->
          <div class="task-cell" style="width: 80px; padding: 0 8px;">#{{ item.id }}</div>

          <!-- 施工单号 -->
          <div class="task-cell" style="width: 150px; padding: 0 8px;">
            <el-link
              v-if="item.work_order_process_info?.work_order?.id"
              type="primary"
              @click.stop="goToWorkOrder(item.work_order_process_info.work_order)"
            >
              {{ item.work_order_process_info.work_order.order_number || '-' }}
            </el-link>
            <span v-else>-</span>
          </div>

          <!-- 工序 -->
          <div class="task-cell" style="width: 120px; padding: 0 8px;">
            <el-tag size="mini" type="info">
              {{ item.work_order_process_info?.process?.name || '-' }}
            </el-tag>
          </div>

          <!-- 任务内容 -->
          <div class="task-cell" style="flex: 1; min-width: 200px; padding: 0 8px;">
            <div class="task-content">{{ item.work_content || '-' }}</div>
          </div>

          <!-- 分派部门 -->
          <div class="task-cell" style="width: 120px; padding: 0 8px;">
            {{ item.assigned_department_name || '-' }}
          </div>

          <!-- 状态 -->
          <div class="task-cell" style="width: 100px; padding: 0 8px;">
            <el-tag
              :type="getStatusType(item.status)"
              size="small"
            >
              {{ getStatusText(item.status) }}
            </el-tag>
          </div>

          <!-- 优先级 -->
          <div class="task-cell" style="width: 80px; padding: 0 8px;">
            <el-tag
              v-if="item.priority"
              :type="getPriorityType(item.priority)"
              size="mini"
            >
              {{ getPriorityText(item.priority) }}
            </el-tag>
            <span v-else>-</span>
          </div>

          <!-- 操作 -->
          <div class="task-cell task-actions" style="width: 200px; padding: 0 8px;">
            <el-button
              size="mini"
              type="primary"
              icon="el-icon-edit"
              @click.stop="handleEdit(item)"
            >
              编辑
            </el-button>
            <el-button
              size="mini"
              type="success"
              icon="el-icon-check"
              @click.stop="handleComplete(item)"
              :disabled="item.status === 'completed'"
            >
              完成
            </el-button>
          </div>
        </div>
      </template>
    </VirtualList>
  </div>
</template>

<script>
import VirtualList from './VirtualList.vue'

export default {
  name: 'VirtualTaskList',

  components: {
    VirtualList
  },

  props: {
    tasks: {
      type: Array,
      default: () => []
    },
    hasMore: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    showPagination: {
      type: Boolean,
      default: true
    },
    currentPage: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 20
    },
    total: {
      type: Number,
      default: 0
    },
    listHeight: {
      type: String,
      default: '600px'
    }
  },

  methods: {
    handleTaskClick(task, index) {
      this.$emit('task-click', task, index)
    },

    handleLoadMore() {
      this.$emit('load-more')
    },

    handlePageChange(page) {
      this.$emit('page-change', page)
    },

    handleSizeChange(size) {
      this.$emit('size-change', size)
    },

    handleEdit(task) {
      this.$emit('task-edit', task)
    },

    handleComplete(task) {
      this.$emit('task-complete', task)
    },

    goToWorkOrder(workOrder) {
      this.$router.push({
        name: 'WorkOrderDetail',
        params: { id: workOrder.id }
      })
    },

    getStatusText(status) {
      const statusMap = {
        pending: '待开始',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    },

    getStatusType(status) {
      const typeMap = {
        pending: 'info',
        in_progress: 'warning',
        completed: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || 'info'
    },

    getPriorityText(priority) {
      const priorityMap = {
        low: '低',
        normal: '中',
        high: '高',
        urgent: '紧急'
      }
      return priorityMap[priority] || priority
    },

    getPriorityType(priority) {
      const typeMap = {
        low: 'info',
        normal: '',
        high: 'warning',
        urgent: 'danger'
      }
      return typeMap[priority] || ''
    }
  }
}
</script>

<style scoped>
.virtual-task-list {
  width: 100%;
}

.task-item {
  display: flex;
  align-items: center;
  height: 60px;
  font-size: 14px;
  color: #606266;
}

.task-item:hover {
  background-color: #f5f7fa;
}

.task-cell {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-content {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-actions {
  gap: 8px;
}

.task-actions .el-button {
  margin: 0;
}

/* 状态样式 */
.task-item-pending {
  border-left: 3px solid #909399;
}

.task-item-progress {
  border-left: 3px solid #e6a23c;
}

.task-item-completed {
  border-left: 3px solid #67c23a;
  opacity: 0.8;
}
</style>
