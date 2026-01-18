/**
 * 移动端响应式工具类
 * 提供移动端适配的工具函数和组件
 */

// 设备检测
export const DeviceDetector = {
  // 检测是否为移动设备
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },

  // 检测是否为平板设备
  isTablet() {
    return /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent)
  },

  // 检测是否为桌面设备
  isDesktop() {
    return !this.isMobile() && !this.isTablet()
  },

  // 获取屏幕尺寸类型
  getScreenSize() {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  },

  // 检测是否支持触摸
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
}

// 响应式尺寸工具
export const ResponsiveUtils = {
  // 获取响应式断点
  breakpoints: {
    xs: 480,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1920
  },

  // 获取当前断点
  getCurrentBreakpoint() {
    const width = window.innerWidth
    for (const [name, size] of Object.entries(this.breakpoints).sort((a, b) => b[1] - a[1])) {
      if (width >= size) return name
    }
    return 'xs'
  },

  // 监听窗口大小变化
  onResize(callback) {
    let timeoutId
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        callback({
          width: window.innerWidth,
          height: window.innerHeight,
          breakpoint: this.getCurrentBreakpoint()
        })
      }, 150)
    }

    window.addEventListener('resize', handleResize)
    
    // 返回清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }
}

// 移动端优化混入
export const MobileMixin = {
  data() {
    return {
      isMobile: false,
      isTablet: false,
      screenSize: 'desktop',
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    }
  },

  mounted() {
    this.updateDeviceStatus()
    
    // 监听窗口大小变化
    this.resizeCleanup = ResponsiveUtils.onResize((data) => {
      this.windowWidth = data.width
      this.windowHeight = data.height
      this.screenSize = data.breakpoint
    })
  },

  beforeDestroy() {
    if (this.resizeCleanup) {
      this.resizeCleanup()
    }
  },

  methods: {
    updateDeviceStatus() {
      this.isMobile = DeviceDetector.isMobile()
      this.isTablet = DeviceDetector.isTablet()
      this.screenSize = ResponsiveUtils.getCurrentBreakpoint()
    },

    // 移动端返回处理
    handleMobileBack() {
      if (this.isMobile && window.history.length > 1) {
        window.history.back()
      } else {
        // 移动端主页处理
        this.$router.push('/')
      }
    },

    // 获取移动端优化的列数
    getMobileColumns(desktopCols = 24) {
      switch (this.screenSize) {
        case 'xs': return Math.floor(desktopCols / 4)
        case 'sm': return Math.floor(desktopCols / 2)
        case 'md': return Math.floor(desktopCols * 0.75)
        default: return desktopCols
      }
    },

    // 获取移动端优化的尺寸
    getMobileSize(desktopSize, mobileRatio = 0.8) {
      if (this.isMobile) {
        return {
          width: desktopSize * mobileRatio,
          height: desktopSize * mobileRatio
        }
      }
      return {
        width: desktopSize,
        height: desktopSize
      }
    }
  }
}

// 移动端手势工具
export const GestureUtils = {
  // 添加滑动监听
  addSwipeListener(element, handlers) {
    let startX, startY, endX, endY
    const threshold = 50 // 滑动阈值

    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }, { passive: true })

    element.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX
      endY = e.changedTouches[0].clientY

      const diffX = startX - endX
      const diffY = startY - endY

      // 判断滑动方向
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > threshold && handlers.onSwipeLeft) {
          handlers.onSwipeLeft(e)
        } else if (diffX < -threshold && handlers.onSwipeRight) {
          handlers.onSwipeRight(e)
        }
      } else {
        if (diffY > threshold && handlers.onSwipeUp) {
          handlers.onSwipeUp(e)
        } else if (diffY < -threshold && handlers.onSwipeDown) {
          handlers.onSwipeDown(e)
        }
      }
    }, { passive: true })
  },

  // 添加长按监听
  addLongPressListener(element, handler, delay = 500) {
    let timeoutId

    element.addEventListener('touchstart', (e) => {
      timeoutId = setTimeout(() => {
        handler(e)
      }, delay)
    }, { passive: true })

    element.addEventListener('touchend', () => {
      clearTimeout(timeoutId)
    }, { passive: true })

    element.addEventListener('touchmove', () => {
      clearTimeout(timeoutId)
    }, { passive: true })
  }
}

