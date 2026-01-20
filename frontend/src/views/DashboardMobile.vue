<template>
  <div class="dashboard-mobile">
    <!-- 移动端头部 -->
    <div class="mobile-header">
      <div class="header-title">
        <i class="el-icon-s-home"></i>
        <span>工作台</span>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="createWorkOrder"
        >
          新建
        </el-button>
      </div>
    </div>

    <!-- 快速统计卡片 -->
    <div class="quick-stats">
      <div class="stat-card pending" @click="goToOrders('pending')">
        <div class="stat-icon">
          <i class="el-icon-time"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">
            {{ statistics.pending_orders || 0 }}
          </div>
          <div class="stat-label">
            待开始
          </div>
        </div>
      </div>

      <div class="stat-card progress" @click="goToOrders('in_progress')">
        <div class="stat-icon">
          <i class="el-icon-loading"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">
            {{ statistics.in_progress_orders || 0 }}
          </div>
          <div class="stat-label">
            进行中
          </div>
        </div>
      </div>

      <div class="stat-card urgent" @click="goToOrders('urgent')">
        <div class="stat-icon">
          <i class="el-icon-warning"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">
            {{ statistics.urgent_orders || 0 }}
          </div>
          <div class="stat-label">
            紧急
          </div>
        </div>
      </div>

      <div class="stat-card approval" @click="goToApprovals">
        <div class="stat-icon">
          <i class="el-icon-document-checked"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">
            {{ statistics.pending_approval || 0 }}
          </div>
          <div class="stat-label">
            待审核
          </div>
        </div>
      </div>
    </div>

    <!-- 功能入口 -->
    <div class="function-grid">
      <div class="function-item" @click="goToWorkOrders">
        <div class="function-icon">
          <i class="el-icon-document"></i>
        </div>
        <div class="function-label">
          施工单
        </div>
      </div>

      <div class="function-item" @click="goToTasks">
        <div class="function-icon">
          <i class="el-icon-s-operation"></i>
        </div>
        <div class="function-label">
          任务管理
        </div>
      </div>

      <div class="function-item" @click="goToCustomers">
        <div class="function-icon">
          <i class="el-icon-user"></i>
        </div>
        <div class="function-label">
          客户管理
        </div>
      </div>

      <div class="function-item" @click="goToProducts">
        <div class="function-icon">
          <i class="el-icon-goods"></i>
        </div>
        <div class="function-label">
          产品管理
        </div>
      </div>

      <div class="function-item" @click="goToMaterials">
        <div class="function-icon">
          <i class="el-icon-box"></i>
        </div>
        <div class="function-label">
          物料管理
        </div>
      </div>

      <div class="function-item" @click="goToReports">
        <div class="function-icon">
          <i class="el-icon-data-line"></i>
        </div>
        <div class="function-label">
          数据报表
        </div>
      </div>
    </div>

    <!-- 最近施工单 -->
    <div class="recent-orders">
      <div class="section-header">
        <span>最近施工单</span>
        <el-button type="text" size="small" @click="viewAllOrders">
          查看全部 <i class="el-icon-arrow-right"></i>
        </el-button>
      </div>

      <div class="order-list">
        <div
          v-for="order in recentOrders"
          :key="order.id"
          class="order-item"
          @click="goToOrderDetail(order.id)"
        >
          <div class="order-info">
            <div class="order-number">
              {{ order.order_number }}
            </div>
            <div class="order-customer">
              {{ order.customer_name }}
            </div>
          </div>

          <div class="order-status">
            <el-tag
              :type="getStatusTagType(order.status)"
              size="mini"
            >
              {{ getStatusLabel(order.status) }}
            </el-tag>
          </div>

          <div class="order-priority">
            <el-tag
              v-if="order.priority === 'urgent'"
              :type="getPriorityTagType(order.priority)"
              size="mini"
            >
              紧急
            </el-tag>
          </div>

          <div class="order-date">
            {{ formatDate(order.delivery_date) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 待办任务 -->
    <div class="pending-tasks">
      <div class="section-header">
        <span>待办任务</span>
        <el-badge :value="unreadTaskCount" class="task-badge">
          <el-button type="text" size="small" @click="viewAllTasks">
            查看全部 <i class="el-icon-arrow-right"></i>
          </el-button>
        </el-badge>
      </div>

      <div class="task-list">
        <div
          v-for="task in pendingTasks"
          :key="task.id"
          class="task-item"
          @click="goToTaskDetail(task.id)"
        >
          <div class="task-content">
            <div class="task-title">
              {{ task.work_content }}
            </div>
            <div class="task-meta">
              <span class="task-type">{{ getTaskTypeLabel(task.task_type) }}</span>
              <span v-if="task.deadline" class="task-deadline">
                截止: {{ formatDate(task.deadline) }}
              </span>
            </div>
          </div>

          <div class="task-priority">
            <el-tag
              v-if="task.priority === 'high'"
              :type="getPriorityTagType(task.priority)"
              size="mini"
            >
              高优先级
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-button
        type="primary"
        icon="el-icon-plus"
        size="large"
        class="action-button"
        @click="createWorkOrder"
      >
        创建施工单
      </el-button>

      <el-button
        icon="el-icon-search"
        size="large"
        class="action-button"
        @click="goToSearch"
      >
        搜索
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardMobile',
  data() {
    return {
      statistics: {
        pending_orders: 0,
        in_progress_orders: 0,
        urgent_orders: 0,
        pending_approval: 0
      },
      recentOrders: [],
      pendingTasks: [],
      unreadTaskCount: 0,
      loading: false
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        // 并行加载所有数据
        const [statsRes, ordersRes, tasksRes] = await Promise.all([
          this.$api.dashboard.getStatistics(),
          this.$api.workorder.getList({ limit: 5, ordering: '-created_at' }),
          this.$api.task.getList({ status: 'pending', limit: 5 })
        ])

        this.statistics = statsRes.data
        this.recentOrders = ordersRes.data.results || []
        this.pendingTasks = tasksRes.data.results || []
        this.unreadTaskCount = tasksRes.data.count || 0

      } catch (error) {
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },

    // 导航方法
    createWorkOrder() {
      this.$router.push('/workorders/create')
    },

    goToOrders(status) {
      this.$router.push({
        path: '/workorders',
        query: status ? { status } : {}
      })
    },

    goToApprovals() {
      this.$router.push('/workorders?approval_status=pending')
    },

    goToTasks() {
      this.$router.push('/tasks')
    },

    goToCustomers() {
      this.$router.push('/customers')
    },

    goToProducts() {
      this.$router.push('/products')
    },

    goToMaterials() {
      this.$router.push('/materials')
    },

    goToReports() {
      this.$router.push('/reports')
    },

    goToOrderDetail(orderId) {
      this.$router.push(`/workorders/${orderId}`)
    },

    goToTaskDetail(taskId) {
      this.$router.push(`/tasks/${taskId}`)
    },

    viewAllOrders() {
      this.$router.push('/workorders')
    },

    viewAllTasks() {
      this.$router.push('/tasks')
    },

    goToSearch() {
      this.$router.push('/search')
    },

    // 工具方法
    getStatusTagType(status) {
      const typeMap = {
        pending: 'info',
        in_progress: 'warning',
        completed: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || 'info'
    },

    getStatusLabel(status) {
      const labelMap = {
        pending: '待开始',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      }
      return labelMap[status] || status
    },

    getPriorityTagType(priority) {
      const typeMap = {
        low: 'info',
        normal: 'primary',
        high: 'warning',
        urgent: 'danger'
      }
      return typeMap[priority] || 'info'
    },

    getTaskTypeLabel(taskType) {
      const labelMap = {
        plate_making: '制版',
        cutting: '开料',
        printing: '印刷',
        foiling: '烫金',
        embossing: '压凸',
        die_cutting: '模切',
        packaging: '包装',
        general: '通用'
      }
      return labelMap[taskType] || taskType
    },

    formatDate(dateStr) {
      if (!dateStr) return ''

      const date = new Date(dateStr)
      const now = new Date()
      const diffTime = date - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        return '已过期'
      } else if (diffDays === 0) {
        return '今天'
      } else if (diffDays <= 3) {
        return `${diffDays}天后`
      } else {
        return date.toLocaleDateString()
      }
    }
  }
}
</script>

<style scoped>
.dashboard-mobile {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 60px; /* 为底部导航留空间 */
}

.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-title i {
  margin-right: 8px;
  color: #409EFF;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:active {
  transform: scale(0.95);
}

.stat-card.pending {
  border-left: 4px solid #409EFF;
}

.stat-card.progress {
  border-left: 4px solid #E6A23C;
}

.stat-card.urgent {
  border-left: 4px solid #F56C6C;
}

.stat-card.approval {
  border-left: 4px solid #67C23A;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
}

.stat-card.pending .stat-icon {
  background: #ecf5ff;
  color: #409EFF;
}

.stat-card.progress .stat-icon {
  background: #fdf6ec;
  color: #E6A23C;
}

.stat-card.urgent .stat-icon {
  background: #fef0f0;
  color: #F56C6C;
}

.stat-card.approval .stat-icon {
  background: #f0f9ff;
  color: #67C23A;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  padding: 20px;
}

.function-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.function-item:active {
  transform: scale(0.95);
}

.function-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #409EFF, #36D1DC);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: white;
  font-size: 20px;
}

