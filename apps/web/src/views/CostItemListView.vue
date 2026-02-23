<template>
  <div class="page">
    <ResourceList
      ref="listRef"
      title="成本项目（vNext）"
      :api="costItemApi"
      search-placeholder="搜索名称/编码"
      @create="openCreate"
    >
      <template #columns>
        <el-table-column prop="code" label="编码" width="140" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="type" label="类型" width="140" />
        <el-table-column prop="allocation_method" label="分摊" width="140" />
        <el-table-column prop="is_active" label="启用" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
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

    <el-dialog v-model="dialogOpen" :title="editing ? '编辑成本项目' : '新建成本项目'" width="620px" :close-on-click-modal="false">
      <el-form :model="form" label-width="110px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="form.type" placeholder="请选择">
            <el-option label="直接材料" value="material" />
            <el-option label="直接人工" value="labor" />
            <el-option label="设备折旧" value="equipment" />
            <el-option label="制造费用" value="overhead" />
          </el-select>
        </el-form-item>
        <el-form-item label="分摊方法" required>
          <el-select v-model="form.allocation_method" placeholder="请选择">
            <el-option label="直接分摊" value="direct" />
            <el-option label="按工时" value="labor_hours" />
            <el-option label="按机时" value="machine_hours" />
            <el-option label="按产量" value="quantity" />
            <el-option label="按产值" value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
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
import ResourceList from './base/ResourceList.vue'
import { costItemApi, createCostItem, deleteCostItem, type CostItem, updateCostItem } from '../api/costItems'

const submitting = ref(false)
const deletingId = ref<number | null>(null)
const listRef = ref<InstanceType<typeof ResourceList> | null>(null)

const dialogOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  code: '',
  name: '',
  type: 'material' as CostItem['type'],
  allocation_method: 'direct' as CostItem['allocation_method'],
  is_active: true,
  description: ''
})

function resetForm() {
  form.code = ''
  form.name = ''
  form.type = 'material'
  form.allocation_method = 'direct'
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

function openEdit(row: CostItem) {
  editing.value = true
  editingId.value = row.id
  form.code = row.code || ''
  form.name = row.name || ''
  form.type = row.type || 'material'
  form.allocation_method = row.allocation_method || 'direct'
  form.is_active = !!row.is_active
  form.description = row.description || ''
  dialogOpen.value = true
}

async function submit() {
  if (!form.code.trim() || !form.name.trim()) {
    ElMessage.warning('请填写编码和名称')
    return
  }

  submitting.value = true
  try {
    if (editing.value && editingId.value) {
      await updateCostItem(editingId.value, { ...form })
      ElMessage.success('已保存')
    } else {
      await createCostItem({ ...form })
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
    await ElMessageBox.confirm('确认删除该成本项目？', '提示', { type: 'warning' })
  } catch {
    return
  }

  deletingId.value = id
  try {
    await deleteCostItem(id)
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

