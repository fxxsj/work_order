import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import { router } from './router'
import { initAuthToken } from './lib/authToken'
import { registerNetworkStatusHandlers } from './lib/networkStatus'
import { useNotificationsStore } from './stores/notifications'

async function bootstrap() {
  await initAuthToken()
  const pinia = createPinia()
  const app = createApp(App)
    .use(pinia)
    .use(router)
    .use(ElementPlus)
    .mount('#app')

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
