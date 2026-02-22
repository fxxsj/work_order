<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">工序管理（vNext）</div>
      </div>
      <div class="right">
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索工序编码/名称"
          style="width: 260px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table
        :data="items"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="code" label="编码" width="140" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column label="规则" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ ruleLabel(row.task_generation_rule) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="110" />
        <el-table-column prop="standard_duration" label="工时(小时)" width="120" />
        <el-table-column label="并行" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.is_parallel" type="success">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内置" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.is_builtin" type="info">是</el-tag>
            <el-tag v-else type="success">否</el-tag>
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
              :disabled="row.is_builtin"
              :loading="deletingId === row.id"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="batch" v-if="selectedIds.length">
        <div class="muted">已选择 {{ selectedIds.length }} 项</div>
        <el-button size="small" :loading="batching" @click="batchSetActive(true)">批量启用</el-button>
        <el-button size="small" :loading="batching" @click="batchSetActive(false)">批量禁用</el-button>
      </div>

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

    <el-dialog v-model="dialogOpen" :title="editing ? '编辑工序' : '新建工序'" width="680px" :close-on-click-modal="false">
      <el-form :model="form" label-width="140px">
        <el-form-item label="工序编码" required>
          <el-input v-model="form.code" :disabled="editing && form.is_builtin" />
        </el-form-item>
        <el-form-item label="工序名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :max="99999" />
        </el-form-item>
        <el-form-item label="标准工时(小时)">
          <el-input-number v-model="form.standard_duration" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="任务生成规则">
          <el-select v-model="form.task_generation_rule" style="width: 280px">
            <el-option label="通用" value="general" />
            <el-option label="按图稿" value="artwork" />
            <el-option label="按刀模" value="die" />
            <el-option label="按产品" value="product" />
            <el-option label="按物料" value="material" />
          </el-select>
        </el-form-item>
        <el-form-item label="需要图稿">
          <el-switch v-model="form.requires_artwork" :disabled="form.task_generation_rule === 'artwork'" />
        </el-form-item>
        <el-form-item label="需要刀模">
          <el-switch v-model="form.requires_die" :disabled="form.task_generation_rule === 'die'" />
        </el-form-item>
        <el-form-item label="需要烫金版">
          <el-switch v-model="form.requires_foiling_plate" />
        </el-form-item>
        <el-form-item label="需要压凸版">
          <el-switch v-model="form.requires_embossing_plate" />
        </el-form-item>
        <el-form-item label="可并行执行">
          <el-switch v-model="form.is_parallel" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.is_active" />
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
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Process } from '../api/processes'
import { batchUpdateProcessesActive, createProcess, deleteProcess, listProcesses, updateProcess } from '../api/processes'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const batching = ref(false)
const selectedIds = ref<number[]>([])
const selectedRows = ref<Process[]>([])

const items = ref<Process[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')

const dialogOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  code: '',
  name: '',
  description: '',
  sort_order: 0,
  standard_duration: 0,
  task_generation_rule: 'general' as any,
  requires_artwork: false,
  requires_die: false,
  requires_foiling_plate: false,
  requires_embossing_plate: false,
  is_parallel: false,
  is_active: true,
  is_builtin: false
})

watch(
  () => form.task_generation_rule,
  (rule) => {
    if (rule === 'artwork') form.requires_artwork = true
    if (rule === 'die') form.requires_die = true
  }
)

function resetForm() {
  form.code = ''
  form.name = ''
  form.description = ''
  form.sort_order = 0
  form.standard_duration = 0
  form.task_generation_rule = 'general'
  form.requires_artwork = false
  form.requires_die = false
  form.requires_foiling_plate = false
  form.requires_embossing_plate = false
  form.is_parallel = false
  form.is_active = true
  form.is_builtin = false
}

function ruleLabel(rule?: string) {
  if (rule === 'artwork') return '按图稿'
  if (rule === 'die') return '按刀模'
  if (rule === 'product') return '按产品'
  if (rule === 'material') return '按物料'
  return '通用'
}

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

async function fetchList() {
  loading.value = true
  try {
    const data = await listProcesses({
      page: page.value,
      page_size: pageSize.value,
      search: search.value || undefined
    })
    items.value = data.results
    total.value = data.count
    selectedIds.value = []
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
  dialogOpen.value = true
}

function openEdit(row: Process) {
  editing.value = true
  editingId.value = row.id
  form.code = row.code || ''
  form.name = row.name || ''
  form.description = row.description || ''
  form.sort_order = row.sort_order || 0
  form.standard_duration = row.standard_duration || 0
  form.task_generation_rule = row.task_generation_rule || 'general'
  form.requires_artwork = !!row.requires_artwork
  form.requires_die = !!row.requires_die
  form.requires_foiling_plate = !!row.requires_foiling_plate
  form.requires_embossing_plate = !!row.requires_embossing_plate
  form.is_parallel = !!row.is_parallel
  form.is_active = row.is_active !== false
  form.is_builtin = !!row.is_builtin
  dialogOpen.value = true
}

async function submit() {
  if (!form.code.trim()) {
    ElMessage.warning('请输入工序编码')
    return
  }
  if (!form.name.trim()) {
    ElMessage.warning('请输入工序名称')
    return
  }

  submitting.value = true
  try {
    const payload: any = {
      code: form.code,
      name: form.name,
      description: form.description,
      sort_order: form.sort_order,
      standard_duration: form.standard_duration,
      task_generation_rule: form.task_generation_rule,
      requires_artwork: form.requires_artwork,
      requires_die: form.requires_die,
      requires_foiling_plate: form.requires_foiling_plate,
      requires_embossing_plate: form.requires_embossing_plate,
      is_parallel: form.is_parallel,
      is_active: form.is_active,
      // required flags must be true when requires_* is true (backend validation)
      artwork_required: form.requires_artwork ? true : undefined,
      die_required: form.requires_die ? true : undefined,
      foiling_plate_required: form.requires_foiling_plate ? true : undefined,
      embossing_plate_required: form.requires_embossing_plate ? true : undefined
    }

    if (editing.value && editingId.value) {
      await updateProcess(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await createProcess(payload)
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
    await ElMessageBox.confirm('确认删除该工序？', '提示', { type: 'warning' })
  } catch {
    return
  }

  deletingId.value = id
  try {
    await deleteProcess(id)
    ElMessage.success('已删除')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '删除失败'))
  } finally {
    deletingId.value = null
  }
}

function handleSelectionChange(rows: Process[]) {
  selectedRows.value = rows
  selectedIds.value = rows.map((r) => r.id)
}

async function batchSetActive(is_active: boolean) {
  if (!selectedIds.value.length) return
  const ids =
    is_active === false ? selectedRows.value.filter((r) => !r.is_builtin).map((r) => r.id) : selectedIds.value.slice()

  if (!ids.length) {
    ElMessage.warning('所选项均为内置工序，不能批量禁用')
    return
  }

  batching.value = true
  try {
    await batchUpdateProcessesActive({ ids, is_active })
    ElMessage.success('已更新')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '批量更新失败'))
  } finally {
    batching.value = false
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
.batch {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.muted {
  color: #666;
  font-size: 12px;
}
</style>
