<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">收货质检 / 入库 / 退货（vNext）</div>
      </div>
      <div class="right">
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索送货单号/物料"
          style="width: 260px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
      </div>
    </div>

    <el-card>
      <el-tabs v-model="tab" @tab-change="reload">
        <el-tab-pane name="inspection" label="待质检" />
        <el-tab-pane name="stockin" label="待入库" />
        <el-tab-pane name="return" label="待退货" />
      </el-tabs>

      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="purchase_order_number" label="采购单号" width="160" />
        <el-table-column label="物料" min-width="220">
          <template #default="{ row }">
            <span class="muted">{{ row.material_code }} - {{ row.material_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="received_date" label="收货日期" width="120" />
        <el-table-column prop="received_quantity" label="收货数量" width="120" />
        <el-table-column prop="delivery_note_number" label="送货单号" width="160" />
        <el-table-column label="质检状态" width="120">
          <template #default="{ row }">
            <el-tag :type="inspectionTagType(row.inspection_status)">{{ row.inspection_status_display || row.inspection_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="合格/不合格" width="140">
          <template #default="{ row }">
            <span class="muted">{{ row.qualified_quantity || '—' }} / {{ row.unqualified_quantity || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="tab === 'inspection'" size="small" type="primary" :loading="actioningId === row.id" @click="openInspect(row)">
              质检确认
            </el-button>
            <el-button v-if="tab === 'stockin'" size="small" type="success" :loading="actioningId === row.id" @click="handleStockIn(row.id)">
              入库
            </el-button>
            <el-button v-if="tab === 'return'" size="small" :loading="actioningId === row.id" @click="openReturn(row)">
              退货处理
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

    <el-dialog v-model="inspectOpen" title="质检确认" width="620px" :close-on-click-modal="false">
      <div v-if="inspectTarget" class="muted">
        {{ inspectTarget.purchase_order_number }} - {{ inspectTarget.material_code }} {{ inspectTarget.material_name }}（收货：{{ inspectTarget.received_quantity }}）
      </div>
      <el-form :model="inspectForm" label-width="140px" style="margin-top: 10px">
        <el-form-item label="合格数量" required>
          <el-input-number v-model="inspectForm.qualified_quantity" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="不合格数量" required>
          <el-input-number v-model="inspectForm.unqualified_quantity" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="不合格原因">
          <el-input v-model="inspectForm.unqualified_reason" type="textarea" :rows="2" placeholder="不合格数量>0 时必填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inspectOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmInspect">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="returnOpen" title="退货处理" width="620px" :close-on-click-modal="false">
      <div v-if="returnTarget" class="muted">
        {{ returnTarget.purchase_order_number }} - {{ returnTarget.material_code }} {{ returnTarget.material_name }}（不合格：{{ returnTarget.unqualified_quantity }}）
      </div>
      <el-form :model="returnForm" label-width="140px" style="margin-top: 10px">
        <el-form-item label="退货数量" required>
          <el-input-number v-model="returnForm.return_quantity" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="退货备注">
          <el-input v-model="returnForm.return_note" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmReturn">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { PurchaseReceiveRecord } from '../api/purchaseReceiveRecords'
import { confirmInspection, listPendingInspections, listPendingReturn, listPendingStockIn, processReturn, stockIn } from '../api/purchaseReceiveRecords'
import { formatError } from '../lib/formatError'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const actioningId = ref<number | null>(null)

const tab = ref<'inspection' | 'stockin' | 'return'>('inspection')
const search = ref('')

const items = ref<PurchaseReceiveRecord[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const inspectOpen = ref(false)
const inspectTarget = ref<PurchaseReceiveRecord | null>(null)
const inspectForm = reactive({
  qualified_quantity: 0,
  unqualified_quantity: 0,
  unqualified_reason: ''
})

const returnOpen = ref(false)
const returnTarget = ref<PurchaseReceiveRecord | null>(null)
const returnForm = reactive({
  return_quantity: 0,
  return_note: ''
})

function inspectionTagType(s?: string) {
  if (s === 'pending') return 'warning'
  if (s === 'qualified') return 'success'
  if (s === 'unqualified') return 'danger'
  if (s === 'partial_qualified') return 'info'
  return 'info'
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value, search: search.value || undefined }
    const data =
      tab.value === 'inspection'
        ? await listPendingInspections(params)
        : tab.value === 'stockin'
          ? await listPendingStockIn(params)
          : await listPendingReturn(params)
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

function openInspect(row: PurchaseReceiveRecord) {
  inspectTarget.value = row
  inspectForm.qualified_quantity = Number(row.received_quantity || 0)
  inspectForm.unqualified_quantity = 0
  inspectForm.unqualified_reason = ''
  inspectOpen.value = true
}

async function confirmInspect() {
  if (!inspectTarget.value) return
  const received = Number(inspectTarget.value.received_quantity || 0)
  const qualified = Number(inspectForm.qualified_quantity || 0)
  const unqualified = Number(inspectForm.unqualified_quantity || 0)

  if (qualified + unqualified !== received) {
    ElMessage.warning(`合格+不合格必须等于收货数量（${received}）`)
    return
  }
  if (unqualified > 0 && !inspectForm.unqualified_reason.trim()) {
    ElMessage.warning('存在不合格数量时必须填写原因')
    return
  }

  submitting.value = true
  try {
    await confirmInspection(inspectTarget.value.id, {
      qualified_quantity: qualified,
      unqualified_quantity: unqualified,
      unqualified_reason: inspectForm.unqualified_reason.trim() || undefined
    })
    ElMessage.success('质检确认成功')
    inspectOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '质检确认失败'))
  } finally {
    submitting.value = false
  }
}

async function handleStockIn(id: number) {
  actioningId.value = id
  try {
    await stockIn(id)
    ElMessage.success('入库成功')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '入库失败'))
  } finally {
    actioningId.value = null
  }
}

function openReturn(row: PurchaseReceiveRecord) {
  returnTarget.value = row
  returnForm.return_quantity = Number(row.unqualified_quantity || 0)
  returnForm.return_note = ''
  returnOpen.value = true
}

async function confirmReturn() {
  if (!returnTarget.value) return
  const maxQty = Number(returnTarget.value.unqualified_quantity || 0)
  const qty = Number(returnForm.return_quantity || 0)
  if (qty <= 0) {
    ElMessage.warning('退货数量必须大于 0')
    return
  }
  if (qty > maxQty) {
    ElMessage.warning(`退货数量不能超过不合格数量（${maxQty}）`)
    return
  }

  submitting.value = true
  try {
    await processReturn(returnTarget.value.id, { return_quantity: qty, return_note: returnForm.return_note || undefined })
    ElMessage.success('退货处理成功')
    returnOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '退货处理失败'))
  } finally {
    submitting.value = false
  }
}

function goHome() {
  router.push({ name: 'dashboard' })
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
.muted {
  color: #666;
  font-size: 12px;
}
</style>