// 移动端性能优化
export const MobilePerformance = {
  // 虚拟滚动优化
  createVirtualList(items, itemHeight, containerHeight) {
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2
    const startIndex = 0
    const endIndex = Math.min(startIndex + visibleCount, items.length)

    return {
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight
    }
  },

  // 图片懒加载
  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]')
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          img.src = img.dataset.src
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      })
    })

    images.forEach(img => imageObserver.observe(img))
  },

  // 防抖函数
  debounce(func, wait, immediate) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        timeout = null
        if (!immediate) func(...args)
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func(...args)
    }
  },

  // 节流函数
  throttle(func, limit) {
    let inThrottle
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}

// 移动端存储工具
export const MobileStorage = {
  // 本地存储（持久化）
  setLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn('localStorage not available:', e)
    }
  },

  getLocal(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (e) {
      console.warn('localStorage not available:', e)
      return defaultValue
    }
  },

  // 会话存储（临时）
  setSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn('sessionStorage not available:', e)
    }
  },

  getSession(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (e) {
      console.warn('sessionStorage not available:', e)
      return defaultValue
    }
  }
}

// 移动端网络状态检测
export const NetworkUtils = {
  // 检测网络状态
  isOnline() {
    return navigator.onLine
  },

  // 监听网络状态变化
  onNetworkChange(callback) {
    const updateStatus = () => {
      callback({
        online: navigator.onLine,
        connectionType: this.getConnectionType()
      })
    }

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  },

  // 获取连接类型
  getConnectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    return connection ? connection.effectiveType : 'unknown'
  },

  // 检测是否为慢速网络
  isSlowConnection() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (!connection) return false
    
    const slowTypes = ['slow-2g', '2g', '3g']
    return slowTypes.includes(connection.effectiveType)
  }
}

// 移动端UI组件适配
export const MobileUI = {
  // 获取移动端优化的表格配置
  getMobileTableConfig() {
    return {
      size: 'mini',
      stripe: false,
      border: true,
      highlightCurrentRow: true,
      showHeader: true,
      emptyText: '暂无数据'
    }
  },

  // 获取移动端优化的分页配置
  getMobilePaginationConfig() {
    return {
      small: true,
      background: false,
      layout: 'prev, pager, next',
      pageSizes: [10, 20, 50],
      pageSize: 20
    }
  },

  // 获取移动端优化的对话框配置
  getMobileDialogConfig() {
    return {
      fullscreen: true,
      center: true,
      closeOnClickModal: false,
      closeOnPressEscape: true
    }
  },

  // 移动端 Toast 提示
  showToast(message, type = 'info', duration = 2000) {
    // 使用 Element UI 的 Message 组件
    const MessageConstructor = this.$message || window.ElementUI.Message
    MessageConstructor({
      message,
      type,
      duration,
      center: true,
      showClose: true
    })
  }
}

// PWA 支持
export const PWAUtils = {
  // 注册 Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('ServiceWorker registered:', registration)
        return registration
      } catch (error) {
        console.error('ServiceWorker registration failed:', error)
        return null
      }
    }
  },

  // 检查 PWA 安装状态
  checkInstallPrompt() {
    let deferredPrompt

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
    })

    return {
      promptInstall: () => {
        if (deferredPrompt) {
          deferredPrompt.prompt()
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('PWA installed')
            }
            deferredPrompt = null
          })
        }
      }
    }
  }
}

export default {
  DeviceDetector,
  ResponsiveUtils,
  MobileMixin,
  GestureUtils,
  MobilePerformance,
  MobileStorage,
  NetworkUtils,
  MobileUI,
  PWAUtils
}