<template>
  <div class="component-error">
    <el-icon class="error-icon">
      <i class="el-icon-warning-outline"></i>
    </el-icon>
    <p class="error-text">{{ text }}</p>
    <el-button v-if="showRetry" type="primary" size="small" @click="handleRetry">
      重试
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'ComponentError',
  props: {
    text: {
      type: String,
      default: '组件加载失败'
    },
    showRetry: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    handleRetry() {
      this.$emit('retry')
      // 重新加载页面
      location.reload()
    }
  }
}
</script>

<style scoped>
.component-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 20px;
}

.error-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 16px;
}

.error-text {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #606266;
}
</style>
