<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">质量检验（vNext）</div>
      </div>
      <div class="right">
        <el-select v-model="type" size="small" clearable placeholder="类型" style="width: 140px" @change="reload">
          <el-option label="来料" value="incoming" />
          <el-option label="过程" value="process" />
          <el-option label="成品" value="final" />
          <el-option label="客诉" value="customer" />
        </el-select>
        <el-select v-model="result" size="small" clearable placeholder="结果" style="width: 140px" @change="reload">
          <el-option label="待检验" value="pending" />
          <el-option label="合格" value="passed" />
          <el-option label="不合格" value="failed" />
          <el-option label="条件接收" value="conditional" />
        </el-select>
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索质检单号/批次/产品"
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
        <el-tag type="info">总检验量：{{ summary.summary?.total_quantity ?? '-' }}</el-tag>
        <el-tag type="success">总合格：{{ summary.summary?.total_passed ?? '-' }}</el-tag>
        <el-tag type="danger">总不合格：{{ summary.summary?.total_failed ?? '-' }}</el-tag>
        <el-tag type="warning">平均不良率：{{ summary.summary?.avg_defective_rate ?? '-' }}</el-tag>
      </div>

      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="inspection_number" label="质检单号" width="170" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ row.inspection_type_display || row.inspection_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="施工单" width="170">
          <template #default="{ row }">
            <span class="muted">{{ row.work_order_number || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品" min-width="200">
          <template #default="{ row }">
            <span class="muted">{{ row.product_name || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="batch_no" label="批次" width="160" />
        <el-table-column prop="inspection_date" label="日期" width="120" />
        <el-table-column label="结果" width="120">
          <template #default="{ row }">
            <el-tag :type="resultTagType(row.result)">{{ row.result_display || row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量(检/合/不)" width="160">
          <template #default="{ row }">
            <span class="muted">{{ row.inspection_quantity || 0 }}/{{ row.passed_quantity || 0 }}/{{ row.failed_quantity || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="不良率" width="120">
          <template #default="{ row }">
            <span class="muted">{{ row.defective_rate_formatted || row.defective_rate || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row.id)">详情</el-button>
            <el-button size="small" @click="openEdit(row.id)">编辑</el-button>
            <el-button size="small" type="danger" :loading="deletingId === row.id" @click="handleDelete(row.id)">删除</el-button>
            <el-divider direction="vertical" />
            <el-button size="small" type="primary" :disabled="row.result !== 'pending'" :loading="actioningId === row.id" @click="openComplete(row)">
              完成检验
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

    <el-drawer v-model="detailOpen" title="质检详情" size="820px">
      <div v-if="detail" class="detail">
        <div class="detail-line">
          <div><b>单号：</b>{{ detail.inspection_number }}</div>
          <div><b>结果：</b><el-tag :type="resultTagType(detail.result)">{{ detail.result_display || detail.result }}</el-tag></div>
        </div>
        <div class="detail-line">
          <div><b>类型：</b>{{ detail.inspection_type_display || detail.inspection_type }}</div>
          <div><b>日期：</b>{{ detail.inspection_date }}</div>
        </div>
        <div class="detail-line">
          <div><b>施工单：</b>{{ detail.work_order_number || '—' }}</div>
          <div><b>产品：</b>{{ detail.product_name || '—' }}</div>
        </div>
        <div class="detail-line">
          <div><b>批次：</b>{{ detail.batch_no || '—' }}</div>
        </div>
        <div class="detail-line">
          <div><b>数量：</b>{{ detail.inspection_quantity || 0 }}/{{ detail.passed_quantity || 0 }}/{{ detail.failed_quantity || 0 }}</div>
          <div><b>不良率：</b>{{ detail.defective_rate_formatted || detail.defective_rate || '—' }}</div>
        </div>
        <div class="detail-line">
          <div><b>缺陷描述：</b><span class="muted">{{ detail.defect_description || '—' }}</span></div>
        </div>
        <div class="detail-line">
          <div><b>处理意见：</b><span class="muted">{{ detail.disposition || '—' }}</span></div>
        </div>
        <div class="detail-line">
          <div><b>备注：</b><span class="muted">{{ detail.notes || '—' }}</span></div>
        </div>
      </div>
      <div v-else class="muted">加载中…</div>
    </el-drawer>

    <el-dialog v-model="editOpen" :title="editing ? '编辑质检' : '新建质检'" width="980px" :close-on-click-modal="false">
      <el-form :model="form" label-width="160px">
        <el-form-item label="检验类型" required>
          <el-select v-model="form.inspection_type" style="width: 220px">
            <el-option label="来料" value="incoming" />
            <el-option label="过程" value="process" />
            <el-option label="成品" value="final" />
            <el-option label="客诉" value="customer" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联施工单">
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
        <el-form-item label="产品">
          <el-select
            v-model="form.product"
            filterable
            remote
            clearable
            :remote-method="remoteSearchProducts"
            :loading="productSearching"
            placeholder="输入名称/编码搜索"
            style="width: 100%"
          >
            <el-option v-for="p in productOptions" :key="p.id" :label="`${p.code} - ${p.name}`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="form.batch_no" />
        </el-form-item>
        <el-form-item label="检验日期">
          <el-date-picker v-model="form.inspection_date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="检验数量">
          <el-input-number v-model="form.inspection_quantity" :min="0" :precision="0" :step="1" />
        </el-form-item>
        <el-form-item label="合格数量">
          <el-input-number v-model="form.passed_quantity" :min="0" :precision="0" :step="1" />
        </el-form-item>
        <el-form-item label="不合格数量">
          <el-input-number v-model="form.failed_quantity" :min="0" :precision="0" :step="1" />
        </el-form-item>
        <el-form-item label="检验标准">
          <el-input v-model="form.inspection_standard" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="缺陷描述">
          <el-input v-model="form.defect_description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="处理意见">
          <el-select v-model="form.disposition" clearable placeholder="可选" style="width: 220px">
            <el-option label="接收" value="accept" />
            <el-option label="返工" value="rework" />
            <el-option label="报废" value="scrap" />
            <el-option label="退货" value="return" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="form.disposition_notes" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeOpen" title="完成检验" width="620px" :close-on-click-modal="false">
      <div v-if="completeTarget" class="muted">
        {{ completeTarget.inspection_number }}（检验数量：{{ completeTarget.inspection_quantity || 0 }}）
      </div>
      <el-form :model="completeForm" label-width="160px" style="margin-top: 10px">
        <el-form-item label="检验结果" required>
          <el-select v-model="completeForm.result" style="width: 220px">
            <el-option label="合格" value="passed" />
            <el-option label="不合格" value="failed" />
            <el-option label="条件接收" value="conditional" />
          </el-select>
        </el-form-item>
        <el-form-item label="合格数量" required>
          <el-input-number v-model="completeForm.passed_quantity" :min="0" :precision="0" :step="1" />
        </el-form-item>
        <el-form-item label="不合格数量" required>
          <el-input-number v-model="completeForm.failed_quantity" :min="0" :precision="0" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmComplete">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Product } from '../api/products'
import { listProducts } from '../api/products'
import type { WorkOrderListItem } from '../api/workorders'
import { listWorkOrders } from '../api/workorders'
import type { QualityInspection } from '../api/qualityInspections'
import {
  completeQualityInspection,
  createQualityInspection,
  deleteQualityInspection,
  getQualityInspection,
  getQualityInspectionSummary,
  listQualityInspections,
  updateQualityInspection
} from '../api/qualityInspections'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const actioningId = ref<number | null>(null)

const items = ref<QualityInspection[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const type = ref<string | undefined>(undefined)
const result = ref<string | undefined>(undefined)

const summary = ref<any>(null)

const detailOpen = ref(false)
const detail = ref<QualityInspection | null>(null)

const editOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const productOptions = ref<Product[]>([])
const productSearching = ref(false)

const workOrderOptions = ref<WorkOrderListItem[]>([])
const workOrderSearching = ref(false)

const form = reactive({
  inspection_type: 'incoming',
  work_order: null as number | null,
  product: null as number | null,
  batch_no: '',
  inspection_date: '' as string | '',
  inspection_quantity: 0,
  passed_quantity: 0,
  failed_quantity: 0,
  inspection_standard: '',
  defect_description: '',
  disposition: '' as any,
  disposition_notes: '',
  notes: ''
})

const completeOpen = ref(false)
const completeTarget = ref<QualityInspection | null>(null)
const completeForm = reactive({
  result: 'passed' as any,
  passed_quantity: 0,
  failed_quantity: 0
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

function resultTagType(r: string) {
  if (r === 'pending') return 'warning'
  if (r === 'passed') return 'success'
  if (r === 'conditional') return 'info'
  if (r === 'failed') return 'danger'
  return 'info'
}

async function fetchSummary() {
  try {
    summary.value = await getQualityInspectionSummary()
  } catch {
    summary.value = null
  }
}

async function fetchList() {
  loading.value = true
  try {
    const data = await listQualityInspections({
      page: page.value,
      page_size: pageSize.value,
      search: search.value || undefined,
      type: type.value || undefined,
      result: result.value || undefined
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
    detail.value = await getQualityInspection(id)
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载详情失败'))
  }
}

function resetForm() {
  form.inspection_type = 'incoming'
  form.work_order = null
  form.product = null
  form.batch_no = ''
  form.inspection_date = ''
  form.inspection_quantity = 0
  form.passed_quantity = 0
  form.failed_quantity = 0
  form.inspection_standard = ''
  form.defect_description = ''
  form.disposition = ''
  form.disposition_notes = ''
  form.notes = ''
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
    const d = await getQualityInspection(id)
    form.inspection_type = d.inspection_type as any
    form.work_order = (d.work_order ?? null) as any
    form.product = (d.product ?? null) as any
    form.batch_no = d.batch_no || ''
    form.inspection_date = (d.inspection_date || '') as any
    form.inspection_quantity = d.inspection_quantity || 0
    form.passed_quantity = d.passed_quantity || 0
    form.failed_quantity = d.failed_quantity || 0
    form.inspection_standard = d.inspection_standard || ''
    form.defect_description = d.defect_description || ''
    form.disposition = (d.disposition || '') as any
    form.disposition_notes = d.disposition_notes || ''
    form.notes = d.notes || ''
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载失败'))
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
  } catch {
    productOptions.value = []
  } finally {
    productSearching.value = false
  }
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

async function save() {
  if (!form.inspection_type) {
    ElMessage.warning('请选择检验类型')
    return
  }
  if (form.failed_quantity > form.inspection_quantity) {
    ElMessage.warning('不合格数量不能超过检验数量')
    return
  }
  if (form.passed_quantity + form.failed_quantity > form.inspection_quantity) {
    ElMessage.warning('合格+不合格之和不能超过检验数量')
    return
  }

  submitting.value = true
  try {
    const payload: any = {
      inspection_type: form.inspection_type,
      work_order: form.work_order || null,
      product: form.product || null,
      batch_no: form.batch_no || '',
      inspection_date: form.inspection_date || undefined,
      inspection_quantity: Number(form.inspection_quantity || 0),
      passed_quantity: Number(form.passed_quantity || 0),
      failed_quantity: Number(form.failed_quantity || 0),
      inspection_standard: form.inspection_standard || '',
      defect_description: form.defect_description || '',
      disposition: form.disposition || '',
      disposition_notes: form.disposition_notes || '',
      notes: form.notes || ''
    }
    if (editing.value && editingId.value) {
      await updateQualityInspection(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await createQualityInspection(payload)
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
    await ElMessageBox.confirm('确认删除该质检记录？', '提示', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deleteQualityInspection(id)
    ElMessage.success('已删除')
    await fetchList()
    fetchSummary()
  } catch (err: any) {
    ElMessage.error(formatError(err, '删除失败'))
  } finally {
    deletingId.value = null
  }
}

function openComplete(row: QualityInspection) {
  completeTarget.value = row
  const qty = Number(row.inspection_quantity || 0)
  completeForm.result = 'passed'
  completeForm.passed_quantity = qty
  completeForm.failed_quantity = 0
  completeOpen.value = true
}

async function confirmComplete() {
  if (!completeTarget.value) return
  const qty = Number(completeTarget.value.inspection_quantity || 0)
  if (completeForm.passed_quantity + completeForm.failed_quantity > qty) {
    ElMessage.warning('合格+不合格之和不能超过检验数量')
    return
  }
  actioningId.value = completeTarget.value.id
  submitting.value = true
  try {
    await completeQualityInspection(completeTarget.value.id, {
      result: completeForm.result,
      passed_quantity: Number(completeForm.passed_quantity || 0),
      failed_quantity: Number(completeForm.failed_quantity || 0)
    })
    ElMessage.success('已完成检验')
    completeOpen.value = false
    await fetchList()
    fetchSummary()
  } catch (err: any) {
    ElMessage.error(formatError(err, '操作失败'))
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
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
</style>

