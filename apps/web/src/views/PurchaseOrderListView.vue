<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">采购单管理（vNext）</div>
      </div>
      <div class="right">
        <el-select v-model="status" size="small" clearable placeholder="状态" style="width: 140px" @change="reload">
          <el-option label="草稿" value="draft" />
          <el-option label="已提交" value="submitted" />
          <el-option label="已批准" value="approved" />
          <el-option label="已下单" value="ordered" />
          <el-option label="已收货" value="received" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索采购单号/供应商"
          style="width: 260px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="order_number" label="采购单号" width="160" />
        <el-table-column label="供应商" min-width="200">
          <template #default="{ row }">
            <span class="muted">{{ row.supplier_code }} - {{ row.supplier_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status_display || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="总金额" width="120" />
        <el-table-column prop="items_count" label="明细" width="80" />
        <el-table-column label="收货进度" width="140">
          <template #default="{ row }">
            <el-progress :percentage="Math.min(100, Math.max(0, Number(row.received_progress || 0)))" />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="410" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row.id)">详情</el-button>
            <el-button size="small" :disabled="row.status !== 'draft'" @click="openEdit(row.id)">编辑</el-button>
            <el-button size="small" type="danger" :disabled="row.status !== 'draft'" :loading="deletingId === row.id" @click="handleDelete(row.id)">
              删除
            </el-button>

            <el-divider direction="vertical" />

            <el-button size="small" type="primary" :disabled="row.status !== 'draft'" :loading="actioningId === row.id" @click="handleSubmit(row.id)">
              提交
            </el-button>
            <el-button size="small" type="success" :disabled="row.status !== 'submitted'" :loading="actioningId === row.id" @click="handleApprove(row.id)">
              批准
            </el-button>
            <el-button size="small" :disabled="row.status !== 'submitted'" :loading="actioningId === row.id" @click="openReject(row.id)">
              拒绝
            </el-button>
            <el-button size="small" :disabled="row.status !== 'approved'" :loading="actioningId === row.id" @click="openPlaceOrder(row.id)">
              下单
            </el-button>
            <el-button size="small" :disabled="row.status !== 'ordered'" :loading="actioningId === row.id" @click="openReceive(row.id)">
              收货
            </el-button>
            <el-button size="small" :disabled="row.status === 'received' || row.status === 'cancelled'" :loading="actioningId === row.id" @click="handleCancel(row.id)">
              取消
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

    <el-drawer v-model="detailOpen" title="采购单详情" size="720px">
      <div v-if="detail" class="detail">
        <div class="detail-line">
          <div><b>采购单号：</b>{{ detail.order_number }}</div>
          <div><b>状态：</b><el-tag :type="statusTagType(detail.status)">{{ detail.status_display || detail.status }}</el-tag></div>
        </div>
        <div class="detail-line">
          <div><b>供应商：</b>{{ detail.supplier_code }} - {{ detail.supplier_name }}</div>
          <div><b>总金额：</b>{{ detail.total_amount }}</div>
        </div>
        <div class="detail-line">
          <div><b>下单日期：</b>{{ detail.ordered_date || '—' }}</div>
          <div><b>预计到货：</b>{{ detail.expected_date || '—' }}</div>
        </div>
        <div class="detail-line">
          <div><b>备注：</b><span class="muted">{{ detail.notes || '—' }}</span></div>
        </div>
        <div v-if="detail.rejection_reason" class="detail-line">
          <div><b>拒绝原因：</b><span class="danger">{{ detail.rejection_reason }}</span></div>
        </div>

        <el-divider />
        <div class="sub-title">明细</div>
        <el-table :data="detail.items || []" size="small" style="width: 100%">
          <el-table-column label="物料" min-width="220">
            <template #default="{ row }">
              <span class="muted">{{ row.material_code }} - {{ row.material_name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="110" />
          <el-table-column prop="unit_price" label="单价" width="110" />
          <el-table-column prop="subtotal" label="小计" width="110" />
          <el-table-column prop="received_quantity" label="已收货" width="110" />
          <el-table-column prop="remaining_quantity" label="剩余" width="110" />
        </el-table>
      </div>
      <div v-else class="muted">加载中…</div>
    </el-drawer>

    <el-dialog v-model="editOpen" :title="editing ? '编辑采购单' : '新建采购单'" width="980px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="140px">
        <el-form-item label="供应商" required>
          <el-select
            v-model="editForm.supplier"
            filterable
            remote
            clearable
            :remote-method="remoteSearchSuppliers"
            :loading="supplierSearching"
            placeholder="输入名称/编码搜索"
            style="width: 100%"
          >
            <el-option v-for="s in supplierOptions" :key="s.id" :label="`${s.code} - ${s.name}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计到货日期">
          <el-date-picker v-model="editForm.expected_date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.notes" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider />
        <div class="sub-title">采购明细</div>
        <el-table :data="editForm.items_data" size="small" style="width: 100%">
          <el-table-column label="物料" min-width="320">
            <template #default="{ row }">
              <el-select
                v-model="row.material"
                filterable
                remote
                clearable
                :remote-method="remoteSearchMaterials"
                :loading="materialSearching"
                placeholder="输入名称/编码搜索"
                style="width: 100%"
                @change="handleMaterialSelected(row)"
              >
                <el-option v-for="m in materialOptions" :key="m.id" :label="`${m.code} - ${m.name}`" :value="m.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="0.01" :precision="2" :step="1" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.unit_price" :min="0" :precision="2" :step="0.1" :max="999999999.99" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ $index }">
              <el-button size="small" type="danger" @click="removeItemRow($index)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="row-actions">
          <el-button size="small" @click="addItemRow">添加明细</el-button>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="editOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="savePurchaseOrder">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectOpen" title="拒绝原因" width="520px" :close-on-click-modal="false">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="rejectOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="placeOrderOpen" title="确认下单" width="520px" :close-on-click-modal="false">
      <el-form :model="placeOrderForm" label-width="120px">
        <el-form-item label="下单日期">
          <el-date-picker v-model="placeOrderForm.ordered_date" type="date" value-format="YYYY-MM-DD" placeholder="默认今天" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="placeOrderOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmPlaceOrder">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="receiveOpen" title="分批收货" width="980px" :close-on-click-modal="false">
      <div v-if="receiveDetail">
        <div class="muted">采购单：{{ receiveDetail.order_number }}（{{ receiveDetail.supplier_name }}）</div>
        <el-form :model="receiveForm" label-width="140px" style="margin-top: 10px">
          <el-form-item label="收货日期">
            <el-date-picker v-model="receiveForm.received_date" type="date" value-format="YYYY-MM-DD" placeholder="默认今天" />
          </el-form-item>
        </el-form>
        <el-table :data="receiveForm.items" size="small" style="width: 100%">
          <el-table-column label="物料" min-width="260">
            <template #default="{ row }">
              <span class="muted">{{ row.material_label }}</span>
            </template>
          </el-table-column>
          <el-table-column label="剩余" width="120">
            <template #default="{ row }">
              <span>{{ row.remaining }}</span>
            </template>
          </el-table-column>
          <el-table-column label="本次收货" width="160">
            <template #default="{ row }">
              <el-input-number v-model="row.received_quantity" :min="0" :precision="2" :step="1" />
            </template>
          </el-table-column>
          <el-table-column label="送货单号" width="200">
            <template #default="{ row }">
              <el-input v-model="row.delivery_note_number" />
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.notes" />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="muted">加载中…</div>
      <template #footer>
        <el-button @click="receiveOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmReceive">提交收货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { PurchaseOrderDetail, PurchaseOrderListItem } from '../api/purchaseOrders'
import {
  approvePurchaseOrder,
  cancelPurchaseOrder,
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrders,
  placeOrderPurchaseOrder,
  receivePurchaseOrder,
  rejectPurchaseOrder,
  submitPurchaseOrder,
  updatePurchaseOrder
} from '../api/purchaseOrders'
import type { Supplier } from '../api/suppliers'
import { listSuppliers } from '../api/suppliers'
import type { Material } from '../api/materials'
import { listMaterials } from '../api/materials'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const actioningId = ref<number | null>(null)

const items = ref<PurchaseOrderListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const status = ref<string | undefined>(undefined)

const detailOpen = ref(false)
const detail = ref<PurchaseOrderDetail | null>(null)

const editOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const supplierOptions = ref<Supplier[]>([])
const supplierSearching = ref(false)
const materialOptions = ref<Material[]>([])
const materialSearching = ref(false)
const materialCache = ref<Record<number, Material>>({})

const editForm = reactive({
  supplier: null as number | null,
  expected_date: '' as string | '',
  notes: '',
  items_data: [] as any[]
})

const rejectOpen = ref(false)
const rejectReason = ref('')
const rejectId = ref<number | null>(null)

const placeOrderOpen = ref(false)
const placeOrderId = ref<number | null>(null)
const placeOrderForm = reactive({
  ordered_date: '' as string | ''
})

const receiveOpen = ref(false)
const receiveId = ref<number | null>(null)
const receiveDetail = ref<PurchaseOrderDetail | null>(null)
const receiveForm = reactive({
  received_date: '' as string | '',
  items: [] as any[]
})

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
  if (s === 'approved') return 'success'
  if (s === 'ordered') return 'warning'
  if (s === 'received') return 'success'
  if (s === 'cancelled') return 'danger'
  return 'info'
}

async function fetchList() {
  loading.value = true
  try {
    const data = await listPurchaseOrders({
      page: page.value,
      page_size: pageSize.value,
      search: search.value || undefined,
      status: status.value || undefined
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

async function openDetail(id: number) {
  detailOpen.value = true
  detail.value = null
  try {
    detail.value = await getPurchaseOrder(id)
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载详情失败'))
  }
}

function resetEditForm() {
  editForm.supplier = null
  editForm.expected_date = ''
  editForm.notes = ''
  editForm.items_data = []
}

function addItemRow() {
  editForm.items_data.push({ material: null, quantity: 1, unit_price: 0 })
}

function removeItemRow(index: number) {
  editForm.items_data.splice(index, 1)
}

async function openCreate() {
  editing.value = false
  editingId.value = null
  resetEditForm()
  supplierOptions.value = []
  materialOptions.value = []
  addItemRow()
  editOpen.value = true
}

async function openEdit(id: number) {
  editing.value = true
  editingId.value = id
  resetEditForm()
  editOpen.value = true
  try {
    const d = await getPurchaseOrder(id)
    editForm.supplier = d.supplier
    editForm.expected_date = (d.expected_date || '') as any
    editForm.notes = d.notes || ''
    editForm.items_data =
      (d.items || []).map((it) => ({
        material: it.material,
        quantity: Number(it.quantity || 0) || 0,
        unit_price: Number(it.unit_price || 0) || 0
      })) || []
    if (!editForm.items_data.length) addItemRow()
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载失败'))
  }
}

async function remoteSearchSuppliers(query: string) {
  if (!query || !query.trim()) {
    supplierOptions.value = []
    return
  }
  supplierSearching.value = true
  try {
    const data = await listSuppliers({ page: 1, search: query.trim() })
    supplierOptions.value = data.results
  } catch {
    supplierOptions.value = []
  } finally {
    supplierSearching.value = false
  }
}

async function remoteSearchMaterials(query: string) {
  if (!query || !query.trim()) {
    materialOptions.value = []
    return
  }
  materialSearching.value = true
  try {
    const data = await listMaterials({ page: 1, page_size: 20, search: query.trim() })
    materialOptions.value = data.results
    data.results.forEach((m) => (materialCache.value[m.id] = m))
  } catch {
    materialOptions.value = []
  } finally {
    materialSearching.value = false
  }
}

function handleMaterialSelected(row: any) {
  const id = row.material
  if (!id) return
  const m = materialCache.value[id]
  if (!m) return
  if (!row.unit_price || Number(row.unit_price) === 0) row.unit_price = Number(m.unit_price || 0)
}

async function savePurchaseOrder() {
  if (!editForm.supplier) {
    ElMessage.warning('请选择供应商')
    return
  }
  const cleaned = editForm.items_data.filter((r) => !!r.material && Number(r.quantity) > 0)
  if (!cleaned.length) {
    ElMessage.warning('请至少添加 1 条明细')
    return
  }

  submitting.value = true
  try {
    const payload: any = {
      supplier: editForm.supplier,
      expected_date: editForm.expected_date || null,
      notes: editForm.notes || '',
      items_data: cleaned.map((r) => ({
        material: r.material,
        quantity: Number(r.quantity),
        unit_price: Number(r.unit_price || 0)
      }))
    }
    if (editing.value && editingId.value) {
      await updatePurchaseOrder(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await createPurchaseOrder(payload)
      ElMessage.success('已创建')
    }
    editOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '保存失败'))
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该采购单？（仅草稿可删除）', '提示', { type: 'warning' })
  } catch {
    return
  }

  deletingId.value = id
  try {
    await deletePurchaseOrder(id)
    ElMessage.success('已删除')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '删除失败'))
  } finally {
    deletingId.value = null
  }
}

async function handleSubmit(id: number) {
  actioningId.value = id
  try {
    await submitPurchaseOrder(id)
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
    await approvePurchaseOrder(id)
    ElMessage.success('已批准')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '批准失败'))
  } finally {
    actioningId.value = null
  }
}

