<template>
  <div class="page">
    <ResourceList
      ref="listRef"
      title="对账单（vNext）"
      :api="statementApi"
      search-placeholder="搜索对账单号/期间"
      @create="openCreate"
    >
      <template #actions>
        <el-button size="small" @click="openGenerate">生成预览</el-button>
      </template>

      <template #columns>
        <el-table-column prop="statement_number" label="对账单号" width="160" />
        <el-table-column prop="statement_type_display" label="类型" width="120" />
        <el-table-column prop="partner_name" label="对方单位" min-width="180" />
        <el-table-column prop="period" label="周期" width="110" />
        <el-table-column prop="opening_balance" label="期初" width="110" />
        <el-table-column prop="total_debit" label="借方" width="110" />
        <el-table-column prop="total_credit" label="贷方" width="110" />
        <el-table-column prop="closing_balance" label="期末" width="110" />
        <el-table-column prop="status_display" label="状态" width="110" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button size="small" :disabled="!canConfirm(row)" :loading="confirmingId === row.id" @click="handleConfirm(row.id)">
              确认
            </el-button>
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :loading="deletingId === row.id" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </template>
    </ResourceList>

    <el-dialog v-model="generateOpen" title="生成对账单预览" width="600px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="类型" required>
          <el-select v-model="generateType">
            <el-option label="客户" value="customer" />
            <el-option label="供应商" value="supplier" />
          </el-select>
        </el-form-item>
        <el-form-item :label="generateType === 'customer' ? '客户ID' : '供应商ID'" required>
          <el-input v-model="generatePartnerId" placeholder="请输入 ID" />
        </el-form-item>
        <el-form-item label="周期" required>
          <el-input v-model="generatePeriod" placeholder="YYYY-MM，例如 2026-02" />
        </el-form-item>
      </el-form>

      <el-alert v-if="generated" type="success" :closable="false" show-icon style="margin-bottom: 10px">
        <template #title>预览结果</template>
        <div>周期：{{ generated.period }}（{{ generated.start_date }} ~ {{ generated.end_date }}）</div>
        <div>期初：{{ generated.opening_balance }}；借方：{{ generated.total_debit }}；贷方：{{ generated.total_credit }}；期末：{{ generated.closing_balance }}</div>
      </el-alert>

      <template #footer>
        <el-button size="small" @click="generateOpen = false">关闭</el-button>
        <el-button size="small" type="primary" :loading="generating" @click="submitGenerate">生成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogOpen" :title="editing ? '编辑对账单' : '新建对账单'" width="650px" :close-on-click-modal="false">
      <el-form :model="form" label-width="110px">
        <el-form-item label="类型" required>
          <el-select v-model="form.statement_type">
            <el-option label="客户" value="customer" />
            <el-option label="供应商" value="supplier" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.statement_type === 'customer'" label="客户ID" required>
          <el-input v-model.number="form.customer" />
        </el-form-item>
        <el-form-item v-else label="供应商ID" required>
          <el-input v-model.number="form.supplier" />
        </el-form-item>
        <el-form-item label="周期" required>
          <el-input v-model="form.period" placeholder="YYYY-MM" />
        </el-form-item>
        <el-form-item label="日期范围" required>
          <el-date-picker v-model="dateRange" type="daterange" unlink-panels value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" />
        </el-form-item>
        <el-form-item label="期初余额">
          <el-input v-model="form.opening_balance" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ResourceList from './base/ResourceList.vue'
import { statementApi, type Statement, type StatementGenerateResult } from '../api/statements'

const submitting = ref(false)
const deletingId = ref<number | null>(null)
const confirmingId = ref<number | null>(null)
const listRef = ref<InstanceType<typeof ResourceList> | null>(null)

const dialogOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const dateRange = ref<[string, string] | null>(null)
const form = reactive({
  statement_type: 'customer' as Statement['statement_type'],
  customer: null as number | null,
  supplier: null as number | null,
  period: '',
  start_date: '',
  end_date: '',
  opening_balance: '0',
  notes: ''
})

const generateOpen = ref(false)
const generating = ref(false)
const generateType = ref<'customer' | 'supplier'>('customer')
const generatePartnerId = ref('')
const generatePeriod = ref('')
const generated = ref<StatementGenerateResult | null>(null)

function resetForm() {
  form.statement_type = 'customer'
  form.customer = null
  form.supplier = null
  form.period = ''
  form.start_date = ''
  form.end_date = ''
  form.opening_balance = '0'
  form.notes = ''
  dateRange.value = null
}

async function fetchList() {
  await listRef.value?.loadData()
}

function openCreate() {
  editing.value = false
  editingId.value = null
  resetForm()
  dialogOpen.value = true
}

function openEdit(row: Statement) {
  editing.value = true
  editingId.value = row.id
  form.statement_type = row.statement_type
  form.customer = (row.customer as number) || null
  form.supplier = (row.supplier as number) || null
  form.period = row.period || ''
  form.start_date = row.start_date || ''
  form.end_date = row.end_date || ''
  form.opening_balance = String(row.opening_balance ?? '0')
  form.notes = row.notes || ''
  dateRange.value = row.start_date && row.end_date ? [row.start_date, row.end_date] : null
  dialogOpen.value = true
}

async function submit() {
  const [start, end] = dateRange.value || []
  form.start_date = start || ''
  form.end_date = end || ''

  if (!form.period.trim() || !form.start_date || !form.end_date) {
    ElMessage.warning('请填写周期与日期范围')
    return
  }
  if (form.statement_type === 'customer' && !form.customer) {
    ElMessage.warning('请填写客户ID')
    return
  }
  if (form.statement_type === 'supplier' && !form.supplier) {
    ElMessage.warning('请填写供应商ID')
    return
  }

  submitting.value = true
  try {
    if (editing.value && editingId.value) {
      await statementApi.update(editingId.value, { ...form })
      ElMessage.success('已保存')
    } else {
      await statementApi.create({ ...form })
      ElMessage.success('已创建')
    }
    dialogOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.response?.data?.detail || err?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该对账单？', '提示', { type: 'warning' })
  } catch {
    return
  }

  deletingId.value = id
  try {
    await statementApi.delete(id)
    ElMessage.success('已删除')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '删除失败')
  } finally {
    deletingId.value = null
  }
}

function canConfirm(row: Statement) {
  return row.status === 'draft' || row.status === 'sent'
}

async function handleConfirm(id: number) {
  let notes = ''
  try {
    const res = await ElMessageBox.prompt('确认备注（可选）', '确认对账单', {
      inputValue: '',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    notes = res.value || ''
  } catch {
    return
  }

  confirmingId.value = id
  try {
    await statementApi.confirm(id, { confirmed: true, confirm_notes: notes })
    ElMessage.success('已确认')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '确认失败')
  } finally {
    confirmingId.value = null
  }
}

function openGenerate() {
  generateType.value = 'customer'
  generatePartnerId.value = ''
  generatePeriod.value = ''
  generated.value = null
  generateOpen.value = true
}

async function submitGenerate() {
  if (!generatePeriod.value.trim() || !generatePartnerId.value.trim()) {
    ElMessage.warning('请填写周期与 ID')
    return
  }
  const id = Number(generatePartnerId.value)
  if (!Number.isFinite(id) || id <= 0) {
    ElMessage.warning('ID 格式不正确')
    return
  }

  generating.value = true
  try {
    const params: any = { period: generatePeriod.value.trim() }
    if (generateType.value === 'customer') params.customer = id
    else params.supplier = id
    generated.value = await statementApi.generate(params)
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '生成失败')
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.page {
  padding: 0;
}
</style>

