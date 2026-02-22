<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">发票管理（vNext）</div>
      </div>
      <div class="right">
        <el-select v-model="status" size="small" clearable placeholder="状态" style="width: 140px" @change="reload">
          <el-option label="待开具" value="draft" />
          <el-option label="已开具" value="issued" />
          <el-option label="已收到" value="received" />
          <el-option label="已作废" value="cancelled" />
          <el-option label="已红冲" value="refunded" />
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
          placeholder="搜索发票号/客户"
          style="width: 260px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="invoice_number" label="发票号码" width="170" />
        <el-table-column label="客户" min-width="220">
          <template #default="{ row }">
            <span class="muted">{{ row.customer_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="140">
          <template #default="{ row }">
            <el-tag type="info">{{ row.invoice_type_display || row.invoice_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status_display || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="110" />
        <el-table-column prop="tax_rate" label="税率(%)" width="110" />
        <el-table-column prop="total_amount" label="价税合计" width="120" />
        <el-table-column prop="issue_date" label="开票日期" width="120" />
        <el-table-column label="操作" width="330" fixed="right">
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
            <el-button size="small" type="success" :disabled="row.status !== 'issued'" :loading="actioningId === row.id" @click="handleApprove(row.id)">
              审核通过
            </el-button>
            <el-button size="small" :disabled="row.status !== 'issued'" :loading="actioningId === row.id" @click="openCancel(row.id)">
              作废
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

    <el-drawer v-model="detailOpen" title="发票详情" size="720px">
      <div v-if="detail" class="detail">
        <div class="detail-line">
          <div><b>发票号：</b>{{ detail.invoice_number }}</div>
          <div><b>状态：</b><el-tag :type="statusTagType(detail.status)">{{ detail.status_display || detail.status }}</el-tag></div>
        </div>
        <div class="detail-line">
          <div><b>客户：</b>{{ detail.customer_name }}</div>
          <div><b>类型：</b>{{ detail.invoice_type_display || detail.invoice_type }}</div>
        </div>
        <div class="detail-line">
          <div><b>金额：</b>{{ detail.amount }}</div>
          <div><b>税率：</b>{{ detail.tax_rate }}%</div>
          <div><b>税额：</b>{{ detail.tax_amount }}</div>
          <div><b>价税合计：</b>{{ detail.total_amount }}</div>
        </div>
        <div class="detail-line">
          <div><b>开票日期：</b>{{ detail.issue_date || '—' }}</div>
          <div><b>关联销售单：</b>{{ detail.sales_order_number || '—' }}</div>
        </div>
        <div class="detail-line">
          <div><b>备注：</b><span class="muted">{{ detail.notes || '—' }}</span></div>
        </div>
      </div>
      <div v-else class="muted">加载中…</div>
    </el-drawer>

    <el-dialog v-model="editOpen" :title="editing ? '编辑发票' : '新建发票'" width="980px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="160px">
        <el-form-item label="发票类型" required>
          <el-select v-model="editForm.invoice_type" style="width: 260px">
            <el-option label="增值税专票" value="vat_special" />
            <el-option label="增值税普票" value="vat_normal" />
            <el-option label="电子发票" value="electronic" />
          </el-select>
        </el-form-item>
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
        <el-form-item label="关联销售订单">
          <el-select
            v-model="editForm.sales_order"
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
        <el-form-item label="金额(不含税)" required>
          <el-input-number v-model="editForm.amount" :min="0.01" :precision="2" :step="1" :max="999999999.99" />
        </el-form-item>
        <el-form-item label="税率(%)">
          <el-input-number v-model="editForm.tax_rate" :min="0" :max="100" :precision="2" :step="0.5" />
        </el-form-item>
        <el-form-item label="开票日期">
          <el-date-picker v-model="editForm.issue_date" type="date" value-format="YYYY-MM-DD" placeholder="可选" />
        </el-form-item>
        <el-form-item label="客户税号">
          <el-input v-model="editForm.customer_tax_number" />
        </el-form-item>
        <el-form-item label="客户地址">
          <el-input v-model="editForm.customer_address" />
        </el-form-item>
        <el-form-item label="客户电话">
          <el-input v-model="editForm.customer_phone" />
        </el-form-item>
        <el-form-item label="开户行">
          <el-input v-model="editForm.customer_bank" />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="editForm.customer_account" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveInvoice">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cancelOpen" title="作废原因" width="520px" :close-on-click-modal="false">
      <el-input v-model="cancelReason" type="textarea" :rows="3" placeholder="请输入作废原因" />
      <template #footer>
        <el-button @click="cancelOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmCancel">确定</el-button>
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
import type { SalesOrderListItem } from '../api/salesOrders'
import { listSalesOrders } from '../api/salesOrders'
import type { Invoice } from '../api/invoices'
import { approveInvoice, createInvoice, deleteInvoice, getInvoice, listInvoices, submitInvoice, updateInvoice } from '../api/invoices'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const actioningId = ref<number | null>(null)

const items = ref<Invoice[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const status = ref<string | undefined>(undefined)
const customerId = ref<number | null>(null)

const customerOptions = ref<Customer[]>([])
const customerSearching = ref(false)
const salesOrderOptions = ref<SalesOrderListItem[]>([])
const salesOrderSearching = ref(false)

const detailOpen = ref(false)
const detail = ref<Invoice | null>(null)

const editOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const editForm = reactive({
  invoice_type: 'vat_normal' as any,
  customer: null as number | null,
  sales_order: null as number | null,
  amount: 0,
  tax_rate: 13,
  issue_date: '' as string | '',
  customer_tax_number: '',
  customer_address: '',
  customer_phone: '',
  customer_bank: '',
  customer_account: '',
  notes: ''
})

const cancelOpen = ref(false)
const cancelId = ref<number | null>(null)
const cancelReason = ref('')

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
  if (s === 'issued') return 'warning'
  if (s === 'received') return 'success'
  if (s === 'cancelled') return 'danger'
  if (s === 'refunded') return 'danger'
  return 'info'
}

async function fetchList() {
  loading.value = true
  try {
    const data = await listInvoices({
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
    detail.value = await getInvoice(id)
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载详情失败'))
  }
}

function resetForm() {
  editForm.invoice_type = 'vat_normal'
  editForm.customer = null
  editForm.sales_order = null
  editForm.amount = 0
  editForm.tax_rate = 13
  editForm.issue_date = ''
  editForm.customer_tax_number = ''
  editForm.customer_address = ''
  editForm.customer_phone = ''
  editForm.customer_bank = ''
  editForm.customer_account = ''
  editForm.notes = ''
}

function openCreate() {
  editing.value = false
  editingId.value = null
  resetForm()
  editOpen.value = true
}

async function openEdit(id: number) {
  editing.value = true
  editingId.value = id
  resetForm()
  editOpen.value = true
  try {
    const d = await getInvoice(id)
    editForm.invoice_type = d.invoice_type as any
    editForm.customer = d.customer
    editForm.sales_order = (d.sales_order ?? null) as any
    editForm.amount = Number(d.amount || 0)
    editForm.tax_rate = Number(d.tax_rate || 0)
    editForm.issue_date = (d.issue_date || '') as any
    editForm.customer_tax_number = d.customer_tax_number || ''
    editForm.customer_address = d.customer_address || ''
    editForm.customer_phone = d.customer_phone || ''
    editForm.customer_bank = d.customer_bank || ''
    editForm.customer_account = d.customer_account || ''
    editForm.notes = d.notes || ''
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

async function saveInvoice() {
  if (!editForm.customer) {
    ElMessage.warning('请选择客户')
    return
  }
  if (Number(editForm.amount || 0) <= 0) {
    ElMessage.warning('金额必须大于 0')
    return
  }
  submitting.value = true
  try {
    const payload: any = {
      invoice_type: editForm.invoice_type,
      customer: editForm.customer,
      sales_order: editForm.sales_order || null,
      amount: Number(editForm.amount),
      tax_rate: Number(editForm.tax_rate || 0),
      issue_date: editForm.issue_date || null,
      customer_tax_number: editForm.customer_tax_number || '',
      customer_address: editForm.customer_address || '',
      customer_phone: editForm.customer_phone || '',
      customer_bank: editForm.customer_bank || '',
      customer_account: editForm.customer_account || '',
      notes: editForm.notes || ''
    }
    if (editing.value && editingId.value) {
      await updateInvoice(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await createInvoice(payload)
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
    await ElMessageBox.confirm('确认删除该发票？（仅草稿可删除）', '提示', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deleteInvoice(id)
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
    await submitInvoice(id)
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
    await approveInvoice(id, { approved: true })
    ElMessage.success('审核通过')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '审核失败'))
  } finally {
    actioningId.value = null
  }
}

function openCancel(id: number) {
  cancelId.value = id
  cancelReason.value = ''
  cancelOpen.value = true
}

async function confirmCancel() {
  if (!cancelId.value) return
  if (!cancelReason.value.trim()) {
    ElMessage.warning('请输入作废原因')
    return
  }
  submitting.value = true
  try {
    await approveInvoice(cancelId.value, { approved: false, approval_comment: cancelReason.value.trim() })
    ElMessage.success('已作废')
    cancelOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '作废失败'))
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
.detail {
  padding: 6px 0;
}
.detail-line {
  display: flex;
  gap: 18px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
</style>