function openReject(id: number) {
  rejectId.value = id
  rejectReason.value = ''
  rejectOpen.value = true
}

async function confirmReject() {
  if (!rejectId.value) return
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  submitting.value = true
  try {
    await rejectPurchaseOrder(rejectId.value, { rejection_reason: rejectReason.value.trim() })
    ElMessage.success('已拒绝')
    rejectOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '拒绝失败'))
  } finally {
    submitting.value = false
  }
}

function openPlaceOrder(id: number) {
  placeOrderId.value = id
  placeOrderForm.ordered_date = ''
  placeOrderOpen.value = true
}

async function confirmPlaceOrder() {
  if (!placeOrderId.value) return
  submitting.value = true
  try {
    await placeOrderPurchaseOrder(placeOrderId.value, placeOrderForm.ordered_date ? { ordered_date: placeOrderForm.ordered_date } : {})
    ElMessage.success('已下单')
    placeOrderOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '下单失败'))
  } finally {
    submitting.value = false
  }
}

async function openReceive(id: number) {
  receiveId.value = id
  receiveOpen.value = true
  receiveDetail.value = null
  receiveForm.received_date = ''
  receiveForm.items = []
  try {
    const d = await getPurchaseOrder(id)
    receiveDetail.value = d
    const rows =
      (d.items || []).map((it: any) => {
        const remaining = Number(it.remaining_quantity || 0)
        return {
          item_id: it.id,
          material_label: `${it.material_code || ''} - ${it.material_name || ''}`.trim(),
          remaining,
          received_quantity: remaining > 0 ? remaining : 0,
          delivery_note_number: '',
          notes: ''
        }
      }) || []
    receiveForm.items = rows.filter((r: any) => r.remaining > 0)
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载采购单失败'))
  }
}

