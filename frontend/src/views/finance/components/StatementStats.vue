<template>
  <el-row :gutter="20" class="statement-stats">
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #409EFF;">
            <i class="el-icon-document"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.total_count || 0 }}
            </div>
            <div class="stat-label">
              对账单总数
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #E6A23C;">
            <i class="el-icon-edit-outline"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.draft_count || 0 }}
            </div>
            <div class="stat-label">
              待确认
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #67C23A;">
            <i class="el-icon-circle-check"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.confirmed_count || 0 }}
            </div>
            <div class="stat-label">
              已确认
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #909399;">
            <i class="el-icon-money"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              ¥{{ formatAmount(stats.total_balance) }}
            </div>
            <div class="stat-label">
              期末余额合计
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
export default {
  name: 'StatementStats',
  props: {
    stats: {
      type: Object,
      default: () => ({
        total_count: 0,
        draft_count: 0,
        confirmed_count: 0,
        total_balance: 0
      })
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    formatAmount(value) {
      if (value === null || value === undefined) return '0'
      return Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }
}
</script>

<style scoped>
.statement-stats {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s;
}

.stat-card.is-loading {
  opacity: 0.6;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  margin-right: 15px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>
