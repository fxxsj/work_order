<template>
  <el-dialog
    title="服务器设置"
    :visible.sync="visible"
    width="520px"
    :close-on-click-modal="false"
  >
    <el-form ref="form" :model="form" label-width="120px">
      <el-form-item
        label="API Base URL"
        prop="apiBaseUrl"
        :rules="[{ required: true, message: '请输入 API Base URL', trigger: 'blur' }]"
      >
        <el-input
          v-model="form.apiBaseUrl"
          placeholder="例如：http://127.0.0.1:8000/api 或 /api"
          autocomplete="off"
        />
        <div class="hint">建议包含 <code>/api</code>。未包含时会自动补全。</div>
      </el-form-item>

      <el-form-item label="WS Base URL" prop="wsBaseUrl">
        <el-input
          v-model="form.wsBaseUrl"
          placeholder="例如：ws://127.0.0.1:8001 或 wss://example.com"
          autocomplete="off"
        />
        <div class="hint">可留空（将使用默认值/环境变量）。</div>
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button :disabled="saving" @click="handleClear">清除并刷新</el-button>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存并刷新</el-button>
    </span>
  </el-dialog>
</template>

<script>
import {
  clearRuntimeConfig,
  getRuntimeConfig,
  normalizeApiBaseUrl,
  normalizeWsBaseUrl,
  setRuntimeConfig
} from '@/config/runtimeConfig'

export default {
  name: 'ServerConfigDialog',
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const current = getRuntimeConfig()
    return {
      saving: false,
      visible: this.value,
      form: {
        apiBaseUrl: current.apiBaseUrl || '',
        wsBaseUrl: current.wsBaseUrl || ''
      }
    }
  },
  watch: {
    value(val) {
      this.visible = val
      if (val) {
        const current = getRuntimeConfig()
        this.form.apiBaseUrl = current.apiBaseUrl || ''
        this.form.wsBaseUrl = current.wsBaseUrl || ''
      }
    },
    visible(val) {
      this.$emit('input', val)
    }
  },
  methods: {
    async handleSave() {
      const valid = await this.$refs.form.validate().catch(() => false)
      if (!valid) return

      this.saving = true
      try {
        const apiBaseUrl = normalizeApiBaseUrl(this.form.apiBaseUrl)
        const wsBaseUrl = normalizeWsBaseUrl(this.form.wsBaseUrl)

        setRuntimeConfig({
          apiBaseUrl,
          wsBaseUrl
        })

        window.location.reload()
      } finally {
        this.saving = false
      }
    },
    handleClear() {
      clearRuntimeConfig()
      window.location.reload()
    }
  }
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
