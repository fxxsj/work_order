<template>
  <div class="page">
    <div class="card">
      <h2>印刷施工单跟踪系统</h2>
      <p class="sub">欢迎登录</p>

      <el-alert
        v-if="redirect"
        title="请先登录"
        type="info"
        :closable="true"
        class="alert"
      />

      <el-form :model="form" @submit.prevent>
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" autocomplete="username" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" autocomplete="current-password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer">
        <el-link type="primary" :underline="false" @click="showConfig = true">服务器设置</el-link>
      </div>
    </div>

    <server-config-dialog v-model="showConfig" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import ServerConfigDialog from './ServerConfigDialog.vue'

const route = useRoute()
const router = useRouter()
const user = useUserStore()

const redirect = computed(() => (route.query.redirect ? String(route.query.redirect) : ''))

const form = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const showConfig = ref(false)

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.error('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    await user.login(form.username, form.password)
    await router.push(redirect.value || '/')
  } catch (err: any) {
    ElMessage.error(err?.message || '登录失败')
    form.password = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
}
.card {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 28px 28px 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
.sub {
  margin-top: 6px;
  color: #666;
}
.alert {
  margin: 16px 0;
}
.footer {
  margin-top: 8px;
  text-align: center;
}
</style>

