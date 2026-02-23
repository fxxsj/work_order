<template>
  <ResourceList
    ref="listRef"
    title="物料管理（vNext）"
    :api="materialListApi"
    search-placeholder="搜索物料名称/编码/规格"
    @create="openCreate"
  >
    <template #columns>
      <el-table-column prop="code" label="编码" width="140" />
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column prop="specification" label="规格" min-width="160" />
      <el-table-column prop="unit" label="单位" width="80" />
      <el-table-column prop="unit_price" label="单价" width="110" />
      <el-table-column prop="stock_quantity" label="库存" width="110" />
      <el-table-column prop="min_stock_quantity" label="最小库存" width="110" />
      <el-table-column label="默认供应商" min-width="160">
        <template #default="{ row }">
          <span v-if="row.default_supplier" class="muted">{{ supplierLabel(row.default_supplier) }}</span>
          <span v-else class="muted">（无）</span>
        </template>
      </el-table-column>
      <el-table-column label="开料" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.need_cutting" type="warning">是</el-tag>
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
    </template>
  </ResourceList>

  <el-dialog v-model="dialogOpen" :title="editing ? '编辑物料' : '新建物料'" width="760px" :close-on-click-modal="false">
    <el-form :model="form" label-width="140px">
      <el-form-item label="物料编码" required>
        <el-input v-model="form.code" />
      </el-form-item>
      <el-form-item label="物料名称" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="规格">
        <el-input v-model="form.specification" />
      </el-form-item>
      <el-form-item label="单位">
        <el-input v-model="form.unit" />
      </el-form-item>
      <el-form-item label="单价">
        <el-input-number v-model="form.unit_price" :min="0" :max="999999999.99" :precision="2" :step="0.1" />
      </el-form-item>
      <el-form-item label="库存数量">
        <el-input-number v-model="form.stock_quantity" :min="0" :precision="3" :step="1" />
      </el-form-item>
      <el-form-item label="最小库存">
        <el-input-number v-model="form.min_stock_quantity" :min="0" :precision="3" :step="1" />
      </el-form-item>
      <el-form-item label="默认供应商">
        <el-select
          v-model="form.default_supplier"
          clearable
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
      <el-form-item label="采购周期（天）">
        <el-input-number v-model="form.lead_time_days" :min="0" :max="365" />
      </el-form-item>
      <el-form-item label="需要开料">
        <el-switch v-model="form.need_cutting" />
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

  <!-- Legacy markup removed: list/pager logic handled by ResourceList -->
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ResourceList from './base/ResourceList.vue'
import type { Material } from '../api/materials'
import { createMaterial, deleteMaterial, listMaterials, updateMaterial } from '../api/materials'
import type { Supplier } from '../api/suppliers'
import { getSupplier, listSuppliers } from '../api/suppliers'

const submitting = ref(false)
const deletingId = ref<number | null>(null)

const listRef = ref<{ loadData: () => Promise<void>; handleSearch: () => void } | null>(null)

const dialogOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const supplierCache = ref<Record<number, Supplier>>({})
const supplierOptions = ref<Supplier[]>([])
const supplierSearching = ref(false)

const form = reactive({
  code: '',
  name: '',
  specification: '',
  unit: '个',
  unit_price: 0,
  stock_quantity: 0,
  min_stock_quantity: 0,
  default_supplier: null as number | null,
  lead_time_days: 7,
  need_cutting: false,
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

function supplierLabel(id: number) {
  const s = supplierCache.value[id]
  if (!s) return `#${id}`
  return `${s.code} - ${s.name}`
}

async function ensureSupplierCacheForVisibleRows(rows: Material[]) {
  const ids = Array.from(new Set(rows.map((r) => r.default_supplier).filter(Boolean) as number[]))
  const missing = ids.filter((id) => !supplierCache.value[id])
  if (!missing.length) return
  await Promise.all(
    missing.map(async (id) => {
      try {
        const s = await getSupplier(id)
        supplierCache.value[id] = s
      } catch {
        // ignore
      }
    })
  )
}

const materialListApi = {
  list: async (params: any) => {
    const data = await listMaterials(params)
    ensureSupplierCacheForVisibleRows(data.results)
    return data
  }
}

function resetForm() {
  form.code = ''
  form.name = ''
  form.specification = ''
  form.unit = '个'
  form.unit_price = 0
  form.stock_quantity = 0
  form.min_stock_quantity = 0
  form.default_supplier = null
  form.lead_time_days = 7
  form.need_cutting = false
  form.notes = ''
}

function openCreate() {
  editing.value = false
  editingId.value = null
  resetForm()
  supplierOptions.value = []
  dialogOpen.value = true
}

function openEdit(row: Material) {
  editing.value = true
  editingId.value = row.id
  form.code = row.code || ''
  form.name = row.name || ''
  form.specification = row.specification || ''
  form.unit = row.unit || '个'
  form.unit_price = Number(row.unit_price || 0)
  form.stock_quantity = Number(row.stock_quantity || 0)
  form.min_stock_quantity = Number(row.min_stock_quantity || 0)
  form.default_supplier = (row.default_supplier ?? null) as any
  form.lead_time_days = row.lead_time_days ?? 7
  form.need_cutting = !!row.need_cutting
  form.notes = row.notes || ''
  supplierOptions.value = []
  if (form.default_supplier) {
    const cached = supplierCache.value[form.default_supplier]
    if (cached) supplierOptions.value = [cached]
  }
  dialogOpen.value = true
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
  if (!form.code.trim()) {
    ElMessage.warning('请输入物料编码')
    return
  }
  if (!form.name.trim()) {
    ElMessage.warning('请输入物料名称')
    return
  }
  if (editing.value && form.min_stock_quantity > form.stock_quantity) {
    ElMessage.warning('最小库存不能大于当前库存')
    return
  }

  submitting.value = true
  try {
    const payload: any = { ...form }
    payload.default_supplier = form.default_supplier ?? null
    if (editing.value && editingId.value) {
      await updateMaterial(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await createMaterial(payload)
      ElMessage.success('已创建')
    }
    dialogOpen.value = false
    await listRef.value?.loadData()
  } catch (err: any) {
    ElMessage.error(formatError(err, '保存失败'))
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该物料？', '提示', { type: 'warning' })
  } catch {
    return
  }

  deletingId.value = id
  try {
    await deleteMaterial(id)
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
