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
        <el-button @click="goDepartments">部门</el-button>
        <el-button @click="goProcesses">工序</el-button>
        <el-button @click="goMaterials">物料</el-button>
        <el-button @click="goSuppliers">供应商</el-button>
        <el-button @click="goMaterialSuppliers">物料-供应商</el-button>
        <el-button @click="goPurchaseOrders">采购单</el-button>
        <el-button @click="goPurchaseReceive">收货质检/入库</el-button>
        <el-button @click="goProductStocks">成品库存</el-button>
        <el-button @click="goSalesOrders">销售订单</el-button>
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

function goDepartments() {
  router.push({ name: 'departments' })
}

function goProcesses() {
  router.push({ name: 'processes' })
}

function goMaterials() {
  router.push({ name: 'materials' })
}

function goSuppliers() {
  router.push({ name: 'suppliers' })
}

function goMaterialSuppliers() {
  router.push({ name: 'material-suppliers' })
}

function goPurchaseOrders() {
  router.push({ name: 'purchase-orders' })
}

function goPurchaseReceive() {
  router.push({ name: 'purchase-receive' })
}

function goProductStocks() {
  router.push({ name: 'product-stocks' })
}

function goSalesOrders() {
  router.push({ name: 'sales-orders' })
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
