<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">发货单（vNext）</div>
      </div>
      <div class="right">
        <el-select v-model="status" size="small" clearable placeholder="状态" style="width: 140px" @change="reload">
          <el-option label="待发货" value="pending" />
          <el-option label="已发货" value="shipped" />
          <el-option label="运输中" value="in_transit" />
          <el-option label="已签收" value="received" />
          <el-option label="拒收" value="rejected" />
          <el-option label="已退货" value="returned" />
        </el-select>
        <el-select
          v-model="customerId"
          size="small"
          clearable
          filterable
          remote
          :remote-method="remoteSearchCustomers"
          :loading="customerSearching"
          placeholder="客户"
          style="width: 220px"
          @change="reload"
        >
          <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索发货单号/客户/物流"
          style="width: 260px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <div class="summary" v-if="summary">
        <el-tag type="info">总单数：{{ summary.summary?.total_count ?? '-' }}</el-tag>
        <el-tag type="warning">待发货：{{ summary.summary?.pending_count ?? '-' }}</el-tag>
        <el-tag type="success">已发货：{{ summary.summary?.shipped_count ?? '-' }}</el-tag>
        <el-tag type="info">运输中：{{ summary.summary?.in_transit_count ?? '-' }}</el-tag>
        <el-tag type="success">已签收：{{ summary.summary?.received_count ?? '-' }}</el-tag>
        <el-tag type="info">总运费：{{ summary.summary?.total_freight ?? '-' }}</el-tag>
      </div>

      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="order_number" label="发货单号" width="170" />
        <el-table-column prop="sales_order_number" label="销售单号" width="170" />
        <el-table-column prop="customer_name" label="客户" min-width="180" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status_display || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="发货日期" width="120" />
        <el-table-column prop="items_count" label="明细" width="80" />
        <el-table-column prop="total_quantity" label="总数量" width="110" />
        <el-table-column prop="logistics_company" label="物流公司" width="140" />
        <el-table-column prop="tracking_number" label="物流单号" width="160" />
        <el-table-column label="操作" width="420" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row.id)">详情</el-button>
            <el-button size="small" :disabled="row.status !== 'pending'" @click="openEdit(row.id)">编辑</el-button>
            <el-button size="small" type="danger" :disabled="row.status !== 'pending'" :loading="deletingId === row.id" @click="handleDelete(row.id)">
              删除
            </el-button>
            <el-divider direction="vertical" />
            <el-button size="small" type="primary" :disabled="row.status !== 'pending'" :loading="actioningId === row.id" @click="openShip(row.id)">
              发货
            </el-button>
            <el-button size="small" type="success" :disabled="row.status !== 'shipped' && row.status !== 'in_transit'" :loading="actioningId === row.id" @click="openReceive(row.id)">
              签收
            </el-button>
            <el-button size="small" :disabled="row.status !== 'shipped' && row.status !== 'in_transit'" :loading="actioningId === row.id" @click="openReject(row.id)">
              拒收
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

    <el-drawer v-model="detailOpen" title="发货单详情" size="820px">
      <div v-if="detail" class="detail">
        <div class="detail-line">
          <div><b>发货单号：</b>{{ detail.order_number }}</div>
          <div><b>状态：</b><el-tag :type="statusTagType(detail.status)">{{ detail.status_display || detail.status }}</el-tag></div>
        </div>
        <div class="detail-line">
          <div><b>销售单：</b>{{ detail.sales_order_number }}</div>
          <div><b>客户：</b>{{ detail.customer_name }}</div>
        </div>
        <div class="detail-line">
          <div><b>收货人：</b>{{ detail.receiver_name }}（{{ detail.receiver_phone }}）</div>
        </div>
        <div class="detail-line">
          <div><b>地址：</b><span class="muted">{{ detail.delivery_address }}</span></div>
        </div>
        <div class="detail-line">
          <div><b>物流：</b><span class="muted">{{ detail.logistics_company || '—' }} / {{ detail.tracking_number || '—' }}</span></div>
          <div><b>运费：</b>{{ detail.freight ?? '—' }}</div>
        </div>
        <div class="detail-line">
          <div><b>备注：</b><span class="muted">{{ detail.notes || '—' }}</span></div>
        </div>
        <el-divider />
        <div class="sub-title">明细</div>
        <el-table :data="detail.items || []" size="small" style="width: 100%">
          <el-table-column label="产品" min-width="260">
            <template #default="{ row }">
              <span class="muted">{{ row.product_code }} - {{ row.product_name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="110" />
          <el-table-column prop="unit_price" label="单价" width="110" />
          <el-table-column prop="subtotal" label="小计" width="110" />
          <el-table-column prop="stock_batch" label="批次" width="160" />
        </el-table>
      </div>
      <div v-else class="muted">加载中…</div>
    </el-drawer>

    <el-dialog v-model="editOpen" :title="editing ? '编辑发货单' : '新建发货单'" width="1020px" :close-on-click-modal="false">
      <el-form :model="form" label-width="160px">
        <el-form-item label="销售订单" required>
          <el-select
            v-model="form.sales_order"
            filterable
            remote
            clearable
            :remote-method="remoteSearchSalesOrders"
            :loading="salesOrderSearching"
            placeholder="输入订单号/客户搜索"
            style="width: 100%"
          >
            <el-option v-for="o in salesOrderOptions" :key="o.id" :label="`${o.order_number} - ${o.customer_name || ''}`" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户" required>
          <el-select
            v-model="form.customer"
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
        <el-form-item label="发货日期">
          <el-date-picker v-model="form.delivery_date" type="date" value-format="YYYY-MM-DD" placeholder="可选" />
        </el-form-item>
        <el-form-item label="收货人" required>
          <el-input v-model="form.receiver_name" />
        </el-form-item>
        <el-form-item label="联系电话" required>
          <el-input v-model="form.receiver_phone" />
        </el-form-item>
        <el-form-item label="送货地址" required>
          <el-input v-model="form.delivery_address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="物流公司">
          <el-input v-model="form.logistics_company" />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="form.tracking_number" />
        </el-form-item>
        <el-form-item label="运费">
          <el-input-number v-model="form.freight" :min="0" :precision="2" :step="1" :max="999999999.99" />
        </el-form-item>
        <el-form-item label="包裹数量">
          <el-input-number v-model="form.package_count" :min="1" :precision="0" :step="1" />
        </el-form-item>
        <el-form-item label="总重量(kg)">
          <el-input-number v-model="form.package_weight" :min="0" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider />
        <div class="sub-title">发货明细</div>
        <el-table :data="form.items_data" size="small" style="width: 100%">
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
              <el-input-number v-model="row.quantity" :min="0.01" :precision="2" :step="1" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.unit_price" :min="0" :precision="2" :step="0.1" :max="999999999.99" />
            </template>
          </el-table-column>
          <el-table-column label="批次号" width="180">
            <template #default="{ row }">
              <el-input v-model="row.stock_batch" placeholder="可选" />
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.notes" placeholder="可选" />
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
        <el-button type="primary" :loading="submitting" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="shipOpen" title="确认发货" width="560px" :close-on-click-modal="false">
      <el-form :model="shipForm" label-width="120px">
        <el-form-item label="物流公司">
          <el-input v-model="shipForm.logistics_company" />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="shipForm.tracking_number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmShip">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="receiveOpen" title="确认签收" width="560px" :close-on-click-modal="false">
      <el-input v-model="receiveNotes" type="textarea" :rows="3" placeholder="签收备注（可选）" />
      <template #footer>
        <el-button @click="receiveOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmReceive">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectOpen" title="拒收原因" width="560px" :close-on-click-modal="false">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入拒收原因" />
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
import type { SalesOrderListItem } from '../api/salesOrders'
import { listSalesOrders } from '../api/salesOrders'
import type { DeliveryOrderDetail, DeliveryOrderListItem } from '../api/deliveryOrders'
import {
  createDeliveryOrder,
  deleteDeliveryOrder,
  getDeliveryOrder,
  getDeliveryOrderSummary,
  listDeliveryOrders,
  receiveDeliveryOrder,
  rejectDeliveryOrder,
  shipDeliveryOrder,
  updateDeliveryOrder
} from '../api/deliveryOrders'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const actioningId = ref<number | null>(null)

const items = ref<DeliveryOrderListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const status = ref<string | undefined>(undefined)
const customerId = ref<number | null>(null)

const summary = ref<any>(null)

const customerOptions = ref<Customer[]>([])
const customerSearching = ref(false)
const salesOrderOptions = ref<SalesOrderListItem[]>([])
const salesOrderSearching = ref(false)
const productOptions = ref<Product[]>([])
const productSearching = ref(false)
const productCache = ref<Record<number, Product>>({})

const detailOpen = ref(false)
const detail = ref<DeliveryOrderDetail | null>(null)

const editOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  sales_order: null as number | null,
  customer: null as number | null,
  delivery_date: '' as string | '',
  receiver_name: '',
  receiver_phone: '',
  delivery_address: '',
  logistics_company: '',
  tracking_number: '',
  freight: 0,
  package_count: 1,
  package_weight: 0,
  notes: '',
  items_data: [] as any[]
})

