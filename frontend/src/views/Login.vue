<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>印刷施工单跟踪系统</h2>
        <p>欢迎登录</p>
      </div>

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
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="el-icon-lock"
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            style="width: 100%;"
            @click="handleLogin"
          >
            登录
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
import { login, getCurrentUser } from '@/api/auth'

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
      loading: false
    }
  },
  async mounted() {
    // 页面加载时获取 CSRF token
    try {
      await getCurrentUser()
    } catch (error) {
      // 忽略错误，只是为了获取 CSRF cookie
    }
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (!valid) {
          return false
        }

        this.loading = true
        try {
          console.log('[Login] 开始登录，用户名:', this.loginForm.username)
          const user = await login(this.loginForm)
          console.log('[Login] 后端返回的用户数据:', user)

          if (user.id) {
            console.log('[Login] 登录成功，准备调用 initUser action')
            // 登录成功，保存用户信息到 Vuex（使用新的模块化 API）
            // 后端直接返回用户对象，包含 groups（字符串数组）和 permissions（字符串数组）
            this.$store.dispatch('user/initUser', user)
            console.log('[Login] initUser action 已调用完成')

            // 验证 store 中的数据
            setTimeout(() => {
              const currentUser = this.$store.getters['user/currentUser']
              console.log('[Login] 验证 - store 中的 currentUser:', currentUser)
            }, 100)

            this.$message.success('登录成功')

            // 跳转到首页或之前的页面
            const redirect = this.$route.query.redirect || '/'
            console.log('[Login] 准备跳转到:', redirect)
            this.$router.push(redirect)
          } else if (user.error) {
            // 登录失败，后端返回了错误信息
            console.log('[Login] 登录失败:', user.error)
            this.$message.error(user.error || '登录失败')
          } else {
            // 未知错误
            console.log('[Login] 未知错误，user 数据:', user)
            this.$message.error('登录失败，请重试')
          }
        } catch (error) {
          console.error('[Login] 登录异常:', error)
          this.$message.error(error.message || '登录失败')
        } finally {
          this.loading = false
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

