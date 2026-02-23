<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">压凸版管理（vNext）</div>
      </div>
      <div class="right">
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索编码/名称/尺寸/材质"
          style="width: 280px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="code" label="编码" width="160" />
        <el-table-column prop="name" label="名称" min-width="200" />
        <el-table-column prop="size" label="尺寸" width="150" />
        <el-table-column prop="material" label="材质" width="140" />
        <el-table-column prop="thickness" label="厚度" width="120" />
        <el-table-column label="确认" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.confirmed" type="success">已确认</el-tag>
            <el-tag v-else type="warning">未确认</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="340" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :loading="deletingId === row.id" @click="handleDelete(row.id)">删除</el-button>
            <el-divider direction="vertical" />
            <el-button size="small" :disabled="row.confirmed" :loading="actioningId === row.id" @click="handleConfirm(row.id)">
              设计确认
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

    <el-dialog v-model="editOpen" :title="editing ? '编辑压凸版' : '新建压凸版'" width="760px" :close-on-click-modal="false">
      <el-form :model="form" label-width="140px">
        <el-form-item label="编码">
          <el-input v-model="form.code" :disabled="form.confirmed" placeholder="留空则自动生成" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" :disabled="form.confirmed" />
        </el-form-item>
        <el-form-item label="尺寸">
          <el-input v-model="form.size" :disabled="form.confirmed" />
        </el-form-item>
        <el-form-item label="材质">
          <el-input v-model="form.material" :disabled="form.confirmed" />
        </el-form-item>
        <el-form-item label="厚度">
          <el-input v-model="form.thickness" :disabled="form.confirmed" />
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { EmbossingPlate } from '../api/embossingPlates'
import { confirmEmbossingPlate, createEmbossingPlate, deleteEmbossingPlate, listEmbossingPlates, updateEmbossingPlate } from '../api/embossingPlates'
import { formatError } from '../lib/formatError'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const actioningId = ref<number | null>(null)

const items = ref<EmbossingPlate[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')

const editOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  code: '',
  name: '',
  size: '',
  material: '',
  thickness: '',
  notes: '',
  confirmed: false
})

async function fetchList() {
  loading.value = true
  try {
    const data = await listEmbossingPlates({ page: page.value, page_size: pageSize.value, search: search.value || undefined })
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

function resetForm() {
  form.code = ''
  form.name = ''
  form.size = ''
  form.material = ''
  form.thickness = ''
  form.notes = ''
  form.confirmed = false
}

function openCreate() {
  editing.value = false
  editingId.value = null
  resetForm()
  editOpen.value = true
}

function openEdit(row: EmbossingPlate) {
  editing.value = true
  editingId.value = row.id
  form.code = row.code || ''
  form.name = row.name || ''
  form.size = row.size || ''
  form.material = row.material || ''
  form.thickness = row.thickness || ''
  form.notes = row.notes || ''
  form.confirmed = !!row.confirmed
  editOpen.value = true
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入名称')
    return
  }
  submitting.value = true
  try {
    const payload: any = {
      code: form.code || '',
      name: form.name.trim(),
      size: form.size || '',
      material: form.material || '',
      thickness: form.thickness || '',
      notes: form.notes || ''
    }
    if (editing.value && editingId.value) {
      await updateEmbossingPlate(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      if (!payload.code) delete payload.code
      await createEmbossingPlate(payload)
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
    await ElMessageBox.confirm('确认删除该压凸版？', '提示', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deleteEmbossingPlate(id)
    ElMessage.success('已删除')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '删除失败'))
  } finally {
    deletingId.value = null
  }
}

async function handleConfirm(id: number) {
  actioningId.value = id
  try {
    await confirmEmbossingPlate(id)
    ElMessage.success('已确认')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '确认失败'))
  } finally {
    actioningId.value = null
  }
}

function goHome() {
  router.push({ name: 'dashboard' })
}

onMounted(() => fetchList())
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
</style>