async function confirmReceive() {
  if (!receiveId.value) return
  const cleaned = receiveForm.items.filter((r: any) => Number(r.received_quantity) > 0)
  if (!cleaned.length) {
    ElMessage.warning('请至少填写 1 条收货数量')
    return
  }
  submitting.value = true
  try {
    await receivePurchaseOrder(receiveId.value, {
      received_date: receiveForm.received_date || undefined,
      items: cleaned.map((r: any) => ({
        item_id: r.item_id,
        received_quantity: Number(r.received_quantity),
        delivery_note_number: r.delivery_note_number || '',
        notes: r.notes || ''
      }))
    })
    ElMessage.success('已提交收货记录（待质检）')
    receiveOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '收货失败'))
  } finally {
    submitting.value = false
  }
}

async function handleCancel(id: number) {
  try {
    await ElMessageBox.confirm('确认取消该采购单？', '提示', { type: 'warning' })
  } catch {
    return
  }
  actioningId.value = id
  try {
    await cancelPurchaseOrder(id)
    ElMessage.success('已取消')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '取消失败'))
  } finally {
    actioningId.value = null
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
.muted {
  color: #666;
  font-size: 12px;
}
.danger {
  color: #f56c6c;
}
.detail {
  padding: 6px 0;
}
.detail-line {
  display: flex;
  gap: 18px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.sub-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.row-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
