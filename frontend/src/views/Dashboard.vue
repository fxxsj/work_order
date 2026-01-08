<template>
  <div class="dashboard">
    <!-- 通知提醒（所有用户可见） -->
    <el-alert
      v-if="unreadNotificationCount > 0"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template slot="title">
        <span>您有 <strong style="color: #409EFF; font-size: 16px;">{{ unreadNotificationCount }}</strong> 条未读通知</span>
        <el-link type="primary" :underline="false" style="margin-left: 10px;" @click="goToNotifications">查看通知</el-link>
      </template>
    </el-alert>

    <!-- 待审核施工单提醒（仅业务员可见） -->
    <el-alert
      v-if="isSalesperson && statistics.pending_approval_count > 0"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template slot="title">
        <span>您有 <strong style="color: #E6A23C; font-size: 16px;">{{ statistics.pending_approval_count }}</strong> 个待审核的施工单，请及时处理。</span>
        <el-link type="primary" :underline="false" style="margin-left: 10px;" @click="goToPendingApprovals">点击查看</el-link>
      </template>
    </el-alert>

    <!-- 紧急事项提醒（管理员可见） -->
    <el-alert
      v-if="isAdmin && urgentItemsCount > 0"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template slot="title">
        <span>有 <strong style="color: #F56C6C; font-size: 16px;">{{ urgentItemsCount }}</strong> 项紧急事项需要处理</span>
        <el-link type="primary" :underline="false" style="margin-left: 10px;" @click="goToUrgentItems">查看详情</el-link>
      </template>
    </el-alert>

    <!-- 统计卡片 - 施工单统计 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToWorkOrderList()">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409EFF;">
              <i class="el-icon-document"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total_count || 0 }}</div>
              <div class="stat-label">施工单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToWorkOrderList({ status: 'completed' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <i class="el-icon-circle-check"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ getStatusCount('completed') }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToWorkOrderList({ status: 'in_progress' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <i class="el-icon-loading"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ getStatusCount('in_progress') }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToUpcomingDeadline()">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #F56C6C;">
              <i class="el-icon-warning"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.upcoming_deadline_count || 0 }}</div>
              <div class="stat-label">即将到期</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计卡片 - 任务统计（操作员、生产主管和管理员可见） -->
    <el-row v-if="isOperator || isSupervisor || isAdmin" :gutter="20" class="stat-cards" style="margin-top: 20px;">
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToTaskList()">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #909399;">
              <i class="el-icon-tickets"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStatistics.total_count || 0 }}</div>
              <div class="stat-label">任务总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToTaskList({ status: 'pending' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #C0C4CC;">
              <i class="el-icon-time"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStatusCount.pending || 0 }}</div>
              <div class="stat-label">待开始任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToTaskList({ status: 'in_progress' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <i class="el-icon-loading"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStatusCount.in_progress || 0 }}</div>
              <div class="stat-label">进行中任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToTaskList({ status: 'completed' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <i class="el-icon-circle-check"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStatusCount.completed || 0 }}</div>
              <div class="stat-label">已完成任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表和列表 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 状态分布 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header">
            <span>施工单状态分布</span>
          </div>
          <el-table 
            :data="statusTableData" 
            style="width: 100%"
            @row-click="handleStatusRowClick"
            :row-style="{ cursor: 'pointer' }"
          >
            <el-table-column prop="status_display" label="状态" width="120">
              <template slot-scope="scope">
                <span :class="'status-badge status-' + scope.row.status">
                  {{ scope.row.status_display }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" align="right"></el-table-column>
            <el-table-column label="占比" align="right">
              <template slot-scope="scope">
                {{ getPercentage(scope.row.count) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 优先级分布 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header">
            <span>优先级分布</span>
          </div>
          <el-table 
            :data="priorityTableData" 
            style="width: 100%"
            @row-click="handlePriorityRowClick"
            :row-style="{ cursor: 'pointer' }"
          >
            <el-table-column prop="priority_display" label="优先级" width="120">
              <template slot-scope="scope">
                <span :class="'status-badge priority-' + scope.row.priority">
                  {{ scope.row.priority_display }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" align="right"></el-table-column>
            <el-table-column label="占比" align="right">
              <template slot-scope="scope">
                {{ getPercentage(scope.row.count) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务状态分布（操作员、生产主管和管理员可见） -->
    <el-row v-if="isOperator || isSupervisor || isAdmin" :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header">
            <span>任务状态分布</span>
          </div>
          <el-table 
            :data="taskStatusStatistics" 
            style="width: 100%"
            @row-click="(row) => goToTaskList({ status: row.status })"
            :row-style="{ cursor: 'pointer' }"
          >
            <el-table-column prop="status_display" label="状态" width="120">
              <template slot-scope="scope">
                <span :class="'status-badge status-' + scope.row.status">
                  {{ scope.row.status_display }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" align="right"></el-table-column>
            <el-table-column label="占比" align="right">
              <template slot-scope="scope">
                {{ getTaskPercentage(scope.row.count) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 生产效率分析（生产主管和管理员可见） -->
      <el-col v-if="isSupervisor || isAdmin" :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header">
            <span>生产效率分析</span>
          </div>
          <div style="padding: 10px 0;">
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>工序完成率</span>
                <span style="font-weight: bold; color: #409EFF;">
                  {{ efficiencyAnalysis.process_completion_rate || 0 }}%
                </span>
              </div>
              <el-progress 
                :percentage="efficiencyAnalysis.process_completion_rate || 0"
                :color="getProgressColor(efficiencyAnalysis.process_completion_rate)"
              ></el-progress>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>任务完成率</span>
                <span style="font-weight: bold; color: #409EFF;">
                  {{ taskStatistics.completion_rate || 0 }}%
                </span>
              </div>
              <el-progress 
                :percentage="taskStatistics.completion_rate || 0"
                :color="getProgressColor(taskStatistics.completion_rate)"
              ></el-progress>
            </div>
            <div style="margin-bottom: 15px;" v-if="efficiencyAnalysis.avg_completion_time_hours">
              <div style="display: flex; justify-content: space-between;">
                <span>平均完成时间</span>
                <span style="font-weight: bold; color: #67C23A;">
                  {{ efficiencyAnalysis.avg_completion_time_hours }} 小时
                </span>
              </div>
            </div>
            <div v-if="efficiencyAnalysis.defective_rate !== undefined">
              <div style="display: flex; justify-content: space-between;">
                <span>不良品率</span>
                <span style="font-weight: bold; color: #F56C6C;">
                  {{ efficiencyAnalysis.defective_rate }}%
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待确认图稿/版型（设计员可见） -->
    <el-row v-if="isDesigner" :gutter="20" style="margin-top: 20px;">
      <!-- 待确认图稿 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header" class="card-header">
            <span>待确认图稿</span>
            <el-button type="primary" size="small" @click="$router.push('/artworks')">
              查看全部
            </el-button>
          </div>
          <div v-if="pendingArtworks.length > 0">
            <el-table :data="pendingArtworks" style="width: 100%" max-height="300">
              <el-table-column prop="code" label="图稿编码" width="150"></el-table-column>
              <el-table-column prop="name" label="图稿名称" min-width="150" show-overflow-tooltip></el-table-column>
              <el-table-column label="操作" width="100">
                <template>
                  <el-button
                    type="text"
                    size="small"
                    @click="$router.push(`/artworks`)"
                  >
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else style="text-align: center; padding: 20px; color: #909399;">
            暂无待确认图稿
          </div>
        </el-card>
      </el-col>

      <!-- 待确认统计 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header">
            <span>确认统计</span>
          </div>
          <div style="padding: 20px;">
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>待确认图稿</span>
                <span style="font-weight: bold; color: #E6A23C;">
                  {{ pendingArtworksCount }}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>已确认图稿</span>
                <span style="font-weight: bold; color: #67C23A;">
                  {{ confirmedArtworksCount }}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>总计</span>
                <span style="font-weight: bold; color: #409EFF;">
                  {{ totalArtworksCount }}
                </span>
              </div>
            </div>
            <el-progress
              :percentage="artworkConfirmationRate"
              :color="getProgressColor(artworkConfirmationRate)"
            ></el-progress>
            <div style="text-align: center; margin-top: 10px; color: #909399; font-size: 12px;">
              确认率：{{ artworkConfirmationRate }}%
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 我的任务列表（操作员可见） -->
    <el-card v-if="isOperator && myTasks.length > 0" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>我的待处理任务</span>
        <el-button type="primary" size="small" @click="goToMyTasks">
          查看全部
        </el-button>
      </div>
      <el-table :data="myTasks" style="width: 100%">
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
        <el-table-column prop="work_content" label="任务内容" min-width="200" show-overflow-tooltip></el-table-column>
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
            ></el-progress>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template>
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

    <!-- 业务分析（管理员可见） -->
    <el-row v-if="isAdmin" :gutter="20" style="margin-top: 20px;">
      <!-- 客户统计 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header" class="card-header">
            <span>客户统计（Top 10）</span>
          </div>
          <el-table 
            :data="businessAnalysis.customer_statistics || []" 
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="customer" label="客户" min-width="150"></el-table-column>
            <el-table-column prop="total" label="施工单数" width="100" align="right"></el-table-column>
            <el-table-column prop="completed" label="已完成" width="100" align="right"></el-table-column>
            <el-table-column label="完成率" width="120" align="right">
              <template slot-scope="scope">
                <el-progress 
                  :percentage="scope.row.completion_rate || 0"
                  :color="getProgressColor(scope.row.completion_rate)"
                  :stroke-width="8"
                ></el-progress>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 产品统计 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header" class="card-header">
            <span>产品统计（Top 10）</span>
          </div>
          <el-table 
            :data="businessAnalysis.product_statistics || []" 
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="product_name" label="产品名称" min-width="150"></el-table-column>
            <el-table-column prop="product_code" label="产品编码" width="120"></el-table-column>
            <el-table-column prop="order_count" label="施工单数" width="100" align="right"></el-table-column>
            <el-table-column prop="total_quantity" label="总数量" width="100" align="right"></el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 部门任务统计（管理员和生产主管可见） -->
    <el-row v-if="isAdmin || isSupervisor" :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :sm="24" :md="24">
        <el-card>
          <div slot="header" class="card-header">
            <span>部门任务统计</span>
          </div>
          <el-table 
            :data="departmentStatistics" 
            style="width: 100%"
            @row-click="(row) => goToTaskList({ assigned_department__name: row.department })"
            :row-style="{ cursor: 'pointer' }"
          >
            <el-table-column prop="department" label="部门" min-width="150"></el-table-column>
            <el-table-column prop="total" label="任务总数" width="120" align="right"></el-table-column>
            <el-table-column prop="completed" label="已完成" width="120" align="right"></el-table-column>
            <el-table-column label="完成率" width="200" align="right">
              <template slot-scope="scope">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <el-progress 
                    :percentage="scope.row.completion_rate || 0"
                    :color="getProgressColor(scope.row.completion_rate)"
                    :stroke-width="10"
                    style="flex: 1;"
                  ></el-progress>
                  <span style="min-width: 50px; text-align: right; font-weight: bold;">
                    {{ scope.row.completion_rate || 0 }}%
                  </span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近的施工单 -->
    <el-card style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>最近的施工单</span>
        <el-button type="primary" size="small" @click="$router.push('/workorders')">
          查看全部
        </el-button>
      </div>
      <el-table :data="recentOrders" style="width: 100%">
        <el-table-column prop="order_number" label="施工单号" width="150"></el-table-column>
        <el-table-column prop="customer_name" label="客户"></el-table-column>
        <el-table-column prop="product_name" label="产品名称"></el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <span :class="'status-badge status-' + scope.row.status">
              {{ scope.row.status_display }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template slot-scope="scope">
            <el-progress
              :percentage="scope.row.progress_percentage"
              :color="scope.row.progress_percentage === 100 ? '#67C23A' : '#409EFF'"
            ></el-progress>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="交货日期" width="120">
          <template slot-scope="scope">
            {{ scope.row.delivery_date | formatDate }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              @click="$router.push(`/workorders/${scope.row.id}`)"
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
import { workOrderAPI, workOrderTaskAPI, notificationAPI, artworkAPI } from '@/api/workorder'
import { hasRole, hasAnyRole } from '@/utils/userRole'

const STATUS_MAP = {
  pending: '待开始',
  in_progress: '进行中',
  paused: '已暂停',
  completed: '已完成',
  cancelled: '已取消'
}

const PRIORITY_MAP = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急'
}

const TASK_STATUS_MAP = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

export default {
  name: 'Dashboard',
  data() {
    return {
      statistics: {},
      recentOrders: [],
      myTasks: [], // 我的任务列表（操作员）
      recentNotifications: [], // 最近的通知
      unreadNotificationCount: 0, // 未读通知数量
      pendingArtworks: [], // 待确认图稿（设计员）
      loading: false
    }
  },
  computed: {
    // 检查用户是否为业务员
    isSalesperson() {
      return hasRole(this.$store, '业务员')
    },
    // 检查用户是否为生产主管
    isSupervisor() {
      return hasAnyRole(this.$store, ['生产主管', '管理员'])
    },
    // 检查用户是否为操作员
    isOperator() {
      return hasAnyRole(this.$store, ['操作员', '生产主管'])
    },
    // 检查用户是否为设计员
    isDesigner() {
      return hasRole(this.$store, '设计员')
    },
    // 检查用户是否为管理员
    isAdmin() {
      const userInfo = this.$store.getters.currentUser
      return userInfo && userInfo.is_superuser === true
    },
    // 获取业务分析数据
    businessAnalysis() {
      return this.statistics.business_analysis || {}
    },
    // 获取部门任务统计
    departmentStatistics() {
      return this.taskStatistics.department_statistics || []
    },
    // 计算紧急事项数量
    urgentItemsCount() {
      let count = 0
      // 紧急优先级的施工单
      const urgentWorkOrders = this.statistics.priority_statistics?.find(p => p.priority === 'urgent')
      if (urgentWorkOrders) count += urgentWorkOrders.count
      // 即将到期的施工单
      if (this.statistics.upcoming_deadline_count) count += this.statistics.upcoming_deadline_count
      return count
    },
    // 待确认图稿数量
    pendingArtworksCount() {
      return this.pendingArtworks.length
    },
    // 已确认图稿数量（从统计数据中获取，或从API获取）
    confirmedArtworksCount() {
      // 这里可以从API获取，暂时返回0
      return 0
    },
    // 总图稿数量
    totalArtworksCount() {
      return this.pendingArtworksCount + this.confirmedArtworksCount
    },
    // 图稿确认率
    artworkConfirmationRate() {
      if (this.totalArtworksCount === 0) return 0
      return Math.round((this.confirmedArtworksCount / this.totalArtworksCount) * 100)
    },
    // 获取任务统计数据
    taskStatistics() {
      return this.statistics.task_statistics || {}
    },
    // 获取生产效率分析数据
    efficiencyAnalysis() {
      return this.statistics.efficiency_analysis || {}
    },
    // 获取任务状态统计
    taskStatusStatistics() {
      if (!this.taskStatistics.status_statistics) return []
      return this.taskStatistics.status_statistics.map(item => ({
        ...item,
        status_display: TASK_STATUS_MAP[item.status] || item.status
      }))
    },
    // 获取任务状态数量
    taskStatusCount() {
      const stats = this.taskStatistics.status_statistics || []
      const result = {}
      stats.forEach(item => {
        result[item.status] = item.count
      })
      return result
    },
    statusTableData() {
      if (!this.statistics.status_statistics) return []
      return this.statistics.status_statistics.map(item => ({
        ...item,
        status_display: STATUS_MAP[item.status] || item.status
      }))
    },
    priorityTableData() {
      if (!this.statistics.priority_statistics) return []
      return this.statistics.priority_statistics.map(item => ({
        ...item,
        priority_display: PRIORITY_MAP[item.priority] || item.priority
      }))
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        // 加载统计数据
        const stats = await workOrderAPI.getStatistics()
        this.statistics = stats

        // 加载最近的施工单
        const response = await workOrderAPI.getList({
          page_size: 10,
          ordering: '-created_at'
        })
        this.recentOrders = response.results || []

        // 如果是操作员，加载我的任务
        if (this.isOperator) {
          const userInfo = this.$store.getters.currentUser
          if (userInfo && userInfo.id) {
            try {
              const taskResponse = await workOrderTaskAPI.getList({
                assigned_operator: userInfo.id,
                page_size: 10,
                ordering: '-created_at'
              })
              this.myTasks = taskResponse.results || []
            } catch (error) {
              console.error('加载我的任务失败:', error)
            }
          }
        }

        // 加载通知数据
        try {
          const unreadResponse = await notificationAPI.getUnreadCount()
          this.unreadNotificationCount = unreadResponse.unread_count || 0

          // 加载最近3条重要通知
          const notificationResponse = await notificationAPI.getList({
            page_size: 3,
            ordering: '-created_at',
            is_read: false
          })
          this.recentNotifications = notificationResponse.results || []
        } catch (error) {
          console.error('加载通知失败:', error)
        }

        // 如果是设计员，加载待确认图稿
        if (this.isDesigner) {
          try {
            // 由于后端API不支持confirmed字段过滤，获取所有图稿然后前端过滤
            const artworkResponse = await artworkAPI.getList({
              page_size: 50,
              ordering: '-created_at'
            })
            // 前端过滤未确认的图稿
            this.pendingArtworks = (artworkResponse.results || [])
              .filter(item => !item.confirmed)
              .slice(0, 10)
              .map(item => ({
                ...item,
                code: item.code || (item.base_code ? (item.base_code + (item.version > 1 ? '-v' + item.version : '')) : '-')
              }))
          } catch (error) {
            console.error('加载待确认图稿失败:', error)
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        this.$message.error('加载数据失败，请刷新重试')
      } finally {
        this.loading = false
      }
    },
    getStatusCount(status) {
      if (!this.statistics.status_statistics) return 0
      const item = this.statistics.status_statistics.find(s => s.status === status)
      return item ? item.count : 0
    },
    getPercentage(count) {
      const total = this.statistics.total_count || 0
      if (total === 0) return 0
      return ((count / total) * 100).toFixed(1)
    },
    getTaskPercentage(count) {
      const total = this.taskStatistics.total_count || 0
      if (total === 0) return 0
      return ((count / total) * 100).toFixed(1)
    },
    getTaskProgress(task) {
      if (!task.production_quantity || task.production_quantity === 0) return 0
      const progress = (task.quantity_completed / task.production_quantity) * 100
      return Math.min(Math.round(progress), 100)
    },
    getProgressColor(percentage) {
      if (percentage >= 80) return '#67C23A'
      if (percentage >= 50) return '#E6A23C'
      return '#F56C6C'
    },
    getTaskStatusDisplay(status) {
      return TASK_STATUS_MAP[status] || status
    },
    goToPendingApprovals() {
      // 跳转到施工单列表，并筛选出当前业务员负责的待审核施工单
      const userInfo = this.$store.getters.currentUser
      if (!userInfo || !userInfo.id) return
      
      this.$router.push({
        path: '/workorders',
        query: {
          approval_status: 'pending',
          customer__salesperson: userInfo.id
        }
      })
    },
    goToWorkOrderList(filters = {}) {
      // 跳转到施工单列表，并应用筛选条件
      const query = { ...filters }
      this.$router.push({
        path: '/workorders',
        query
      })
    },
    handleStatusRowClick(row) {
      // 点击状态行，跳转到对应状态的施工单列表
      this.goToWorkOrderList({ status: row.status })
    },
    handlePriorityRowClick(row) {
      // 点击优先级行，跳转到对应优先级的施工单列表
      this.goToWorkOrderList({ priority: row.priority })
    },
    goToUpcomingDeadline() {
      // 跳转到即将到期的施工单列表
      // 即将到期：交货日期在未来7天内
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      this.$router.push({
        path: '/workorders',
        query: {
          delivery_date__gte: today.toISOString().split('T')[0],
          delivery_date__lte: nextWeek.toISOString().split('T')[0]
        }
      })
    },
    // 跳转到任务列表
    goToTaskList(filters = {}) {
      this.$router.push({
        path: '/tasks',
        query: filters
      })
    },
    // 跳转到我的任务
    goToMyTasks() {
      const userInfo = this.$store.getters.currentUser
      if (userInfo && userInfo.id) {
        this.goToTaskList({ assigned_operator: userInfo.id })
      }
    },
    // 跳转到通知列表
    goToNotifications() {
      this.$router.push('/notifications')
    },
    // 跳转到紧急事项
    goToUrgentItems() {
      this.$router.push({
        path: '/workorders',
        query: {
          priority: 'urgent'
        }
      })
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

