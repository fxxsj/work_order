<template>
  <el-row :gutter="20">
    <el-col :span="6">
      <el-card class="stats-card" shadow="hover">
        <div class="stats-content">
          <div class="stats-icon primary">
            <i class="el-icon-document" />
          </div>
          <div class="stats-info">
            <div class="stats-value">
              {{ stats.total_count || 0 }}
            </div>
            <div class="stats-label">
              发票总数
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stats-card" shadow="hover">
        <div class="stats-content">
          <div class="stats-icon warning">
            <i class="el-icon-edit-outline" />
          </div>
          <div class="stats-info">
            <div class="stats-value">
              {{ stats.draft_count || 0 }}
            </div>
            <div class="stats-label">
              待开具
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stats-card" shadow="hover">
        <div class="stats-content">
          <div class="stats-icon success">
            <i class="el-icon-check" />
          </div>
          <div class="stats-info">
            <div class="stats-value">
              ¥{{ formatCurrency(stats.received_amount || 0) }}
            </div>
            <div class="stats-label">
              已收款
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stats-card" shadow="hover">
        <div class="stats-content">
          <div class="stats-icon info">
            <i class="el-icon-coin" />
          </div>
          <div class="stats-info">
            <div class="stats-value">
              ¥{{ formatCurrency(stats.pending_amount || 0) }}
            </div>
            <div class="stats-label">
              待收款
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
export default {
  name: 'InvoiceStats',
  props: {
    stats: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    formatCurrency(amount) {
      if (amount === 0) return '0'
      return amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }
}
</script>

<style scoped>
.stats-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stats-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stats-icon.primary {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
}

.stats-icon.warning {
  background: linear-gradient(135deg, #E6A23C, #ebb563);
}

.stats-icon.success {
  background: linear-gradient(135deg, #67C23A, #85ce61);
}

.stats-icon.info {
  background: linear-gradient(135deg, #909399, #a6a9ad);
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}
</style>