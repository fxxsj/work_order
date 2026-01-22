<template>
  <el-row :gutter="20" class="cost-stats">
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #409EFF;">
            <i class="el-icon-s-order"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.total_orders || 0 }}
            </div>
            <div class="stat-label">
              订单数量
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #67C23A;">
            <i class="el-icon-goods"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              ¥{{ formatAmount(stats.avg_material_cost) }}
            </div>
            <div class="stat-label">
              平均材料成本
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #E6A23C;">
            <i class="el-icon-user"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              ¥{{ formatAmount(stats.avg_labor_cost) }}
            </div>
            <div class="stat-label">
              平均人工成本
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #909399;">
            <i class="el-icon-coin"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              ¥{{ formatAmount(stats.avg_total_cost) }}
            </div>
            <div class="stat-label">
              平均总成本
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
export default {
  name: 'CostStats',
  props: {
    stats: {
      type: Object,
      default: () => ({
        total_orders: 0,
        avg_material_cost: 0,
        avg_labor_cost: 0,
        avg_total_cost: 0
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
.cost-stats {
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
