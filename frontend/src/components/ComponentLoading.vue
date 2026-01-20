<template>
  <div class="component-loading">
    <el-icon class="is-loading">
      <i class="el-icon-loading"></i>
    </el-icon>
    <p class="loading-text">
      {{ text }}
    </p>
  </div>
</template>

<script>
export default {
  name: 'ComponentLoading',
  props: {
    text: {
      type: String,
      default: '加载中...'
    }
  }
}
</script>

<style scoped>
.component-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 20px;
}

.component-loading .el-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 16px;
}

.loading-text {
  margin: 0;
  font-size: 14px;
  color: #909399;
}
</style>
