<template>
  <div class="page">
    <ResourceList
      ref="listRef"
      title="产品管理（vNext）"
      :api="productApi"
      search-placeholder="搜索产品编码/名称"
      @create="openCreate"
    >
      <template #columns>
        <el-table-column prop="code" label="编码" width="140" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="specification" label="规格" min-width="160" show-overflow-tooltip />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="unit_price" label="单价" width="120" />
        <el-table-column label="启用" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.is_active" type="success">是</el-tag>
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

    <el-dialog v-model="dialogOpen" :title="editing ? '编辑产品' : '新建产品'" width="560px" :close-on-click-modal="false">
      <el-form :model="form" label-width="120px">
        <el-form-item label="产品编码" required>
          <el-input v-model="form.code" :disabled="editing" />
        </el-form-item>
        <el-form-item label="产品名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="form.specification" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="form.unit" style="width: 220px" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="form.unit_price" :min="0" :max="99999999.99" :precision="2" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.is_active" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
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
import type { Product } from '../api/products'
import { createProduct, deleteProduct, productApi, updateProduct } from '../api/products'
import ResourceList from './base/ResourceList.vue'

const submitting = ref(false)
const deletingId = ref<number | null>(null)

const listRef = ref<InstanceType<typeof ResourceList> | null>(null)

const dialogOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  code: '',
  name: '',
  specification: '',
  unit: '件',
  unit_price: 0,
  is_active: true,
  description: ''
})

function resetForm() {
  form.code = ''
  form.name = ''
  form.specification = ''
  form.unit = '件'
  form.unit_price = 0
  form.is_active = true
  form.description = ''
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

function openEdit(row: Product) {
  editing.value = true
  editingId.value = row.id
  form.code = row.code || ''
  form.name = row.name || ''
  form.specification = row.specification || ''
  form.unit = row.unit || '件'
  form.unit_price = Number(row.unit_price || 0)
  form.is_active = row.is_active !== false
  form.description = row.description || ''
  dialogOpen.value = true
}

async function submit() {
  if (!form.code.trim()) {
    ElMessage.warning('请输入产品编码')
    return
  }
  if (!form.name.trim()) {
    ElMessage.warning('请输入产品名称')
    return
  }

  submitting.value = true
  try {
    if (editing.value && editingId.value) {
      await updateProduct(editingId.value, { ...form })
      ElMessage.success('已保存')
    } else {
      await createProduct({ ...form })
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
    await ElMessageBox.confirm('确认删除该产品？', '提示', { type: 'warning' })
  } catch {
    return
  }

  deletingId.value = id
  try {
    await deleteProduct(id)
    ElMessage.success('已删除')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '删除失败')
  } finally {
    deletingId.value = null
  }
}

</script>

<style scoped>
.page {
  padding: 0;
}
</style>
