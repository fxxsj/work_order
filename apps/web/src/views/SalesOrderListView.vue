<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">销售订单（vNext）</div>
      </div>
      <div class="right">
        <el-select v-model="status" size="small" clearable placeholder="状态" style="width: 160px" @change="reload">
          <el-option label="草稿" value="draft" />
          <el-option label="已提交" value="submitted" />
          <el-option label="已审核" value="approved" />
          <el-option label="已拒绝" value="rejected" />
          <el-option label="生产中" value="in_production" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-select v-model="paymentStatus" size="small" clearable placeholder="付款" style="width: 140px" @change="reload">
          <el-option label="未付款" value="unpaid" />
          <el-option label="部分付款" value="partial" />
          <el-option label="已付款" value="paid" />
        </el-select>
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索订单号/客户"
          style="width: 260px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="order_number" label="订单号" width="160" />
        <el-table-column label="客户" min-width="220">
          <template #default="{ row }">
            <span class="muted">{{ row.customer_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status_display || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="付款" width="120">
          <template #default="{ row }">
            <el-tag :type="paymentTagType(row.payment_status)">{{ row.payment_status_display || row.payment_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="交货日期" width="120" />
        <el-table-column prop="total_amount" label="总金额" width="120" />
        <el-table-column prop="items_count" label="明细" width="80" />
        <el-table-column label="操作" width="420" fixed="right">
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
              审核
            </el-button>
            <el-button size="small" :disabled="row.status !== 'submitted'" :loading="actioningId === row.id" @click="openReject(row.id)">
              拒绝
            </el-button>
            <el-button size="small" :disabled="row.status !== 'approved'" :loading="actioningId === row.id" @click="handleStartProduction(row.id)">
              开始生产
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

    <el-drawer v-model="detailOpen" title="订单详情" size="720px">
      <div v-if="detail" class="detail">
        <div class="detail-line">
          <div><b>订单号：</b>{{ detail.order_number }}</div>
          <div><b>状态：</b><el-tag :type="statusTagType(detail.status)">{{ detail.status_display || detail.status }}</el-tag></div>
        </div>
        <div class="detail-line">
          <div><b>客户：</b>{{ detail.customer_name }}</div>
          <div><b>交货日期：</b>{{ detail.delivery_date }}</div>
        </div>
        <div class="detail-line">
          <div><b>小计：</b>{{ detail.subtotal }}</div>
          <div><b>税率：</b>{{ detail.tax_rate }}%</div>
          <div><b>税额：</b>{{ detail.tax_amount }}</div>
        </div>
        <div class="detail-line">
          <div><b>折扣：</b>{{ detail.discount_amount }}</div>
          <div><b>总金额：</b>{{ detail.total_amount }}</div>
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
          <el-table-column label="产品" min-width="240">
            <template #default="{ row }">
              <span class="muted">{{ row.product_code }} - {{ row.product_name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="110" />
          <el-table-column prop="unit_price" label="单价" width="110" />
          <el-table-column prop="discount_amount" label="折扣" width="110" />
          <el-table-column prop="subtotal" label="小计" width="110" />
        </el-table>
      </div>
      <div v-else class="muted">加载中…</div>
    </el-drawer>

    <el-dialog v-model="editOpen" :title="editing ? '编辑销售订单' : '新建销售订单'" width="1020px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="140px">
        <el-form-item label="客户" required>
          <el-select
            v-model="editForm.customer"
            filterable
            remote
            clearable
            :remote-method="remoteSearchCustomers"
            :loading="customerSearching"
            placeholder="输入名称搜索"
            style="width: 100%"
          >
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单日期">
          <el-date-picker v-model="editForm.order_date" type="date" value-format="YYYY-MM-DD" placeholder="默认今天" />
        </el-form-item>
        <el-form-item label="交货日期" required>
          <el-date-picker v-model="editForm.delivery_date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="税率(%)">
          <el-input-number v-model="editForm.tax_rate" :min="0" :max="100" :precision="2" :step="0.5" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="editForm.contact_person" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="editForm.contact_phone" />
        </el-form-item>
        <el-form-item label="送货地址">
          <el-input v-model="editForm.shipping_address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.notes" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider />
        <div class="sub-title">订单明细</div>
        <el-table :data="editForm.items" size="small" style="width: 100%">
          <el-table-column label="产品" min-width="320">
            <template #default="{ row }">
              <el-select
                v-model="row.product"
                filterable
                remote
                clearable
                :remote-method="remoteSearchProducts"
                :loading="productSearching"
                placeholder="输入名称/编码搜索"
                style="width: 100%"
                @change="handleProductSelected(row)"
              >
                <el-option v-for="p in productOptions" :key="p.id" :label="`${p.code} - ${p.name}`" :value="p.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" :precision="0" :step="1" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="160">
            <template #default="{ row }">
              <el-input-number v-model="row.unit_price" :min="0" :precision="2" :step="0.1" :max="999999999.99" />
            </template>
          </el-table-column>
          <el-table-column label="折扣" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.discount_amount" :min="0" :precision="2" :step="1" :max="999999999.99" />
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
        <el-button type="primary" :loading="submitting" @click="saveSalesOrder">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectOpen" title="拒绝原因" width="520px" :close-on-click-modal="false">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="rejectOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Customer } from '../api/customers'
import { listCustomers } from '../api/customers'
import type { Product } from '../api/products'
import { listProducts } from '../api/products'
import type { SalesOrderDetail, SalesOrderListItem } from '../api/salesOrders'
import {
  approveSalesOrder,
  createSalesOrder,
  deleteSalesOrder,
  getSalesOrder,
  listSalesOrders,
  rejectSalesOrder,
  startProductionSalesOrder,
  submitSalesOrder,
  updateSalesOrder
} from '../api/salesOrders'
import { formatError } from '../lib/formatError'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const actioningId = ref<number | null>(null)

const items = ref<SalesOrderListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const status = ref<string | undefined>(undefined)
const paymentStatus = ref<string | undefined>(undefined)

const detailOpen = ref(false)
const detail = ref<SalesOrderDetail | null>(null)

const editOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const customerOptions = ref<Customer[]>([])
const customerSearching = ref(false)

const productOptions = ref<Product[]>([])
const productSearching = ref(false)
const productCache = ref<Record<number, Product>>({})

const editForm = reactive({
  customer: null as number | null,
  order_date: '' as string | '',
  delivery_date: '' as string | '',
  tax_rate: 0,
  contact_person: '',
  contact_phone: '',
  shipping_address: '',
  notes: '',
  items: [] as any[]
})

const rejectOpen = ref(false)
const rejectId = ref<number | null>(null)
const rejectReason = ref('')

function statusTagType(s: string) {
  if (s === 'draft') return 'info'
  if (s === 'submitted') return 'warning'
  if (s === 'approved') return 'success'
  if (s === 'rejected') return 'danger'
  if (s === 'in_production') return 'warning'
  if (s === 'completed') return 'success'
  if (s === 'cancelled') return 'danger'
  return 'info'
}

function paymentTagType(s?: string) {
  if (s === 'paid') return 'success'
  if (s === 'partial') return 'warning'
  return 'info'
}

async function fetchList() {
  loading.value = true
  try {
    const data = await listSalesOrders({
      page: page.value,
      page_size: pageSize.value,
      search: search.value || undefined,
      status: status.value || undefined,
      payment_status: paymentStatus.value || undefined
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
    detail.value = await getSalesOrder(id)
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载详情失败'))
  }
}

function resetEditForm() {
  editForm.customer = null
  editForm.order_date = ''
  editForm.delivery_date = ''
  editForm.tax_rate = 0
  editForm.contact_person = ''
  editForm.contact_phone = ''
  editForm.shipping_address = ''
  editForm.notes = ''
  editForm.items = []
}

function addItemRow() {
  editForm.items.push({ product: null, quantity: 1, unit_price: 0, discount_amount: 0 })
}

function removeItemRow(index: number) {
  editForm.items.splice(index, 1)
}

async function openCreate() {
  editing.value = false
  editingId.value = null
  resetEditForm()
  customerOptions.value = []
  productOptions.value = []
  addItemRow()
  editOpen.value = true
}

async function openEdit(id: number) {
  editing.value = true
  editingId.value = id
  resetEditForm()
  editOpen.value = true
  try {
    const d = await getSalesOrder(id)
    editForm.customer = d.customer
    editForm.order_date = (d.order_date || '') as any
    editForm.delivery_date = (d.delivery_date || '') as any
    editForm.tax_rate = Number(d.tax_rate || 0)
    editForm.contact_person = d.contact_person || ''
    editForm.contact_phone = d.contact_phone || ''
    editForm.shipping_address = d.shipping_address || ''
    editForm.notes = d.notes || ''
    editForm.items =
      (d.items || []).map((it: any) => ({
        product: it.product,
        quantity: Number(it.quantity || 0) || 0,
        unit_price: Number(it.unit_price || 0) || 0,
        discount_amount: Number(it.discount_amount || 0) || 0
      })) || []
    if (!editForm.items.length) addItemRow()
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载失败'))
  }
}

async function remoteSearchCustomers(query: string) {
  if (!query || !query.trim()) {
    customerOptions.value = []
    return
  }
  customerSearching.value = true
  try {
    const data = await listCustomers({ page: 1, page_size: 20, search: query.trim() })
    customerOptions.value = data.results
  } catch {
    customerOptions.value = []
  } finally {
    customerSearching.value = false
  }
}

async function remoteSearchProducts(query: string) {
  if (!query || !query.trim()) {
    productOptions.value = []
    return
  }
  productSearching.value = true
  try {
    const data = await listProducts({ page: 1, page_size: 20, search: query.trim() })
    productOptions.value = data.results
    data.results.forEach((p) => (productCache.value[p.id] = p))
  } catch {
    productOptions.value = []
  } finally {
    productSearching.value = false
  }
}

function handleProductSelected(row: any) {
  const id = row.product
  if (!id) return
  const p = productCache.value[id]
  if (!p) return
  if (!row.unit_price || Number(row.unit_price) === 0) row.unit_price = Number(p.unit_price || 0)
}

async function saveSalesOrder() {
  if (!editForm.customer) {
    ElMessage.warning('请选择客户')
    return
  }
  if (!editForm.delivery_date) {
    ElMessage.warning('请选择交货日期')
    return
  }
  const cleaned = editForm.items.filter((r) => !!r.product && Number(r.quantity) > 0)
  if (!cleaned.length) {
    ElMessage.warning('请至少添加 1 条明细')
    return
  }

  submitting.value = true
  try {
    const payload: any = {
      customer: editForm.customer,
      order_date: editForm.order_date || undefined,
      delivery_date: editForm.delivery_date,
      tax_rate: Number(editForm.tax_rate || 0),
      contact_person: editForm.contact_person || '',
      contact_phone: editForm.contact_phone || '',
      shipping_address: editForm.shipping_address || '',
      notes: editForm.notes || '',
      items: cleaned.map((r) => ({
        product: r.product,
        quantity: Number(r.quantity),
        unit_price: Number(r.unit_price || 0),
        discount_amount: Number(r.discount_amount || 0)
      }))
    }
    if (editing.value && editingId.value) {
      await updateSalesOrder(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await createSalesOrder(payload)
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
    await ElMessageBox.confirm('确认删除该销售订单？（仅草稿可删除）', '提示', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deleteSalesOrder(id)
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
    await submitSalesOrder(id)
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
    await approveSalesOrder(id)
    ElMessage.success('已审核')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '审核失败'))
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
    await rejectSalesOrder(rejectId.value, { reason: rejectReason.value.trim() })
    ElMessage.success('已拒绝')
    rejectOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '拒绝失败'))
  } finally {
    submitting.value = false
  }
}

async function handleStartProduction(id: number) {
  actioningId.value = id
  try {
    await startProductionSalesOrder(id)
    ElMessage.success('已开始生产')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '操作失败'))
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
