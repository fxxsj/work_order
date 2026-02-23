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
        <el-button @click="goTaskAssignmentHistory">任务分派历史</el-button>
        <el-button @click="goOperatorCenter">操作员中心</el-button>
        <el-button @click="goNotifications">通知</el-button>
        <el-button @click="goDownload">客户端下载</el-button>
        <el-button @click="goScan">扫码</el-button>
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
        <el-button @click="goInvoices">发票</el-button>
        <el-button @click="goPayments">收款</el-button>
        <el-button @click="goCostCenters">成本中心</el-button>
        <el-button @click="goCostItems">成本项目</el-button>
        <el-button @click="goProductionCosts">生产成本</el-button>
        <el-button @click="goStatements">对账单</el-button>
        <el-button @click="goArtworks">图稿</el-button>
        <el-button @click="goDies">刀模</el-button>
        <el-button @click="goFoilingPlates">烫金版</el-button>
        <el-button @click="goEmbossingPlates">压凸版</el-button>
        <el-button @click="goProductGroups">产品组</el-button>
        <el-button @click="goDeliveryOrders">发货单</el-button>
        <el-button @click="goQualityInspections">质量检验</el-button>
        <el-button @click="goStockIns">入库单</el-button>
        <el-button @click="goStockOuts">出库单</el-button>
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

function goTaskAssignmentHistory() {
  router.push({ name: 'task-assignment-history' })
}

function goOperatorCenter() {
  router.push({ name: 'operator-center' })
}

function goNotifications() {
  router.push({ name: 'notifications' })
}

function goDownload() {
  router.push({ name: 'client-download' })
}

function goScan() {
  router.push({ name: 'scan' })
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

function goInvoices() {
  router.push({ name: 'invoices' })
}

function goPayments() {
  router.push({ name: 'payments' })
}

function goCostCenters() {
  router.push({ name: 'cost-centers' })
}

function goCostItems() {
  router.push({ name: 'cost-items' })
}

function goProductionCosts() {
  router.push({ name: 'production-costs' })
}

function goStatements() {
  router.push({ name: 'statements' })
}

function goArtworks() {
  router.push({ name: 'artworks' })
}

function goDies() {
  router.push({ name: 'dies' })
}

function goFoilingPlates() {
  router.push({ name: 'foiling-plates' })
}

function goEmbossingPlates() {
  router.push({ name: 'embossing-plates' })
}

function goProductGroups() {
  router.push({ name: 'product-groups' })
}

function goDeliveryOrders() {
  router.push({ name: 'delivery-orders' })
}

function goQualityInspections() {
  router.push({ name: 'quality-inspections' })
}

function goStockIns() {
  router.push({ name: 'stock-ins' })
}

function goStockOuts() {
  router.push({ name: 'stock-outs' })
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
