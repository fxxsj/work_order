<template>
  <div class="page">
    <div class="bar">
      <div class="title">工作台（vNext）</div>
      <el-button size="small" @click="logout">退出登录</el-button>
    </div>

    <el-card>
      <p>这里将逐步迁移现有模块（施工单、任务、通知等）。</p>
      <p v-if="user.currentUser" class="muted">当前用户：{{ user.currentUser.username }}（ID: {{ user.currentUser.id }}）</p>
      <div class="actions">
        <el-button type="primary" @click="goWorkOrders">施工单</el-button>
        <el-button @click="goTasks">任务</el-button>
        <el-button @click="goOperatorCenter">操作员中心</el-button>
        <el-button @click="goNotifications">通知</el-button>
        <el-button @click="goCustomers">客户</el-button>
        <el-button @click="goProducts">产品</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const user = useUserStore()

onMounted(() => {
  user.fetchCurrentUser().catch(() => {
    // ignore; 401 will be handled globally
  })
})

function logout() {
  user.logout()
  router.push({ name: 'login' })
}

function goWorkOrders() {
  router.push({ name: 'workorders' })
}

function goTasks() {
  router.push({ name: 'tasks' })
}

function goOperatorCenter() {
  router.push({ name: 'operator-center' })
}

function goNotifications() {
  router.push({ name: 'notifications' })
}

function goCustomers() {
  router.push({ name: 'customers' })
}

function goProducts() {
  router.push({ name: 'products' })
}
</script>

<style scoped>
.page {
  padding: 16px;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.muted {
  margin-top: 8px;
  color: #666;
}
.actions {
  margin-top: 12px;
}
</style>
