<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">出库单（vNext）</div>
      </div>
      <div class="right">
        <el-select v-model="outType" size="small" clearable placeholder="类型" style="width: 140px" @change="reload">
          <el-option label="发货出库" value="delivery" />
          <el-option label="生产领料" value="production" />
          <el-option label="调整" value="adjustment" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-select v-model="status" size="small" clearable placeholder="状态" style="width: 140px" @change="reload">
          <el-option label="草稿" value="draft" />
          <el-option label="已提交" value="submitted" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-button size="small" :loading="loading" @click="reload">刷新</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="order_number" label="出库单号" width="170" />
        <el-table-column label="类型" width="140">
          <template #default="{ row }">
            <el-tag type="info">{{ row.out_type_display || row.out_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_order_number" label="发货单号" width="170" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status_display || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stock_out_date" label="日期" width="120" />
        <el-table-column prop="operator_name" label="操作员" width="120" />
        <el-table-column prop="approved_by_name" label="审核人" width="120" />
        <el-table-column prop="notes" label="备注" min-width="220" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" :disabled="row.status !== 'submitted'" :loading="actioningId === row.id" @click="handleApprove(row.id)">
              审核完成
            </el-button>
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
import type { StockOut } from '../api/stockOuts'
import { approveStockOut, listStockOuts } from '../api/stockOuts'

const router = useRouter()

const loading = ref(false)
const actioningId = ref<number | null>(null)

const items = ref<StockOut[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const status = ref<string | undefined>(undefined)
const outType = ref<string | undefined>(undefined)

function formatError(err: any, fallback: string) {
  const data = err?.response?.data
  if (typeof data?.error === 'string') return data.error
  if (typeof data?.detail === 'string') return data.detail
  if (data && typeof data === 'object') {
    try {
      return JSON.stringify(data)
    } catch {
      // ignore
    }
  }
  return err?.message || fallback
}

function statusTagType(s: string) {
  if (s === 'draft') return 'info'
  if (s === 'submitted') return 'warning'
  if (s === 'completed') return 'success'
  if (s === 'cancelled') return 'danger'
  return 'info'
}

async function fetchList() {
  loading.value = true
  try {
    const data = await listStockOuts({
      page: page.value,
      page_size: pageSize.value,
      status: status.value || undefined,
      out_type: outType.value || undefined
    })
    items.value = data.results
    total.value = data.count
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载失败'))
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

async function handleApprove(id: number) {
  actioningId.value = id
  try {
    await approveStockOut(id)
    ElMessage.success('已完成')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '审核失败'))
  } finally {
    actioningId.value = null
  }
}

function goHome() {
  router.push({ name: 'dashboard' })
}

onMounted(() => fetchList())
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
  flex-wrap: wrap;
  justify-content: flex-end;
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

