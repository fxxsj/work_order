import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import './assets/styles/global.css'

// P2 优化: 虚拟滚动
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// P2 优化: 图片懒加载
import VueLazyload from 'vue-lazyload'

Vue.config.productionTip = false

// 使用 Element UI
Vue.use(ElementUI)

// P2 优化: 注册虚拟滚动插件
Vue.use(VueVirtualScroller)

// P2 优化: 配置图片懒加载
Vue.use(VueLazyload, {
  preLoad: 1.3, // 预加载高度比例
  error: 'https://via.placeholder.com/200x200?text=Error', // 错误图
  loading: 'https://via.placeholder.com/200x200?text=Loading', // 加载中图
  attempt: 1, // 尝试加载次数
  listenEvents: ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove'], // 监听的事件
  adapter: {
    loaded({ el }) {
      // 图片加载成功后的回调
      el.setAttribute('data-loaded', 'true')
    },
    loading(listender, el) {
      // 图片加载中
      el.setAttribute('data-loading', 'true')
    },
    error(listender, el) {
      // 图片加载失败
      el.setAttribute('data-error', 'true')
    }
  },
  filter: {
    // 图片过滤器
    progressive(listener) {
      // 可以在这里处理图片 URL
      return listener.src
    }
  }
})

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

