const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onError: (err, req, res) => {
          console.error('Proxy error:', err.message)
          console.error('Request URL:', req.url)
          if (err.code === 'ECONNREFUSED') {
            console.error('无法连接到后端服务器 http://localhost:8000')
            console.error('请确保后端服务器正在运行: cd backend && python manage.py runserver')
          }
        },
        onProxyReq: (proxyReq, req, res) => {
          // 只在开发环境打印日志
          if (process.env.NODE_ENV === 'development') {
            console.log('Proxying:', req.method, req.url)
          }
        }
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 30000
      }
    }
  }
})