const shipOpen = ref(false)
const shipId = ref<number | null>(null)
const shipForm = reactive({
  logistics_company: '',
  tracking_number: ''
})

const receiveOpen = ref(false)
const receiveId = ref<number | null>(null)
const receiveNotes = ref('')

const rejectOpen = ref(false)
const rejectId = ref<number | null>(null)
const rejectReason = ref('')

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
  if (s === 'pending') return 'warning'
  if (s === 'shipped') return 'success'
  if (s === 'in_transit') return 'info'
  if (s === 'received') return 'success'
  if (s === 'rejected') return 'danger'
  if (s === 'returned') return 'danger'
  return 'info'
}

async function fetchSummary() {
  try {
    summary.value = await getDeliveryOrderSummary()
  } catch {
    summary.value = null
  }
}

async function fetchList() {
  loading.value = true
  try {
    const data = await listDeliveryOrders({
      page: page.value,
      page_size: pageSize.value,
      search: search.value || undefined,
      status: status.value || undefined,
      customer: customerId.value || undefined
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
    detail.value = await getDeliveryOrder(id)
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载详情失败'))
  }
}

function resetForm() {
  form.sales_order = null
  form.customer = null
  form.delivery_date = ''
  form.receiver_name = ''
  form.receiver_phone = ''
  form.delivery_address = ''
  form.logistics_company = ''
  form.tracking_number = ''
  form.freight = 0
  form.package_count = 1
  form.package_weight = 0
  form.notes = ''
  form.items_data = []
}

function addItemRow() {
  form.items_data.push({ product: null, quantity: 1, unit_price: 0, stock_batch: '', notes: '' })
}

function removeItemRow(index: number) {
  form.items_data.splice(index, 1)
}

function openCreate() {
  editing.value = false
  editingId.value = null
  resetForm()
  addItemRow()
  editOpen.value = true
}

async function openEdit(id: number) {
  editing.value = true
  editingId.value = id
  resetForm()
  editOpen.value = true
  try {
    const d = await getDeliveryOrder(id)
    form.sales_order = d.sales_order
    form.customer = d.customer
    form.delivery_date = (d.delivery_date || '') as any
    form.receiver_name = d.receiver_name || ''
    form.receiver_phone = d.receiver_phone || ''
    form.delivery_address = d.delivery_address || ''
    form.logistics_company = d.logistics_company || ''
    form.tracking_number = d.tracking_number || ''
    form.freight = Number(d.freight || 0)
    form.package_count = d.package_count || 1
    form.package_weight = Number(d.package_weight || 0)
    form.notes = d.notes || ''
    form.items_data =
      (d.items || []).map((it: any) => ({
        product: it.product,
        quantity: Number(it.quantity || 0) || 0,
        unit_price: Number(it.unit_price || 0) || 0,
        stock_batch: it.stock_batch || '',
        notes: it.notes || ''
      })) || []
    if (!form.items_data.length) addItemRow()
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

async function remoteSearchSalesOrders(query: string) {
  if (!query || !query.trim()) {
    salesOrderOptions.value = []
    return
  }
  salesOrderSearching.value = true
  try {
    const data = await listSalesOrders({ page: 1, page_size: 20, search: query.trim() })
    salesOrderOptions.value = data.results
  } catch {
    salesOrderOptions.value = []
  } finally {
    salesOrderSearching.value = false
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

async function save() {
  if (!form.sales_order) {
    ElMessage.warning('请选择销售订单')
    return
  }
  if (!form.customer) {
    ElMessage.warning('请选择客户')
    return
  }
  if (!form.receiver_name.trim() || !form.receiver_phone.trim() || !form.delivery_address.trim()) {
    ElMessage.warning('请填写收货人/电话/地址')
    return
  }
  const cleaned = form.items_data.filter((r) => !!r.product && Number(r.quantity) > 0)
  if (!cleaned.length) {
    ElMessage.warning('请至少添加 1 条明细')
    return
  }

  submitting.value = true
  try {
    const payload: any = {
      sales_order: form.sales_order,
      customer: form.customer,
      delivery_date: form.delivery_date || null,
      receiver_name: form.receiver_name,
      receiver_phone: form.receiver_phone,
      delivery_address: form.delivery_address,
      logistics_company: form.logistics_company || '',
      tracking_number: form.tracking_number || '',
      freight: Number(form.freight || 0),
      package_count: Number(form.package_count || 1),
      package_weight: form.package_weight ? Number(form.package_weight) : null,
      notes: form.notes || '',
      items_data: cleaned.map((r) => ({
        product: r.product,
        quantity: Number(r.quantity),
        unit_price: Number(r.unit_price || 0),
        stock_batch: r.stock_batch || '',
        notes: r.notes || ''
      }))
    }
    if (editing.value && editingId.value) {
      await updateDeliveryOrder(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await createDeliveryOrder(payload)
      ElMessage.success('已创建')
    }
    editOpen.value = false
    await fetchList()
    fetchSummary()
  } catch (err: any) {
    ElMessage.error(formatError(err, '保存失败'))
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该发货单？（仅待发货可删除）', '提示', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deleteDeliveryOrder(id)
    ElMessage.success('已删除')
    await fetchList()
    fetchSummary()
  } catch (err: any) {
    ElMessage.error(formatError(err, '删除失败'))
  } finally {
    deletingId.value = null
  }
}

function openShip(id: number) {
  shipId.value = id
  shipForm.logistics_company = ''
  shipForm.tracking_number = ''
  shipOpen.value = true
}

async function confirmShip() {
  if (!shipId.value) return
  actioningId.value = shipId.value
  submitting.value = true
  try {
    await shipDeliveryOrder(shipId.value, {
      logistics_company: shipForm.logistics_company || undefined,
      tracking_number: shipForm.tracking_number || undefined
    })
    ElMessage.success('发货成功')
    shipOpen.value = false
    await fetchList()
    fetchSummary()
  } catch (err: any) {
    ElMessage.error(formatError(err, '发货失败'))
  } finally {
    submitting.value = false
    actioningId.value = null
  }
}

function openReceive(id: number) {
  receiveId.value = id
  receiveNotes.value = ''
  receiveOpen.value = true
}

async function confirmReceive() {
  if (!receiveId.value) return
  actioningId.value = receiveId.value
  submitting.value = true
  try {
    await receiveDeliveryOrder(receiveId.value, receiveNotes.value ? { received_notes: receiveNotes.value } : {})
    ElMessage.success('签收成功')
    receiveOpen.value = false
    await fetchList()
    fetchSummary()
  } catch (err: any) {
    ElMessage.error(formatError(err, '签收失败'))
  } finally {
    submitting.value = false
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
    ElMessage.warning('请输入拒收原因')
    return
  }
  actioningId.value = rejectId.value
  submitting.value = true
  try {
    await rejectDeliveryOrder(rejectId.value, { reject_reason: rejectReason.value.trim() })
    ElMessage.success('已拒收，库存已回退')
    rejectOpen.value = false
    await fetchList()
    fetchSummary()
  } catch (err: any) {
    ElMessage.error(formatError(err, '拒收失败'))
  } finally {
    submitting.value = false
    actioningId.value = null
  }
}

function goHome() {
  router.push({ name: 'dashboard' })
}

onMounted(() => {
  fetchSummary()
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
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
</style>

