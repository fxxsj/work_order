<template>
  <el-row :gutter="20" class="delivery-stats">
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #409EFF;">
            <i class="el-icon-s-order"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.total || 0 }}
            </div>
            <div class="stat-label">
              总发货单
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #909399;">
            <i class="el-icon-time"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.pending || 0 }}
            </div>
            <div class="stat-label">
              待发货
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #E6A23C;">
            <i class="el-icon-truck"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.in_transit || 0 }}
            </div>
            <div class="stat-label">
              运输中
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
              {{ stats.received || 0 }}
            </div>
            <div class="stat-label">
              已签收
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
export default {
  name: 'DeliveryStats',
  props: {
    stats: {
      type: Object,
      default: () => ({
        total: 0,
        pending: 0,
        in_transit: 0,
        received: 0
      })
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.delivery-stats {
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
  font-size: 28px;
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
