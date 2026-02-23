<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">施工单列表（vNext）</div>
      </div>
      <div class="right">
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索：单号/客户/产品"
          style="width: 260px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" :loading="exporting" @click="handleExport">导出</el-button>
        <el-button size="small" type="primary" @click="goCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%" @row-click="handleRowClick">
        <el-table-column prop="order_number" label="单号" min-width="140" />
        <el-table-column prop="customer_name" label="客户" min-width="140" />
        <el-table-column prop="product_name" label="产品" min-width="140" />
        <el-table-column label="数量" width="120">
          <template #default="{ row }">{{ row.quantity }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column prop="status_display" label="状态" width="110" />
        <el-table-column prop="priority_display" label="优先级" width="110" />
        <el-table-column prop="delivery_date" label="交期" width="120" />
        <el-table-column label="进度" width="160">
          <template #default="{ row }">
            <el-progress :percentage="row.progress_percentage || 0" :stroke-width="10" />
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          @update:current-page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { exportWorkOrders, listWorkOrders, type WorkOrderListItem } from '../api/workorders'
import { downloadBlob, getFilenameFromContentDisposition } from '../lib/download'

const router = useRouter()

const loading = ref(false)
const items = ref<WorkOrderListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const exporting = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const data = await listWorkOrders({
      page: page.value,
      page_size: pageSize.value,
      search: search.value || undefined
    })
    items.value = data.results
    total.value = data.count
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  fetchList()
}

function handlePageChange(next: number) {
  page.value = next
  fetchList()
}

function handlePageSizeChange(next: number) {
  pageSize.value = next
  page.value = 1
  fetchList()
}

function goHome() {
  router.push({ name: 'dashboard' })
}

function handleRowClick(row: WorkOrderListItem) {
  router.push({ name: 'workorder-detail', params: { id: row.id } })
}

function goCreate() {
  router.push({ name: 'workorder-create' })
}

async function handleExport() {
  exporting.value = true
  try {
    const res = await exportWorkOrders({
      search: search.value || undefined
    })
    const cd = (res.headers?.['content-disposition'] || res.headers?.['Content-Disposition']) as
      | string
      | undefined
    const filename = getFilenameFromContentDisposition(cd) || 'workorders.xlsx'
    downloadBlob(res.data as Blob, filename)
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchList()
})
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
  gap: 12px;
}
.left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
