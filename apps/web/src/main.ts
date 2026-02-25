import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/app.css'
import './styles/layout.css'

import App from './App.vue'
import { router } from './router'
import { initAuthToken } from './lib/authToken'
import { registerNetworkStatusHandlers } from './lib/networkStatus'
import { useNotificationsStore } from './stores/notifications'
import { initPushNotifications } from './lib/pushNotifications'

function setupGlobalErrorHandlers() {
  let lastToastAt = 0

  const toastOnce = (message: string) => {
    const now = Date.now()
    if (now - lastToastAt < 5000) return
    lastToastAt = now
    ElMessage.error(message)
  }

  window.addEventListener('unhandledrejection', (event) => {
    try {
      // eslint-disable-next-line no-console
      console.error('[unhandledrejection]', event.reason)
    } catch {
      // ignore
    }
    toastOnce('操作失败，请重试')
  })

  window.addEventListener('error', (event) => {
    try {
      // eslint-disable-next-line no-console
      console.error('[window:error]', event.error || event.message)
    } catch {
      // ignore
    }
    toastOnce('页面发生错误，请刷新重试')
  })

  return (err: unknown, info?: string) => {
    try {
      // eslint-disable-next-line no-console
      console.error('[vue:error]', info || '', err)
    } catch {
      // ignore
    }
    toastOnce('页面发生错误，请刷新重试')
  }
}

async function bootstrap() {
  await initAuthToken()
  const pinia = createPinia()
  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.use(ElementPlus)

  const vueErrorHandler = setupGlobalErrorHandlers()
  app.config.errorHandler = (err, _instance, info) => vueErrorHandler(err, info)

  app.mount('#app')

  // Best-effort: if Capacitor PushNotifications plugin exists, initialize it.
  void initPushNotifications()

  registerNetworkStatusHandlers({
    onOnline: () => {
      try {
        void useNotificationsStore(pinia).connectIfNeeded()
      } catch {
        // ignore
      }
    }
  })
}

void bootstrap()
