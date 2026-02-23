<template>
  <el-dialog
    v-model="visible"
    title="服务器设置"
    width="520px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="120px">
      <el-form-item label="API Base URL">
        <el-input v-model="form.apiBaseUrl" placeholder="例如：http://127.0.0.1:8000/api 或 /api" />
        <div class="hint">建议包含 <code>/api</code>。未包含时会自动补全。</div>
      </el-form-item>
      <el-form-item label="WS Base URL">
        <el-input v-model="form.wsBaseUrl" placeholder="例如：ws://127.0.0.1:8001 或 wss://example.com" />
        <div class="hint">可留空。</div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClear">清除并刷新</el-button>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSave">保存并刷新</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { clearRuntimeConfig, getRuntimeConfig, normalizeApiBaseUrl, normalizeWsBaseUrl, setRuntimeConfig } from '../config'

const visible = defineModel<boolean>({ default: false })

const form = reactive({
  apiBaseUrl: '',
  wsBaseUrl: ''
})

watch(
  () => visible.value,
  (open) => {
    if (!open) return
    const current = getRuntimeConfig()
    form.apiBaseUrl = current.apiBaseUrl || ''
    form.wsBaseUrl = current.wsBaseUrl || ''
  }
)

function handleSave() {
  setRuntimeConfig({
    apiBaseUrl: normalizeApiBaseUrl(form.apiBaseUrl),
    wsBaseUrl: normalizeWsBaseUrl(form.wsBaseUrl)
  })
  window.location.reload()
}

function handleClear() {
  clearRuntimeConfig()
  window.location.reload()
}
</script>

<style scoped>
.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}
</style>
