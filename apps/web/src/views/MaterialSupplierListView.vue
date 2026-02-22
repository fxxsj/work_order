<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">物料-供应商（vNext）</div>
      </div>
      <div class="right">
        <el-select
          v-model="filters.material"
          size="small"
          clearable
          filterable
          remote
          :remote-method="remoteSearchMaterials"
          :loading="materialSearching"
          placeholder="物料"
          style="width: 200px"
        >
          <el-option v-for="m in materialOptions" :key="m.id" :label="`${m.code} - ${m.name}`" :value="m.id" />
        </el-select>
        <el-select
          v-model="filters.supplier"
          size="small"
          clearable
          filterable
          remote
          :remote-method="remoteSearchSuppliers"
          :loading="supplierSearching"
          placeholder="供应商"
          style="width: 200px"
        >
          <el-option v-for="s in supplierOptions" :key="s.id" :label="`${s.code} - ${s.name}`" :value="s.id" />
        </el-select>
        <el-select v-model="filters.is_preferred" size="small" clearable placeholder="首选" style="width: 110px" @change="reload">
          <el-option label="是" :value="true" />
          <el-option label="否" :value="false" />
        </el-select>
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column label="物料" min-width="220">
          <template #default="{ row }">
            <span class="muted">{{ materialLabel(row.material) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="供应商" min-width="220">
          <template #default="{ row }">
            <span class="muted">{{ supplierLabel(row.supplier) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplier_code" label="供应商物料编码" width="160" />
        <el-table-column prop="supplier_price" label="供应商单价" width="120" />
        <el-table-column prop="min_order_quantity" label="起订量" width="110" />
        <el-table-column prop="lead_time_days" label="周期(天)" width="110" />
        <el-table-column label="首选" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.is_preferred" type="success">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :loading="deletingId === row.id" @click="handleDelete(row.id)">
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

    <el-dialog v-model="dialogOpen" :title="editing ? '编辑关联' : '新建关联'" width="760px" :close-on-click-modal="false">
      <el-form :model="form" label-width="160px">
        <el-form-item label="物料" required>
          <el-select
            v-model="form.material"
            filterable
            remote
            :remote-method="remoteSearchMaterials"
            :loading="materialSearching"
            placeholder="输入名称/编码搜索"
            style="width: 100%"
          >
            <el-option v-for="m in materialOptions" :key="m.id" :label="`${m.code} - ${m.name}`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" required>
          <el-select
            v-model="form.supplier"
            filterable
            remote
            :remote-method="remoteSearchSuppliers"
            :loading="supplierSearching"
            placeholder="输入名称/编码搜索"
            style="width: 100%"
          >
            <el-option v-for="s in supplierOptions" :key="s.id" :label="`${s.code} - ${s.name}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商物料编码">
          <el-input v-model="form.supplier_code" />
        </el-form-item>
        <el-form-item label="供应商单价" required>
          <el-input-number v-model="form.supplier_price" :min="0" :precision="2" :step="0.1" :max="999999999.99" />
        </el-form-item>
        <el-form-item label="首选供应商">
          <el-switch v-model="form.is_preferred" />
        </el-form-item>
        <el-form-item label="最小起订量">
          <el-input-number v-model="form.min_order_quantity" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="采购周期（天）">
          <el-input-number v-model="form.lead_time_days" :min="0" :max="365" />
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
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { MaterialSupplier } from '../api/materialSuppliers'
import { createMaterialSupplier, deleteMaterialSupplier, listMaterialSuppliers, updateMaterialSupplier } from '../api/materialSuppliers'
import type { Material } from '../api/materials'
import { getMaterial, listMaterials } from '../api/materials'
import type { Supplier } from '../api/suppliers'
import { getSupplier, listSuppliers } from '../api/suppliers'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)

const items = ref<MaterialSupplier[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filters = reactive({
  material: null as number | null,
  supplier: null as number | null,
  is_preferred: null as boolean | null
})

const dialogOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const materialCache = ref<Record<number, Material>>({})
const supplierCache = ref<Record<number, Supplier>>({})
const materialOptions = ref<Material[]>([])
const supplierOptions = ref<Supplier[]>([])
const materialSearching = ref(false)
const supplierSearching = ref(false)

const form = reactive({
  material: null as number | null,
  supplier: null as number | null,
  supplier_code: '',
  supplier_price: 0,
  is_preferred: false,
  min_order_quantity: 1,
  lead_time_days: 7,
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

function materialLabel(id: number) {
  const m = materialCache.value[id]
  if (!m) return `#${id}`
  return `${m.code} - ${m.name}`
}

function supplierLabel(id: number) {
  const s = supplierCache.value[id]
  if (!s) return `#${id}`
  return `${s.code} - ${s.name}`
}

async function ensureCachesForRows(rows: MaterialSupplier[]) {
  const materialIds = Array.from(new Set(rows.map((r) => r.material)))
  const supplierIds = Array.from(new Set(rows.map((r) => r.supplier)))
  const missingMaterials = materialIds.filter((id) => !materialCache.value[id])
  const missingSuppliers = supplierIds.filter((id) => !supplierCache.value[id])

  await Promise.all([
    ...missingMaterials.map(async (id) => {
      try {
        const m = await getMaterial(id)
        materialCache.value[id] = m
      } catch {
        // ignore
      }
    }),
    ...missingSuppliers.map(async (id) => {
      try {
        const s = await getSupplier(id)
        supplierCache.value[id] = s
      } catch {
        // ignore
      }
    })
  ])
}

async function fetchList() {
  loading.value = true
  try {
    const data = await listMaterialSuppliers({
      page: page.value,
      page_size: pageSize.value,
      material: filters.material || undefined,
      supplier: filters.supplier || undefined,
      is_preferred: filters.is_preferred === null ? undefined : filters.is_preferred
    })
    items.value = data.results
    total.value = data.count
    ensureCachesForRows(data.results)
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

function resetForm() {
  form.material = null
  form.supplier = null
  form.supplier_code = ''
  form.supplier_price = 0
  form.is_preferred = false
  form.min_order_quantity = 1
  form.lead_time_days = 7
  form.notes = ''
}

function openCreate() {
  editing.value = false
  editingId.value = null
  resetForm()
  materialOptions.value = []
  supplierOptions.value = []
  dialogOpen.value = true
}

function openEdit(row: MaterialSupplier) {
  editing.value = true
  editingId.value = row.id
  form.material = row.material
  form.supplier = row.supplier
  form.supplier_code = row.supplier_code || ''
  form.supplier_price = Number(row.supplier_price || 0)
  form.is_preferred = !!row.is_preferred
  form.min_order_quantity = Number(row.min_order_quantity || 1)
  form.lead_time_days = row.lead_time_days ?? 7
  form.notes = row.notes || ''
  materialOptions.value = materialCache.value[row.material] ? [materialCache.value[row.material]] : []
  supplierOptions.value = supplierCache.value[row.supplier] ? [supplierCache.value[row.supplier]] : []
  dialogOpen.value = true
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

async function remoteSearchSuppliers(query: string) {
  if (!query || !query.trim()) {
    supplierOptions.value = []
    return
  }
  supplierSearching.value = true
  try {
    const data = await listSuppliers({ page: 1, search: query.trim() })
    supplierOptions.value = data.results
    data.results.forEach((s) => (supplierCache.value[s.id] = s))
  } catch {
    supplierOptions.value = []
  } finally {
    supplierSearching.value = false
  }
}

async function submit() {
  if (!form.material) {
    ElMessage.warning('请选择物料')
    return
  }
  if (!form.supplier) {
    ElMessage.warning('请选择供应商')
    return
  }

  submitting.value = true
  try {
    const payload: any = { ...form }
    payload.material = form.material
    payload.supplier = form.supplier
    if (editing.value && editingId.value) {
      await updateMaterialSupplier(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await createMaterialSupplier(payload)
      ElMessage.success('已创建')
    }
    dialogOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '保存失败'))
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该关联？', '提示', { type: 'warning' })
  } catch {
    return
  }

  deletingId.value = id
  try {
    await deleteMaterialSupplier(id)
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
</style>
