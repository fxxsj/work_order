import { ElMessage } from 'element-plus'

export function notifyInfo(title: string, options?: { body?: string }) {
  const body = options?.body

  try {
    const canNative =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState === 'hidden'

    if (canNative) {
      new Notification(title, body ? { body } : undefined)
      return
    }
  } catch {
    // ignore
  }

  ElMessage.info(title)
}

