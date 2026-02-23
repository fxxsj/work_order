<template>
  <div class="page">
    <div class="bar">
      <div class="title">扫码</div>
      <div style="display: flex; gap: 8px">
        <el-button size="small" :disabled="running" @click="start">开始</el-button>
        <el-button size="small" :disabled="!running" @click="stop">停止</el-button>
        <el-button size="small" @click="goBack">返回</el-button>
      </div>
    </div>

    <el-alert v-if="!supported" type="warning" show-icon :closable="false" title="当前环境不支持扫码（需要 BarcodeDetector + 摄像头权限）" />

    <div v-show="supported" class="video-wrap">
      <video ref="videoRef" class="video" autoplay playsinline muted />
    </div>

    <div style="margin-top: 12px">
      <el-input v-model="result" readonly placeholder="识别结果" />
      <div style="margin-top: 8px; display: flex; gap: 8px">
        <el-button size="small" :disabled="!result" @click="copy">复制</el-button>
        <el-button size="small" :disabled="!result" @click="clear">清空</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const videoRef = ref<HTMLVideoElement | null>(null)
const result = ref('')
const running = ref(false)

const supported = computed(() => {
  return typeof (window as any).BarcodeDetector !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
})

let stream: MediaStream | null = null
let rafId: number | null = null
let detector: any = null

function stopStream() {
  if (stream) {
    for (const track of stream.getTracks()) track.stop()
  }
  stream = null
  if (videoRef.value) {
    ;(videoRef.value as any).srcObject = null
  }
}

function stopLoop() {
  if (rafId) window.cancelAnimationFrame(rafId)
  rafId = null
}

async function start() {
  if (!supported.value) return
  if (running.value) return
  if (!videoRef.value) return

  running.value = true
  result.value = ''

  try {
    detector = new (window as any).BarcodeDetector({
      formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39', 'itf']
    })

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    })
    ;(videoRef.value as any).srcObject = stream

    const tick = async () => {
      if (!running.value || !videoRef.value) return
      try {
        const barcodes = await detector.detect(videoRef.value)
        const first = barcodes?.[0]
        const raw = first?.rawValue || first?.data
        if (raw) {
          result.value = String(raw)
          ElMessage.success('识别成功')
          stop()
          return
        }
      } catch {
        // ignore
      }
      rafId = window.requestAnimationFrame(() => void tick())
    }

    rafId = window.requestAnimationFrame(() => void tick())
  } catch (err: any) {
    running.value = false
    stopLoop()
    stopStream()
    ElMessage.error(err?.message || '启动扫码失败')
  }
}

function stop() {
  running.value = false
  stopLoop()
  stopStream()
}

async function copy() {
  if (!result.value) return
  try {
    await navigator.clipboard.writeText(result.value)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

function clear() {
  result.value = ''
}

function goBack() {
  router.back()
}

onUnmounted(() => stop())
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
.video-wrap {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}
.video {
  width: 100%;
  max-height: 60vh;
  background: #000;
}
</style>

