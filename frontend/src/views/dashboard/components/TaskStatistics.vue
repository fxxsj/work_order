<template>
  <div class="task-statistics">
    <!-- 任务统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="$emit('navigate', {})">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #909399;">
              <i class="el-icon-tickets"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ taskStatistics.total_count || 0 }}
              </div>
              <div class="stat-label">
                任务总数
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="$emit('navigate', { status: 'pending' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #C0C4CC;">
              <i class="el-icon-time"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ taskStatusCount.pending || 0 }}
              </div>
              <div class="stat-label">
                待开始任务
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="$emit('navigate', { status: 'in_progress' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <i class="el-icon-loading"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ taskStatusCount.in_progress || 0 }}
              </div>
              <div class="stat-label">
                进行中任务
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="$emit('navigate', { status: 'completed' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <i class="el-icon-circle-check"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ taskStatusCount.completed || 0 }}
              </div>
              <div class="stat-label">
                已完成任务
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务状态分布和生产效率 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 任务状态分布 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header">
            <span>任务状态分布</span>
          </div>
          <el-table
            :data="taskStatusStatistics"
            style="width: 100%"
            :row-style="{ cursor: 'pointer' }"
            @row-click="(row) => $emit('navigate', { status: row.status })"
          >
            <el-table-column prop="status_display" label="状态" width="120">
              <template slot-scope="scope">
                <span :class="'status-badge status-' + scope.row.status">
                  {{ scope.row.status_display }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" align="right" />
            <el-table-column label="占比" align="right">
              <template slot-scope="scope">
                {{ getPercentage(scope.row.count) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 生产效率分析 -->
      <el-col
        v-if="showEfficiency"
        :xs="24"
        :sm="12"
        :md="12"
      >
        <el-card>
          <div slot="header">
            <span>生产效率分析</span>
          </div>
          <div class="efficiency-content">
            <div class="efficiency-item">
              <div class="efficiency-header">
                <span>工序完成率</span>
                <span class="efficiency-value">{{ efficiencyAnalysis.process_completion_rate || 0 }}%</span>
              </div>
              <el-progress
                :percentage="efficiencyAnalysis.process_completion_rate || 0"
                :color="getProgressColor(efficiencyAnalysis.process_completion_rate)"
              />
            </div>
            <div class="efficiency-item">
              <div class="efficiency-header">
                <span>任务完成率</span>
                <span class="efficiency-value">{{ taskStatistics.completion_rate || 0 }}%</span>
              </div>
              <el-progress
                :percentage="taskStatistics.completion_rate || 0"
                :color="getProgressColor(taskStatistics.completion_rate)"
              />
            </div>
            <div v-if="efficiencyAnalysis.avg_completion_time_hours" class="efficiency-item">
              <div class="efficiency-header">
                <span>平均完成时间</span>
                <span class="efficiency-value success">
                  {{ efficiencyAnalysis.avg_completion_time_hours }} 小时
                </span>
              </div>
            </div>
            <div v-if="efficiencyAnalysis.defective_rate !== undefined" class="efficiency-item">
              <div class="efficiency-header">
                <span>不良品率</span>
                <span class="efficiency-value error">
                  {{ efficiencyAnalysis.defective_rate }}%
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
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
  name: 'TaskStatistics',
  props: {
    taskStatistics: {
      type: Object,
      default: () => ({})
    },
    efficiencyAnalysis: {
      type: Object,
      default: () => ({})
    },
    showEfficiency: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    taskStatusStatistics() {
      if (!this.taskStatistics.status_statistics) return []
      return this.taskStatistics.status_statistics.map(item => ({
        ...item,
        status_display: TASK_STATUS_MAP[item.status] || item.status
      }))
    },
    taskStatusCount() {
      const stats = this.taskStatistics.status_statistics || []
      const result = {}
      stats.forEach(item => {
        result[item.status] = item.count
      })
      return result
    }
  },
  methods: {
    getPercentage(count) {
      const total = this.taskStatistics.total_count || 0
      if (total === 0) return 0
      return ((count / total) * 100).toFixed(1)
    },
    getProgressColor(percentage) {
      if (percentage >= 80) return '#67C23A'
      if (percentage >= 50) return '#E6A23C'
      return '#F56C6C'
    }
  }
}
</script>

<style scoped>
.task-statistics {
  margin-bottom: 20px;
}

.stat-cards {
  margin-bottom: 0;
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

.efficiency-content {
  padding: 10px 0;
}

.efficiency-item {
  margin-bottom: 15px;
}

.efficiency-item:last-child {
  margin-bottom: 0;
}

.efficiency-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.efficiency-value {
  font-weight: bold;
  color: #409EFF;
}

.efficiency-value.success {
  color: #67C23A;
}

.efficiency-value.error {
  color: #F56C6C;
}
</style>
