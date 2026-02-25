<template>
  <div v-if="hasError" class="wo-error">
    <div class="wo-error__title">页面发生错误</div>
    <div class="wo-error__desc">你可以尝试刷新页面或返回工作台。</div>
    <div class="wo-error__actions">
      <el-button size="small" @click="reset">重试</el-button>
      <el-button size="small" type="primary" @click="reload">刷新</el-button>
    </div>
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)

function reset() {
  hasError.value = false
}

function reload() {
  window.location.reload()
}

onErrorCaptured(() => {
  hasError.value = true
  return false
})
</script>

<style scoped>
.wo-error {
  padding: 16px;
  border: 1px solid #ebeef5;
  background: #fff;
  border-radius: 8px;
}
.wo-error__title {
  font-weight: 700;
  margin-bottom: 6px;
}
.wo-error__desc {
  color: #606266;
  font-size: 13px;
  margin-bottom: 12px;
}
.wo-error__actions {
  display: flex;
  gap: 8px;
}
</style>

