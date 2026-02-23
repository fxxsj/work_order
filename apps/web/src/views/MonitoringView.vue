<template>
  <div class="page">
    <div class="bar">
      <div class="title">监控仪表板</div>
      <div style="display: flex; gap: 8px">
        <el-button size="small" :loading="loading" @click="fetchAll">刷新</el-button>
        <el-button size="small" @click="goBack">返回</el-button>
      </div>
    </div>

    <el-row :gutter="12">
      <el-col :span="24" :md="12">
        <el-card>
          <template #header>系统健康</template>
          <div v-if="overview?.health">
            <div>状态：{{ overview.health.status || '-' }}</div>
            <div class="muted">时间：{{ overview.health.timestamp || '-' }}</div>
          </div>
          <div v-else class="muted">-</div>
        </el-card>
      </el-col>
      <el-col :span="24" :md="12">
        <el-card>
          <template #header>资源使用</template>
          <div v-if="overview?.system?.system_resources">
            <div>CPU：{{ overview.system.system_resources.cpu_percent ?? '-' }}%</div>
            <div>内存：{{ overview.system.system_resources.memory_percent ?? '-' }}%</div>
          </div>
          <div v-else class="muted">-</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="24" :md="12">
        <el-card>
          <template #header>性能</template>
          <div v-if="overview?.performance">
            <div>请求数：{{ overview.performance.total_requests ?? '-' }}</div>
            <div>平均耗时：{{ formatMs(overview.performance.avg_response_time) }}</div>
            <div>错误数：{{ overview.performance.errors ?? '-' }}</div>
            <div>错误率：{{ formatPct(overview.performance.error_rate) }}</div>
          </div>
          <div v-else class="muted">-</div>
        </el-card>
      </el-col>
      <el-col :span="24" :md="12">
        <el-card>
          <template #header>当前告警</template>
          <div v-if="alerts.length === 0" class="muted">暂无</div>
          <div v-for="(a, idx) in alerts" :key="idx" style="margin-bottom: 6px">
            <el-tag :type="a.level === 'warning' ? 'warning' : 'info'">{{ a.type }}</el-tag>
            <span style="margin-left: 8px">{{ a.message }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 12px">
      <template #header>原始数据（调试）</template>
      <pre class="pre">{{ JSON.stringify(overview, null, 2) }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMonitoringAlerts, getMonitoringOverview } from '../api/monitoring'
import { formatError } from '../lib/formatError'

const router = useRouter()

const loading = ref(false)
const overview = ref<any>(null)
const alerts = ref<any[]>([])

function formatMs(v: any) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '-'
  return `${Math.round(n * 1000)}ms`
}

function formatPct(v: any) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '-'
  return `${n.toFixed(2)}%`
}

async function fetchAll() {
  loading.value = true
  try {
    const [ov, al] = await Promise.all([getMonitoringOverview(), getMonitoringAlerts()])
    overview.value = ov
    alerts.value = Array.isArray(al) ? al : []
  } catch (err: any) {
    ElMessage.error(formatError(err, '获取监控数据失败'))
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => void fetchAll())
</script>

<style scoped>
.page {
  padding: 16px;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.muted {
  color: #666;
}
.pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.4;
}
</style>

