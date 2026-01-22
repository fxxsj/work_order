<template>
  <el-row :gutter="20" class="quality-stats">
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #409EFF;">
            <i class="el-icon-document-checked"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.total_count || 0 }}
            </div>
            <div class="stat-label">
              检验总数
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #E6A23C;">
            <i class="el-icon-time"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.pending_count || 0 }}
            </div>
            <div class="stat-label">
              待检验
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
              {{ stats.passed_count || 0 }}
            </div>
            <div class="stat-label">
              合格
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': loading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #F56C6C;">
            <i class="el-icon-circle-close"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.failed_count || 0 }}
            </div>
            <div class="stat-label">
              不合格
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
export default {
  name: 'QualityStats',
  props: {
    stats: {
      type: Object,
      default: () => ({
        total_count: 0,
        pending_count: 0,
        passed_count: 0,
        failed_count: 0
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
.quality-stats {
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
