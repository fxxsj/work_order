import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/app.css'
import './styles/layout.css'

import App from './App.vue'
import { router } from './router'
import { initAuthToken } from './lib/authToken'
import { registerNetworkStatusHandlers } from './lib/networkStatus'
import { useNotificationsStore } from './stores/notifications'
import { initPushNotifications } from './lib/pushNotifications'

async function bootstrap() {
  await initAuthToken()
  const pinia = createPinia()
  const app = createApp(App)
    .use(pinia)
    .use(router)
    .use(ElementPlus)
    .mount('#app')

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
