<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">成品库存（vNext）</div>
      </div>
      <div class="right">
        <el-select
          v-model="productId"
          size="small"
          clearable
          filterable
          remote
          :remote-method="remoteSearchProducts"
          :loading="productSearching"
          placeholder="产品"
          style="width: 220px"
          @change="reload"
        >
          <el-option v-for="p in productOptions" :key="p.id" :label="`${p.code} - ${p.name}`" :value="p.id" />
        </el-select>
        <el-select v-model="status" size="small" clearable placeholder="状态" style="width: 140px" @change="reload">
          <el-option label="在库" value="in_stock" />
          <el-option label="已出库" value="out_stock" />
          <el-option label="已过期" value="expired" />
          <el-option label="已损坏" value="damaged" />
        </el-select>
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索批次/库位/产品"
          style="width: 260px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
      </div>
    </div>

    <el-card>
      <div class="summary" v-if="summary">
        <el-tag type="info">总数量：{{ summary.total_quantity }}</el-tag>
        <el-tag type="warning">低库存：{{ summary.low_stock_count }}</el-tag>
        <el-tag type="danger">已过期：{{ summary.expired_count }}</el-tag>
        <el-tag type="success">产品数：{{ summary.total_products }}</el-tag>
      </div>

      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column label="产品" min-width="220">
          <template #default="{ row }">
            <span class="muted">{{ row.product_code }} - {{ row.product_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="batch_no" label="批次" width="160" />
        <el-table-column prop="location" label="库位" width="120" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.is_expired ? 'danger' : row.is_low_stock ? 'warning' : 'info'">
              {{ row.status_display || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="库存" width="110" />
        <el-table-column prop="reserved_quantity" label="预留" width="110" />
        <el-table-column prop="available_quantity" label="可用" width="110" />
        <el-table-column prop="min_stock_level" label="最小库存" width="110" />
        <el-table-column prop="unit_cost" label="单位成本" width="110" />
        <el-table-column prop="total_value" label="总价值" width="110" />
        <el-table-column label="有效期" width="150">
          <template #default="{ row }">
            <span class="muted">{{ row.expiry_date || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openAdjust(row)">调整</el-button>
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
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

    <el-dialog v-model="adjustOpen" title="库存调整" width="620px" :close-on-click-modal="false">
      <div v-if="adjustTarget" class="muted">
        {{ adjustTarget.product_code }} - {{ adjustTarget.product_name }}（当前库存：{{ adjustTarget.quantity }}）
      </div>
      <el-form :model="adjustForm" label-width="140px" style="margin-top: 10px">
        <el-form-item label="调整类型" required>
          <el-select v-model="adjustForm.adjust_type" style="width: 200px">
            <el-option label="增加" value="add" />
            <el-option label="减少" value="subtract" />
            <el-option label="设置为" value="set" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" required>
          <el-input-number v-model="adjustForm.quantity" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="原因" required>
          <el-input v-model="adjustForm.reason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmAdjust">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editOpen" title="编辑库存" width="760px" :close-on-click-modal="false">
      <div v-if="editTarget" class="muted">
        {{ editTarget.product_code }} - {{ editTarget.product_name }}（批次：{{ editTarget.batch_no || '—' }}）
      </div>
      <el-form :model="editForm" label-width="140px" style="margin-top: 10px">
        <el-form-item label="预留数量">
          <el-input-number v-model="editForm.reserved_quantity" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="最小库存">
          <el-input-number v-model="editForm.min_stock_level" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="单位成本">
          <el-input-number v-model="editForm.unit_cost" :min="0" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="库位">
          <el-input v-model="editForm.location" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" style="width: 200px">
            <el-option label="在库" value="in_stock" />
            <el-option label="已出库" value="out_stock" />
            <el-option label="已过期" value="expired" />
            <el-option label="已损坏" value="damaged" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Product } from '../api/products'
import { listProducts } from '../api/products'
import type { ProductStock } from '../api/productStocks'
import { adjustProductStock, getProductStockSummary, listProductStocks, updateProductStock } from '../api/productStocks'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)

const items = ref<ProductStock[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const productId = ref<number | null>(null)
const status = ref<string | undefined>(undefined)

const summary = ref<any>(null)

const productOptions = ref<Product[]>([])
const productSearching = ref(false)

const adjustOpen = ref(false)
const adjustTarget = ref<ProductStock | null>(null)
const adjustForm = reactive({
  adjust_type: 'add' as 'add' | 'subtract' | 'set',
  quantity: 0,
  reason: ''
})

const editOpen = ref(false)
const editTarget = ref<ProductStock | null>(null)
const editForm = reactive({
  reserved_quantity: 0,
  min_stock_level: 0,
  unit_cost: 0,
  location: '',
  status: 'in_stock',
  notes: ''
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

async function fetchSummary() {
  try {
    summary.value = await getProductStockSummary()
  } catch {
    summary.value = null
  }
}

async function fetchList() {
  loading.value = true
  try {
    const data = await listProductStocks({
      page: page.value,
      page_size: pageSize.value,
      search: search.value || undefined,
      product: productId.value || undefined,
      status: status.value || undefined,
      batch_number: undefined
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

function openAdjust(row: ProductStock) {
  adjustTarget.value = row
  adjustForm.adjust_type = 'add'
  adjustForm.quantity = 0
  adjustForm.reason = ''
  adjustOpen.value = true
}

async function confirmAdjust() {
  if (!adjustTarget.value) return
  if (!adjustForm.reason.trim()) {
    ElMessage.warning('请填写原因')
    return
  }
  submitting.value = true
  try {
    await adjustProductStock(adjustTarget.value.id, {
      adjust_type: adjustForm.adjust_type,
      quantity: Number(adjustForm.quantity || 0),
      reason: adjustForm.reason.trim()
    })
    ElMessage.success('调整成功')
    adjustOpen.value = false
    await fetchList()
    fetchSummary()
  } catch (err: any) {
    ElMessage.error(formatError(err, '调整失败'))
  } finally {
    submitting.value = false
  }
}

function openEdit(row: ProductStock) {
  editTarget.value = row
  editForm.reserved_quantity = Number(row.reserved_quantity || 0)
  editForm.min_stock_level = Number(row.min_stock_level || 0)
  editForm.unit_cost = Number(row.unit_cost || 0)
  editForm.location = row.location || ''
  editForm.status = (row.status || 'in_stock') as any
  editForm.notes = row.notes || ''
  editOpen.value = true
}

async function confirmEdit() {
  if (!editTarget.value) return
  submitting.value = true
  try {
    await updateProductStock(editTarget.value.id, { ...editForm })
    ElMessage.success('已保存')
    editOpen.value = false
    await fetchList()
    fetchSummary()
  } catch (err: any) {
    ElMessage.error(formatError(err, '保存失败'))
  } finally {
    submitting.value = false
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
  font-size: 12px;
}
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
</style>

