<template>
  <div class="dashboard">
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

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card class="stat-card">
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
      <el-col :span="6">
        <el-card class="stat-card">
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
      <el-col :span="6">
        <el-card class="stat-card">
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
      <el-col :span="6">
        <el-card class="stat-card">
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

    <!-- 图表和列表 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 状态分布 -->
      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span>状态分布</span>
          </div>
          <el-table :data="statusTableData" style="width: 100%">
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
      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span>优先级分布</span>
          </div>
          <el-table :data="priorityTableData" style="width: 100%">
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
import { workOrderAPI } from '@/api/workorder'

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

export default {
  name: 'Dashboard',
  data() {
    return {
      statistics: {},
      recentOrders: [],
      loading: false
    }
  },
  computed: {
    // 检查用户是否为业务员
    isSalesperson() {
      const userInfo = this.$store.getters.currentUser
      return userInfo && userInfo.is_salesperson
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
      } catch (error) {
        console.error('加载数据失败:', error)
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
    goToPendingApprovals() {
      // 跳转到施工单列表，并筛选出待审核的施工单
      this.$router.push({
        path: '/workorders',
        query: { approval_status: 'pending' }
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

