const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 生产环境优化配置
  productionSourceMap: false, // 关闭生产环境的 source map，减小打包体积
  // 代码分割配置
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          elementUI: {
            name: 'chunk-elementUI',
            test: /[\\/]node_modules[\\/]element-ui[\\/]/,
            priority: 20
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      }
    }
  },
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onError: (err, req) => {
          console.error('Proxy error:', err.message)
          console.error('Request URL:', req.url)
          if (err.code === 'ECONNREFUSED') {
            console.error('无法连接到后端服务器 http://127.0.0.1:8000')
            console.error('请确保后端服务器正在运行: cd backend && python manage.py runserver')
          }
        },
        onProxyReq: (proxyReq, req) => {
          // 只在开发环境打印日志
          if (process.env.NODE_ENV === 'development') {
            console.log('Proxying:', req.method, req.url)
          }
        }
      },
      '/admin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        timeout: 30000
      }
    }
  }
})

