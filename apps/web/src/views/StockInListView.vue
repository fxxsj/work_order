<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">入库单（vNext）</div>
      </div>
      <div class="right">
        <el-select v-model="status" size="small" clearable placeholder="状态" style="width: 140px" @change="reload">
          <el-option label="草稿" value="draft" />
          <el-option label="已提交" value="submitted" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-button size="small" :loading="loading" @click="reload">刷新</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="order_number" label="入库单号" width="170" />
        <el-table-column prop="work_order_number" label="施工单号" width="170" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status_display || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stock_in_date" label="日期" width="120" />
        <el-table-column prop="submitted_by_name" label="提交人" width="120" />
        <el-table-column prop="approved_by_name" label="审核人" width="120" />
        <el-table-column prop="notes" label="备注" min-width="200" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" :disabled="row.status !== 'draft'" :loading="actioningId === row.id" @click="handleSubmit(row.id)">
              提交
            </el-button>
            <el-button size="small" type="success" :disabled="row.status !== 'submitted'" :loading="actioningId === row.id" @click="handleApprove(row.id)">
              审核完成
            </el-button>
            <el-button size="small" type="danger" :disabled="row.status !== 'draft'" :loading="deletingId === row.id" @click="handleDelete(row.id)">
              删除
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

    <el-dialog v-model="createOpen" title="新建入库单" width="760px" :close-on-click-modal="false">
      <el-form :model="form" label-width="140px">
        <el-form-item label="关联施工单" required>
          <el-select
            v-model="form.work_order"
            filterable
            remote
            clearable
            :remote-method="remoteSearchWorkOrders"
            :loading="workOrderSearching"
            placeholder="输入单号搜索"
            style="width: 100%"
          >
            <el-option v-for="wo in workOrderOptions" :key="wo.id" :label="wo.order_number" :value="wo.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="入库日期">
          <el-date-picker v-model="form.stock_in_date" type="date" value-format="YYYY-MM-DD" placeholder="默认今天" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="create">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { WorkOrderListItem } from '../api/workorders'
import { listWorkOrders } from '../api/workorders'
import type { StockIn } from '../api/stockIns'
import { approveStockIn, createStockIn, deleteStockIn, listStockIns, submitStockIn } from '../api/stockIns'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const actioningId = ref<number | null>(null)

const items = ref<StockIn[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const status = ref<string | undefined>(undefined)

const createOpen = ref(false)
const form = reactive({
  work_order: null as number | null,
  stock_in_date: '' as string | '',
  notes: ''
})

const workOrderOptions = ref<WorkOrderListItem[]>([])
const workOrderSearching = ref(false)

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
    const data = await listStockIns({ page: page.value, page_size: pageSize.value, status: status.value || undefined })
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

function openCreate() {
  form.work_order = null
  form.stock_in_date = ''
  form.notes = ''
  createOpen.value = true
}

async function remoteSearchWorkOrders(query: string) {
  if (!query || !query.trim()) {
    workOrderOptions.value = []
    return
  }
  workOrderSearching.value = true
  try {
    const data = await listWorkOrders({ page: 1, page_size: 20, search: query.trim() })
    workOrderOptions.value = data.results
  } catch {
    workOrderOptions.value = []
  } finally {
    workOrderSearching.value = false
  }
}

async function create() {
  if (!form.work_order) {
    ElMessage.warning('请选择施工单')
    return
  }
  submitting.value = true
  try {
    await createStockIn({
      work_order: form.work_order,
      stock_in_date: form.stock_in_date || undefined,
      notes: form.notes || ''
    })
    ElMessage.success('已创建')
    createOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '创建失败'))
  } finally {
    submitting.value = false
  }
}

async function handleSubmit(id: number) {
  actioningId.value = id
  try {
    await submitStockIn(id)
    ElMessage.success('已提交')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '提交失败'))
  } finally {
    actioningId.value = null
  }
}

async function handleApprove(id: number) {
  actioningId.value = id
  try {
    await approveStockIn(id)
    ElMessage.success('已完成')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '审核失败'))
  } finally {
    actioningId.value = null
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该入库单？（仅草稿可删）', '提示', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deleteStockIn(id)
    ElMessage.success('已删除')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '删除失败'))
  } finally {
    deletingId.value = null
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

