<template>
  <div class="page">
    <ResourceList
      ref="listRef"
      title="客户管理（vNext）"
      :api="customerApi"
      search-placeholder="搜索客户名称/电话"
      @create="openCreate"
    >
      <template #columns>
        <el-table-column prop="name" label="客户名称" min-width="180" />
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="170">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              :loading="deletingId === row.id"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </template>
    </ResourceList>

    <el-dialog v-model="dialogOpen" :title="editing ? '编辑客户' : '新建客户'" width="560px" :close-on-click-modal="false">
      <el-form :model="form" label-width="120px">
        <el-form-item label="客户名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_person" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" type="textarea" :rows="2" />
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
import type { Customer } from '../api/customers'
import { createCustomer, customerApi, deleteCustomer, updateCustomer } from '../api/customers'
import ResourceList from './base/ResourceList.vue'

const submitting = ref(false)
const deletingId = ref<number | null>(null)

const listRef = ref<InstanceType<typeof ResourceList> | null>(null)

const dialogOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: ''
})

function resetForm() {
  form.name = ''
  form.contact_person = ''
  form.phone = ''
  form.email = ''
  form.address = ''
  form.notes = ''
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

function openEdit(row: Customer) {
  editing.value = true
  editingId.value = row.id
  form.name = row.name || ''
  form.contact_person = row.contact_person || ''
  form.phone = row.phone || ''
  form.email = row.email || ''
  form.address = row.address || ''
  form.notes = row.notes || ''
  dialogOpen.value = true
}

async function submit() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入客户名称')
    return
  }

  submitting.value = true
  try {
    if (editing.value && editingId.value) {
      await updateCustomer(editingId.value, { ...form })
      ElMessage.success('已保存')
    } else {
      await createCustomer({ ...form })
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
    await ElMessageBox.confirm('确认删除该客户？', '提示', { type: 'warning' })
  } catch {
    return
  }

  deletingId.value = id
  try {
    await deleteCustomer(id)
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
</style>
