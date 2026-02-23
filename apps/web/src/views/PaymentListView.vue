<template>
  <ResourceList
    ref="listRef"
    title="收款记录（vNext）"
    :api="paymentListApi"
    :extra-params="extraParams"
    search-placeholder="搜索收款单号/客户"
    @create="openCreate"
  >
    <template #filters>
      <el-select v-model="method" size="small" clearable placeholder="方式" style="width: 140px" @change="reload">
        <el-option label="现金" value="cash" />
        <el-option label="转账" value="transfer" />
        <el-option label="支票" value="check" />
        <el-option label="承兑汇票" value="acceptance" />
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
    </template>

    <template #columns>
      <el-table-column prop="payment_number" label="收款单号" width="170" />
      <el-table-column label="客户" min-width="220">
        <template #default="{ row }">
          <span class="muted">{{ row.customer_name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="方式" width="120">
        <template #default="{ row }">
          <el-tag type="info">{{ row.payment_method_display || row.payment_method }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="金额" width="120" />
      <el-table-column prop="payment_date" label="日期" width="120" />
      <el-table-column label="关联" min-width="220">
        <template #default="{ row }">
          <span class="muted">
            {{ row.invoice_number ? `发票:${row.invoice_number}` : row.sales_order_number ? `销售单:${row.sales_order_number}` : '—' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" :loading="deletingId === row.id" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </template>
  </ResourceList>

  <el-dialog v-model="editOpen" title="新建收款" width="920px" :close-on-click-modal="false">
    <el-form :model="editForm" label-width="160px">
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
      <el-form-item label="关联发票">
        <el-select
          v-model="editForm.invoice"
          filterable
          remote
          clearable
          :remote-method="remoteSearchInvoices"
          :loading="invoiceSearching"
          placeholder="输入发票号/客户搜索"
          style="width: 100%"
        >
          <el-option v-for="i in invoiceOptions" :key="i.id" :label="`${i.invoice_number} - ${i.customer_name || ''}`" :value="i.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="金额" required>
        <el-input-number v-model="editForm.amount" :min="0.01" :precision="2" :step="1" :max="999999999.99" />
      </el-form-item>
      <el-form-item label="收款方式" required>
        <el-select v-model="editForm.payment_method" style="width: 220px">
          <el-option label="现金" value="cash" />
          <el-option label="转账" value="transfer" />
          <el-option label="支票" value="check" />
          <el-option label="承兑汇票" value="acceptance" />
        </el-select>
      </el-form-item>
      <el-form-item label="收款日期">
        <el-date-picker v-model="editForm.payment_date" type="date" value-format="YYYY-MM-DD" placeholder="默认今天" />
      </el-form-item>
      <el-form-item label="收款账户">
        <el-input v-model="editForm.bank_account" />
      </el-form-item>
      <el-form-item label="交易流水号">
        <el-input v-model="editForm.transaction_number" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="editForm.notes" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editOpen = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="savePayment">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ResourceList from './base/ResourceList.vue'
import type { Customer } from '../api/customers'
import { listCustomers } from '../api/customers'
import type { SalesOrderListItem } from '../api/salesOrders'
import { listSalesOrders } from '../api/salesOrders'
import type { Invoice } from '../api/invoices'
import { listInvoices } from '../api/invoices'
import { createPayment, deletePayment, listPayments } from '../api/payments'
import { formatError } from '../lib/formatError'

const submitting = ref(false)
const deletingId = ref<number | null>(null)

const method = ref<string | undefined>(undefined)
const customerId = ref<number | null>(null)

const listRef = ref<{ loadData: () => Promise<void>; handleSearch: () => void } | null>(null)

const customerOptions = ref<Customer[]>([])
const customerSearching = ref(false)
const salesOrderOptions = ref<SalesOrderListItem[]>([])
const salesOrderSearching = ref(false)
const invoiceOptions = ref<Invoice[]>([])
const invoiceSearching = ref(false)

const editOpen = ref(false)
const editForm = reactive({
  customer: null as number | null,
  sales_order: null as number | null,
  invoice: null as number | null,
  amount: 0,
  payment_method: 'transfer' as any,
  payment_date: '' as string | '',
  bank_account: '',
  transaction_number: '',
  notes: ''
})

const paymentListApi = {
  list: async (params: any) => listPayments(params)
}

const extraParams = () => ({
  customer: customerId.value || undefined,
  payment_method: method.value || undefined
})

function reload() {
  listRef.value?.handleSearch()
}

function resetForm() {
  editForm.customer = null
  editForm.sales_order = null
  editForm.invoice = null
  editForm.amount = 0
  editForm.payment_method = 'transfer'
  editForm.payment_date = ''
  editForm.bank_account = ''
  editForm.transaction_number = ''
  editForm.notes = ''
}

function openCreate() {
  resetForm()
  editOpen.value = true
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

async function remoteSearchInvoices(query: string) {
  if (!query || !query.trim()) {
    invoiceOptions.value = []
    return
  }
  invoiceSearching.value = true
  try {
    const data = await listInvoices({ page: 1, page_size: 20, search: query.trim() })
    invoiceOptions.value = data.results
  } catch {
    invoiceOptions.value = []
  } finally {
    invoiceSearching.value = false
  }
}

async function savePayment() {
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
    await createPayment({
      customer: editForm.customer,
      sales_order: editForm.sales_order || null,
      invoice: editForm.invoice || null,
      amount: Number(editForm.amount),
      payment_method: editForm.payment_method,
      payment_date: editForm.payment_date || undefined,
      bank_account: editForm.bank_account || '',
      transaction_number: editForm.transaction_number || '',
      notes: editForm.notes || ''
    })
    ElMessage.success('已创建')
    editOpen.value = false
    await listRef.value?.loadData()
  } catch (err: any) {
    ElMessage.error(formatError(err, '保存失败'))
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该收款记录？', '提示', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deletePayment(id)
    ElMessage.success('已删除')
    await listRef.value?.loadData()
  } catch (err: any) {
    ElMessage.error(formatError(err, '删除失败'))
  } finally {
    deletingId.value = null
  }
}
</script>

<style scoped>
.muted {
  color: #666;
  font-size: 12px;
}
</style>
