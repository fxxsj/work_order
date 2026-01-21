<template>
  <el-row :gutter="20" class="task-stats">
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': statsLoading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #409EFF;">
            <i class="el-icon-s-order"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.total }}
            </div>
            <div class="stat-label">
              总任务数
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': statsLoading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #909399;">
            <i class="el-icon-time"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.pending }}
            </div>
            <div class="stat-label">
              待开始
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': statsLoading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #E6A23C;">
            <i class="el-icon-loading"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.in_progress }}
            </div>
            <div class="stat-label">
              进行中
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card class="stat-card" :class="{ 'is-loading': statsLoading }">
        <div class="stat-content">
          <div class="stat-icon" style="background-color: #67C23A;">
            <i class="el-icon-circle-check"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ stats.completed }}
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
import { workOrderTaskAPI } from '@/api/modules'

export default {
  name: 'TaskStats',
  props: {
    // 本地任务数据（降级方案使用）
    tasks: {
      type: Array,
      default: () => []
    },
    // 是否使用服务端统计（后端接口准备好后可改为 true）
    useServerStats: {
      type: Boolean,
      default: false
    },
    // 筛选参数（用于服务端统计）
    filterParams: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      statsLoading: false,
      serverStats: null
    }
  },
  computed: {
    stats() {
      // 优先使用服务端统计
      if (this.serverStats) {
        return this.serverStats
      }
      // 降级：基于本地数据计算
      return this.localStats
    },
    localStats() {
      return {
        total: this.tasks.length,
        pending: this.tasks.filter(task => task && task.status === 'pending').length,
        in_progress: this.tasks.filter(task => task && task.status === 'in_progress').length,
        completed: this.tasks.filter(task => task && task.status === 'completed').length
      }
    }
  },
  watch: {
    filterParams: {
      handler() {
        if (this.useServerStats) {
          this.loadStats()
        }
      },
      deep: true
    },
    tasks: {
      handler() {
        // 如果没有服务端统计，使用本地数据更新
        if (!this.serverStats) {
          // 触发计算属性重新计算
        }
      },
      deep: true
    }
  },
  mounted() {
    if (this.useServerStats) {
      this.loadStats()
    }
  },
  methods: {
    /**
     * 从服务端加载统计数据
     */
    async loadStats() {
      this.statsLoading = true
      try {
        const response = await workOrderTaskAPI.getStats(this.filterParams)
        this.serverStats = response.data || response
      } catch (error) {
        // 服务端接口失败时，降级使用本地计算
        console.warn('加载服务端统计失败，使用本地计算:', error.message)
        this.serverStats = null
      } finally {
        this.statsLoading = false
      }
    },

    /**
     * 刷新统计数据
     */
    refresh() {
      if (this.useServerStats) {
        this.loadStats()
      }
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
