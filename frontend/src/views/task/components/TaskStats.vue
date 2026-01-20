<template>
  <el-row :gutter="20" class="task-stats">
    <el-col :span="6">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #409EFF;">
            <i class="el-icon-s-order"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ totalTasks }}
            </div>
            <div class="stat-label">
              总任务数
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #909399;">
            <i class="el-icon-time"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ pendingCount }}
            </div>
            <div class="stat-label">
              待开始
            </div>
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
            <div class="stat-value">
              {{ inProgressCount }}
            </div>
            <div class="stat-label">
              进行中
            </div>
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
            <div class="stat-value">
              {{ completedCount }}
            </div>
            <div class="stat-label">
              已完成
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
export default {
  name: 'TaskStats',
  props: {
    tasks: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    totalTasks() {
      return this.tasks.length
    },
    pendingCount() {
      return this.tasks.filter(task => task && task.status === 'pending').length
    },
    inProgressCount() {
      return this.tasks.filter(task => task && task.status === 'in_progress').length
    },
    completedCount() {
      return this.tasks.filter(task => task && task.status === 'completed').length
    }
  }
}
</script>

<style scoped>
.task-stats {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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
