<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">部门管理（vNext）</div>
      </div>
      <div class="right">
        <el-switch v-model="treeMode" active-text="树形" inactive-text="列表" />
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索部门名称/编码"
          style="width: 260px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">{{ treeMode ? '刷新' : '查询' }}</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table
        :data="items"
        v-loading="loading"
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="code" label="编码" width="140" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="parent_name" label="上级部门" width="160" />
        <el-table-column prop="sort_order" label="排序" width="110" />
        <el-table-column prop="children_count" label="子部门" width="90" />
        <el-table-column label="工序" min-width="220">
          <template #default="{ row }">
            <span class="muted">{{ (row.process_names || []).join('；') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.is_active" type="success">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="(row.children_count || 0) > 0"
              :loading="deletingId === row.id"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!treeMode" class="pager">
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

    <el-dialog v-model="dialogOpen" :title="editing ? '编辑部门' : '新建部门'" width="560px" :close-on-click-modal="false">
      <el-form :model="form" label-width="120px">
        <el-form-item label="部门编码" required>
          <el-input v-model="form.code" :disabled="editing" />
        </el-form-item>
        <el-form-item label="部门名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select v-model="form.parent" clearable filterable placeholder="（无）" style="width: 100%">
            <el-option v-for="d in departmentOptions" :key="d.id" :label="d.label" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :max="99999" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.is_active" />
        </el-form-item>
        <el-form-item label="负责工序">
          <el-select v-model="form.processes" multiple filterable collapse-tags placeholder="选择工序" style="width: 100%">
            <el-option v-for="p in processOptions" :key="p.id" :label="p.label" :value="p.id" />
          </el-select>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Department } from '../api/departments'
import { createDepartment, deleteDepartment, getDepartmentTree, listAllDepartments, listDepartments, updateDepartment } from '../api/departments'
import type { Process } from '../api/processes'
import { listAllProcesses } from '../api/processes'
import { formatError } from '../lib/formatError'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)

const items = ref<Department[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const treeMode = ref(false)

const dialogOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  code: '',
  name: '',
  parent: null as number | null,
  sort_order: 0,
  is_active: true,
  processes: [] as number[]
})

function resetForm() {
  form.code = ''
  form.name = ''
  form.parent = null
  form.sort_order = 0
  form.is_active = true
  form.processes = []
}

const allDepartments = ref<Department[]>([])
const allProcesses = ref<Process[]>([])

const departmentOptions = computed(() => {
  const currentId = editingId.value
  const list = allDepartments.value
    .filter((d) => d.id !== currentId)
    .slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.code.localeCompare(b.code))
  return list.map((d) => ({
    id: d.id,
    label: `${'—'.repeat(d.level || 0)}${d.code} - ${d.name}`
  }))
})

const processOptions = computed(() => {
  const list = allProcesses.value.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.code.localeCompare(b.code))
  return list.map((p) => ({
    id: p.id,
    label: `${p.code} - ${p.name}`
  }))
})

async function ensureOptionsLoaded() {
  try {
    const [departments, processes] = await Promise.all([listAllDepartments(), listAllProcesses()])
    allDepartments.value = departments
    allProcesses.value = processes
  } catch {
    // best-effort; leave empty and let backend validate
  }
}

async function fetchList() {
  loading.value = true
  try {
    if (treeMode.value) {
      const data = await getDepartmentTree()
      items.value = data as any
      total.value = data.length
    } else {
      const data = await listDepartments({
        page: page.value,
        page_size: pageSize.value,
        search: search.value || undefined
      })
      items.value = data.results
      total.value = data.count
    }
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

function openCreate() {
  editing.value = false
  editingId.value = null
  resetForm()
  ensureOptionsLoaded()
  dialogOpen.value = true
}

function openEdit(row: Department) {
  editing.value = true
  editingId.value = row.id
  form.code = row.code || ''
  form.name = row.name || ''
  form.parent = (row.parent ?? null) as any
  form.sort_order = row.sort_order || 0
  form.is_active = row.is_active !== false
  form.processes = (row.processes || []).slice()
  ensureOptionsLoaded()
  dialogOpen.value = true
}

async function submit() {
  if (!form.code.trim()) {
    ElMessage.warning('请输入部门编码')
    return
  }
  if (!form.name.trim()) {
    ElMessage.warning('请输入部门名称')
    return
  }

  submitting.value = true
  try {
    if (editing.value && editingId.value) {
      await updateDepartment(editingId.value, { ...form, parent: form.parent ?? null })
      ElMessage.success('已保存')
    } else {
      await createDepartment({ ...form, parent: form.parent ?? null })
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
    await ElMessageBox.confirm('确认删除该部门？', '提示', { type: 'warning' })
  } catch {
    return
  }

  deletingId.value = id
  try {
    await deleteDepartment(id)
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

watch(treeMode, () => reload())
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
.muted {
  color: #666;
  font-size: 12px;
}
</style>
