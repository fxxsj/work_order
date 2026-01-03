import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import './assets/styles/global.css'

Vue.config.productionTip = false

// 使用 Element UI
Vue.use(ElementUI)

// 全局过滤器
Vue.filter('formatDate', function(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

Vue.filter('formatDateTime', function(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

