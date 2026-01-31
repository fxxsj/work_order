<template>
  <div class="batch-action-bar">
    <div class="batch-info">
      <i class="el-icon-check"></i>
      <span>已选择 <strong>{{ selectedCount }}</strong> 项</span>
    </div>
    <div class="batch-actions">
      <!-- 批量分派 -->
      <el-button
        v-if="canBatchAssign"
        type="primary"
        size="small"
        :loading="loading"
        :disabled="loading"
        @click="$emit('batch-assign')"
      >
        <i class="el-icon-user"></i> 批量分派
      </el-button>

      <!-- 批量完成 -->
      <el-button
        v-if="canBatchComplete"
        type="success"
        size="small"
        :loading="loading"
        :disabled="loading"
        @click="$emit('batch-complete')"
      >
        <i class="el-icon-circle-check"></i> 批量完成
      </el-button>

      <!-- 批量删除 (仅草稿任务) -->
      <el-button
        v-if="canBatchDelete"
        type="danger"
        size="small"
        :loading="loading"
        :disabled="loading"
        @click="handleBatchDelete"
      >
        <i class="el-icon-delete"></i> 批量删除
      </el-button>

      <!-- 批量取消 -->
      <el-button
        v-if="canBatchCancel"
        type="warning"
        size="small"
        :loading="loading"
        :disabled="loading"
        @click="$emit('batch-cancel')"
      >
        <i class="el-icon-circle-close"></i> 批量取消
      </el-button>

      <!-- 清空选择 -->
      <el-button
        size="small"
        :loading="loading"
        :disabled="loading"
        @click="$emit('clear-selection')"
      >
        取消选择
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BatchActionBar',

  props: {
    selectedCount: {
      type: Number,
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    },
    // 权限控制
    canBatchAssign: {
      type: Boolean,
      default: true
    },
    canBatchComplete: {
      type: Boolean,
      default: true
    },
    canBatchDelete: {
      type: Boolean,
      default: false  // 默认关闭，仅当选中全部为草稿任务时启用
    },
    canBatchCancel: {
      type: Boolean,
      default: true
    }
  },

  methods: {
    handleBatchDelete() {
      this.$confirm('确定要删除选中的任务吗？删除后无法恢复。', '批量删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$emit('batch-delete')
      }).catch(() => {
        // 用户取消
      })
    }
  }
}
</script>

<style scoped>
.batch-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #fff;
  border-top: 1px solid #ebeef5;
  box-shadow: 0 -2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.batch-info .el-icon-check {
  margin-right: 8px;
  color: #409eff;
  font-size: 18px;
}

.batch-info strong {
  color: #409eff;
  margin: 0 4px;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.batch-actions .el-button {
  display: flex;
  align-items: center;
}

.batch-actions .el-button i {
  margin-right: 4px;
}
</style>
