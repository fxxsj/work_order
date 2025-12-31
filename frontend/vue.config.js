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
        logLevel: 'debug',
        onError: (err, req, res) => {
          console.error('Proxy error:', err.message)
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log('Proxying request:', req.method, req.url)
        }
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