.function-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 15px;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.recent-orders,
.pending-tasks {
  background: white;
  margin: 0 20px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.order-list,
.task-list {
  padding: 0 20px 20px;
}

.order-item,
.task-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.order-item:hover,
.task-item:hover {
  background-color: #fafafa;
}

.order-item:last-child,
.task-item:last-child {
  border-bottom: none;
}

.order-info,
.task-content {
  flex: 1;
}

.order-number,
.order-customer,
.task-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.order-customer,
.task-meta {
  font-size: 12px;
  color: #909399;
}

.order-status,
.order-priority,
.task-priority {
  margin-right: 10px;
}

.order-date,
.task-deadline {
  font-size: 12px;
  color: #909399;
}

.quick-actions {
  display: flex;
  gap: 15px;
  padding: 20px;
  justify-content: center;
}

.action-button {
  flex: 1;
  height: 50px;
  font-size: 16px;
}

.task-badge {
  position: relative;
}

/* 响应式优化 */
@media (max-width: 480px) {
  .quick-stats {
    grid-template-columns: 1fr;
    padding: 15px;
  }

  .function-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 15px;
  }

  .function-item {
    padding: 15px;
  }

  .function-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .stat-card {
    padding: 15px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .stat-number {
    font-size: 20px;
  }

  .quick-actions {
    flex-direction: column;
    padding: 15px;
  }

  .action-button {
    height: 45px;
    font-size: 14px;
  }
}

/* 添加触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .stat-card,
  .function-item,
  .order-item,
  .task-item {
    min-height: 44px; /* 最小触摸目标 */
  }

  .action-button {
    min-height: 48px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .dashboard-mobile {
    background: #1a1a1a;
  }

  .mobile-header,
  .stat-card,
  .function-item,
  .recent-orders,
  .pending-tasks {
    background: #2d2d2d;
    color: #ffffff;
  }

  .header-title,
  .stat-number,
  .function-label,
  .section-header,
  .order-number,
  .task-title {
    color: #ffffff;
  }

  .order-item,
  .task-item {
    border-bottom-color: #404040;
  }

  .order-item:hover,
  .task-item:hover {
    background-color: #363636;
  }
}
</style>
