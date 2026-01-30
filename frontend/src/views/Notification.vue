<template>
  <div class="notification-list">
    <el-card>
      <div slot="header" class="card-header">
        <span>通知中心</span>
        <div>
          <el-button
            v-if="unreadCount > 0"
            type="primary"
            size="small"
            :loading="markingAll"
            @click="markAllRead"
          >
            标记全部已读
          </el-button>
          <el-button
            type="default"
            size="small"
            icon="el-icon-refresh"
            style="margin-left: 10px;"
            @click="loadData"
          >
            刷新
          </el-button>
        </div>
      </div>

      <!-- 筛选 -->
      <div class="filter-section">
        <el-radio-group v-model="filters.is_read" size="small" @change="handleFilterChange">
          <el-radio-button :label="null">
            全部
          </el-radio-button>
          <el-radio-button :label="false">
            未读
          </el-radio-button>
          <el-radio-button :label="true">
            已读
          </el-radio-button>
        </el-radio-group>
        <el-select
          v-model="filters.notification_type"
          placeholder="通知类型"
          clearable
          size="small"
          style="width: 200px; margin-left: 10px;"
          @change="handleFilterChange"
        >
          <el-option label="审核通过" value="approval_passed" />
          <el-option label="审核拒绝" value="approval_rejected" />
          <el-option label="任务分派" value="task_assigned" />
          <el-option label="任务取消" value="task_cancelled" />
          <el-option label="工序完成" value="process_completed" />
          <el-option label="施工单完成" value="workorder_completed" />
          <el-option label="系统通知" value="system" />
        </el-select>
      </div>

      <!-- 通知列表 -->
      <el-table
        v-loading="loading"
        :data="notificationList"
        style="width: 100%; margin-top: 20px;"
        :row-class-name="getRowClassName"
      >
        <el-table-column label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-badge v-if="!scope.row.is_read" is-dot class="unread-badge" />
            <span v-else style="color: #909399;">已读</span>
          </template>
        </el-table-column>
        <el-table-column prop="notification_type_display" label="类型" width="120" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column
          prop="content"
          label="内容"
          min-width="300"
          show-overflow-tooltip
        />
        <el-table-column label="关联对象" width="150">
          <template slot-scope="scope">
            <el-link
              v-if="scope.row.work_order"
              type="primary"
              @click="goToWorkOrder(scope.row.work_order)"
            >
              施工单：{{ scope.row.work_order.order_number || scope.row.work_order }}
            </el-link>
            <span v-else-if="scope.row.task" style="color: #909399;">
              任务：{{ scope.row.task }}
            </span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="!scope.row.is_read"
              type="text"
              size="small"
              @click="markRead(scope.row)"
            >
              标记已读
            </el-button>
            <span v-else style="color: #909399;">已读</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.page_size"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { notificationAPI } from '@/api/modules'

export default {
  name: 'Notification',
  data() {
    return {
      notificationList: [],
      loading: false,
      markingAll: false,
      unreadCount: 0,
      filters: {
        is_read: null,
        notification_type: null
      },
      pagination: {
        page: 1,
        page_size: 20,
        total: 0
      }
    }
  },
  created() {
    this.loadData()
    this.loadUnreadCount()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.page_size,
          ordering: '-created_at'
        }

        if (this.filters.is_read !== null) {
          params.is_read = this.filters.is_read
        }
        if (this.filters.notification_type) {
          params.notification_type = this.filters.notification_type
        }

        const response = await notificationAPI.getList(params)
        this.notificationList = response.results || []
        this.pagination.total = response.count || 0
      } catch (error) {
        console.error('加载通知失败:', error)
        this.$message.error('加载通知失败')
      } finally {
        this.loading = false
      }
    },
    async loadUnreadCount() {
      try {
        const response = await notificationAPI.getUnreadCount()
        this.unreadCount = response.unread_count || 0
      } catch (error) {
        console.error('加载未读数量失败:', error)
      }
    },
    async markRead(notification) {
      try {
        await notificationAPI.markRead(notification.id)
        notification.is_read = true
        this.unreadCount = Math.max(0, this.unreadCount - 1)
        this.$message.success('已标记为已读')
      } catch (error) {
        console.error('标记已读失败:', error)
        this.$message.error('标记已读失败')
      }
    },
    async markAllRead() {
      this.markingAll = true
      try {
        await notificationAPI.markAllRead()
        this.$message.success('已标记全部为已读')
        await this.loadData()
        await this.loadUnreadCount()
      } catch (error) {
        console.error('标记全部已读失败:', error)
        this.$message.error('标记全部已读失败')
      } finally {
        this.markingAll = false
      }
    },
    handleFilterChange() {
      this.pagination.page = 1
      this.loadData()
    },
    handleSizeChange(size) {
      this.pagination.page_size = size
      this.pagination.page = 1
      this.loadData()
    },
    handleCurrentChange(page) {
      this.pagination.page = page
      this.loadData()
    },
    getRowClassName({ row }) {
      return row.is_read ? 'read-row' : 'unread-row'
    },
    goToWorkOrder(workOrder) {
      const workOrderId = typeof workOrder === 'object' ? workOrder.id : workOrder
      if (workOrderId) {
        this.$router.push(`/workorders/${workOrderId}`)
      }
    },
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.notification-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  margin-top: 20px;
}

.pagination-section {
  margin-top: 20px;
  text-align: right;
}

.unread-badge {
  width: 8px;
  height: 8px;
  background-color: #409EFF;
  border-radius: 50%;
  display: inline-block;
}

::v-deep .unread-row {
  background-color: #f0f9ff;
}

::v-deep .read-row {
  background-color: #fff;
}
</style>

