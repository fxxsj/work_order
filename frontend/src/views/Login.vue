<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>印刷施工单跟踪系统</h2>
        <p>欢迎登录</p>
      </div>

      <!-- 显示未登录提示信息（如果从其他页面跳转过来） -->
      <el-alert
        v-if="showLoginPrompt"
        title="请先登录"
        type="info"
        :description="loginPromptMessage"
        show-icon
        :closable="true"
        class="login-alert"
        @close="showLoginPrompt = false"
      />

      <!-- 登录成功提示 -->
      <el-alert
        v-if="showSuccessAlert"
        title="登录成功"
        type="success"
        description="正在跳转..."
        show-icon
        :closable="false"
        class="login-alert"
      />

      <el-form
        ref="loginForm"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="el-icon-user"
            :disabled="loading"
            @keyup.enter.native="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="el-icon-lock"
            show-password
            :disabled="loading"
            @keyup.enter.native="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            :disabled="loading"
            style="width: 100%;"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <div class="tips">
          <p>提示：首次使用请在后台创建管理员账号</p>
          <p>命令：python manage.py createsuperuser</p>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { authAPI } from '@/api/modules'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, message: '密码长度至少3位', trigger: 'blur' }
        ]
      },
      loading: false,
      showLoginPrompt: false,
      showSuccessAlert: false,
      loginPromptMessage: '请登录后继续访问系统'
    }
  },
  async mounted() {
    // 页面加载时获取 CSRF token
    try {
      await authAPI.getCurrentUser()
    } catch (error) {
      // 忽略错误，只是为了获取 CSRF cookie
    }

    // 检查是否有重定向参数，如果有则显示登录提示
    const redirect = this.$route.query.redirect
    if (redirect) {
      this.showLoginPrompt = true
      // 根据重定向路径生成更友好的提示信息
      if (redirect.includes('/workorders')) {
        this.loginPromptMessage = '您正在访问施工单页面，请先登录'
      } else if (redirect.includes('/tasks')) {
        this.loginPromptMessage = '您正在访问任务页面，请先登录'
      } else if (redirect.includes('/dashboard')) {
        this.loginPromptMessage = '欢迎回来，请登录以继续工作'
      } else {
        this.loginPromptMessage = '请登录后继续访问系统'
      }
    }
  },
  methods: {
    async handleLogin() {
      // 表单验证
      const valid = await this.$refs.loginForm.validate().catch(() => false)
      if (!valid) {
        return false
      }

      this.loading = true
      this.showSuccessAlert = false

      try {
        // 调用登录 API
        const user = await authAPI.login(this.loginForm)

        if (user && user.id) {
          // 登录成功
          this.$store.dispatch('user/initUser', user)

          // 显示成功提示
          this.showSuccessAlert = true

          // 延迟跳转，让用户看到成功提示
          setTimeout(() => {
            const redirect = this.$route.query.redirect || '/'
            this.$router.push(redirect)
          }, 800)
        } else if (user && user.error) {
          // 后端返回了错误信息
          this.handleLoginError(user.error)
        } else {
          // 未知错误
          this.handleLoginError('登录失败，请重试')
        }
      } catch (error) {
        console.error('登录失败:', error)

        // 根据错误类型提供更友好的提示
        let errorMessage = '登录失败'
        if (error.response) {
          const status = error.response.status
          if (status === 401) {
            errorMessage = '用户名或密码错误'
          } else if (status === 500) {
            errorMessage = '服务器错误，请稍后重试'
          } else if (status === 403) {
            errorMessage = '账号已被禁用，请联系管理员'
          } else {
            errorMessage = error.response.data?.detail || error.response.data?.error || '登录失败'
          }
        } else if (error.message) {
          errorMessage = error.message
        }

        this.handleLoginError(errorMessage)
      } finally {
        this.loading = false
      }
    },

    handleLoginError(message) {
      // 使用错误提示
      this.$message({
        message: message,
        type: 'error',
        duration: 3000,
        showClose: true
      })

      // 清空密码输入框
      this.loginForm.password = ''

      // 聚焦到密码输入框
      this.$nextTick(() => {
        const passwordInput = this.$refs.loginForm.fields.find(
          field => field.prop === 'password'
        )
        if (passwordInput) {
          passwordInput.focus()
        }
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #303133;
}

.login-header p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.login-alert {
  margin-bottom: 20px;
}

.login-form {
  margin-top: 30px;
}

.tips {
  margin-top: 20px;
  padding: 15px;
  background-color: #f4f4f5;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
}

.tips p {
  margin: 5px 0;
}
</style>

