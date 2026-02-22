<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">图稿管理（vNext）</div>
      </div>
      <div class="right">
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索主编码/名称/拼版尺寸"
          style="width: 280px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="code" label="编码" width="170" />
        <el-table-column prop="name" label="名称" min-width="220" />
        <el-table-column prop="color_display" label="色数" width="160" />
        <el-table-column prop="imposition_size" label="拼版尺寸" width="160" />
        <el-table-column label="确认" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.confirmed" type="success">已确认</el-tag>
            <el-tag v-else type="warning">未确认</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="confirmed_by_name" label="确认人" width="140" />
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :loading="deletingId === row.id" @click="handleDelete(row.id)">删除</el-button>
            <el-divider direction="vertical" />
            <el-button size="small" :disabled="row.confirmed" :loading="actioningId === row.id" @click="handleConfirm(row.id)">
              设计确认
            </el-button>
            <el-button size="small" :loading="actioningId === row.id" @click="handleCreateVersion(row.id)">新版本</el-button>
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

    <el-dialog v-model="editOpen" :title="editing ? '编辑图稿' : '新建图稿'" width="760px" :close-on-click-modal="false">
      <el-form :model="form" label-width="140px">
        <el-form-item label="图稿名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="CMYK">
          <el-checkbox-group v-model="form.cmyk_colors">
            <el-checkbox label="C" />
            <el-checkbox label="M" />
            <el-checkbox label="Y" />
            <el-checkbox label="K" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="其他颜色">
          <el-input v-model="form.other_colors_text" placeholder="用逗号分隔，例如：528C,金色" />
        </el-form-item>
        <el-form-item label="拼版尺寸">
          <el-input v-model="form.imposition_size" placeholder="例如：420x594mm" />
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
import type { Artwork } from '../api/artworks'
import { confirmArtwork, createArtwork, createArtworkVersion, deleteArtwork, listArtworks, updateArtwork } from '../api/artworks'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const actioningId = ref<number | null>(null)

const items = ref<Artwork[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')

const editOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  name: '',
  cmyk_colors: [] as string[],
  other_colors_text: '',
  imposition_size: '',
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

function parseOtherColors(text: string) {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function fetchList() {
  loading.value = true
  try {
    const data = await listArtworks({ page: page.value, page_size: pageSize.value, search: search.value || undefined })
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
  form.name = ''
  form.cmyk_colors = []
  form.other_colors_text = ''
  form.imposition_size = ''
  form.notes = ''
}

function openCreate() {
  editing.value = false
  editingId.value = null
  resetForm()
  editOpen.value = true
}

function openEdit(row: Artwork) {
  editing.value = true
  editingId.value = row.id
  form.name = row.name || ''
  form.cmyk_colors = (row.cmyk_colors || []).slice()
  form.other_colors_text = (row.other_colors || []).join(',')
  form.imposition_size = row.imposition_size || ''
  form.notes = row.notes || ''
  editOpen.value = true
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入图稿名称')
    return
  }
  submitting.value = true
  try {
    const payload: any = {
      name: form.name.trim(),
      cmyk_colors: form.cmyk_colors,
      other_colors: parseOtherColors(form.other_colors_text),
      imposition_size: form.imposition_size || '',
      notes: form.notes || ''
    }
    if (editing.value && editingId.value) {
      await updateArtwork(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await createArtwork(payload)
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
    await ElMessageBox.confirm('确认删除该图稿？', '提示', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deleteArtwork(id)
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
    await confirmArtwork(id)
    ElMessage.success('已确认')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '确认失败'))
  } finally {
    actioningId.value = null
  }
}

async function handleCreateVersion(id: number) {
  actioningId.value = id
  try {
    await createArtworkVersion(id)
    ElMessage.success('已创建新版本')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '创建版本失败'))
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

