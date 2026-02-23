import { ElMessage } from 'element-plus'

export function registerNetworkStatusHandlers(handlers?: { onOnline?: () => void; onOffline?: () => void }) {
  const onOnline = () => {
    ElMessage.success('网络已恢复')
    handlers?.onOnline?.()
  }

  const onOffline = () => {
    ElMessage.warning('当前离线，部分功能不可用')
    handlers?.onOffline?.()
  }

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

