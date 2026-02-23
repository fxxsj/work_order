<template>
  <div class="page">
    <ResourceList
      ref="listRef"
      title="审核工作流（多级审批）"
      :api="approvalWorkflowApi"
      search-placeholder="搜索名称/类型/描述"
      @create="openCreate"
    >
      <template #header-actions>
        <el-button size="small" @click="handleCreateDefault">生成默认工作流</el-button>
      </template>

      <template #columns>
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="workflow_type" label="类型" width="120" />
        <el-table-column label="启用" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="320">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" @click="openDuplicate(row)">复制</el-button>
            <el-button
              size="small"
              :type="row.is_active ? 'warning' : 'success'"
              :loading="actingId === row.id"
              @click="toggleActive(row)"
            >
              {{ row.is_active ? '停用' : '启用' }}
            </el-button>
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

    <el-dialog v-model="dialogOpen" :title="editing ? '编辑工作流' : '新建工作流'" width="680px" :close-on-click-modal="false">
      <el-form :model="form" label-width="120px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="form.workflow_type" style="width: 260px">
            <el-option label="简单" value="simple" />
            <el-option label="标准" value="standard" />
            <el-option label="复杂" value="complex" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="步骤配置(JSON)">
          <el-input v-model="form.stepsJson" type="textarea" :rows="8" placeholder='例如：{"steps":[...]}' />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dupOpen" title="复制工作流" width="560px" :close-on-click-modal="false">
      <el-form :model="dupForm" label-width="120px">
        <el-form-item label="新名称" required>
          <el-input v-model="dupForm.new_name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dupOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitDuplicate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  activateApprovalWorkflow,
  approvalWorkflowApi,
  createApprovalWorkflow,
  createDefaultApprovalWorkflows,
  deactivateApprovalWorkflow,
  deleteApprovalWorkflow,
  duplicateApprovalWorkflow,
  type ApprovalWorkflow,
  updateApprovalWorkflow
} from '../api/approvalWorkflows'
import { formatError } from '../lib/formatError'
import ResourceList from './base/ResourceList.vue'

const listRef = ref<InstanceType<typeof ResourceList> | null>(null)

const dialogOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const actingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)

const form = reactive({
  name: '',
  workflow_type: 'standard' as ApprovalWorkflow['workflow_type'],
  description: '',
  stepsJson: '',
  is_active: true
})

const dupOpen = ref(false)
const dupSourceId = ref<number | null>(null)
const dupForm = reactive({ new_name: '' })

function resetForm() {
  form.name = ''
  form.workflow_type = 'standard'
  form.description = ''
  form.stepsJson = ''
  form.is_active = true
}

async function reload() {
  await listRef.value?.loadData()
}

function openCreate() {
  editing.value = false
  editingId.value = null
  resetForm()
  dialogOpen.value = true
}

function openEdit(row: ApprovalWorkflow) {
  editing.value = true
  editingId.value = row.id
  form.name = row.name || ''
  form.workflow_type = row.workflow_type
  form.description = row.description || ''
  form.stepsJson = row.steps ? JSON.stringify(row.steps, null, 2) : ''
  form.is_active = !!row.is_active
  dialogOpen.value = true
}

async function submit() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入名称')
    return
  }

  let steps: any = undefined
  if (form.stepsJson.trim()) {
    try {
      steps = JSON.parse(form.stepsJson)
    } catch {
      ElMessage.warning('步骤配置不是合法 JSON')
      return
    }
  }

  submitting.value = true
  try {
    const payload: any = {
      name: form.name.trim(),
      workflow_type: form.workflow_type,
      description: form.description || '',
      steps: steps ?? {},
      is_active: form.is_active
    }

    if (editing.value && editingId.value) {
      await updateApprovalWorkflow(editingId.value, payload)
    } else {
      await createApprovalWorkflow(payload)
    }
    ElMessage.success('已保存')
    dialogOpen.value = false
    await reload()
  } catch (err: any) {
    ElMessage.error(formatError(err, '保存失败'))
  } finally {
    submitting.value = false
  }
}

async function toggleActive(row: ApprovalWorkflow) {
  actingId.value = row.id
  try {
    if (row.is_active) {
      await deactivateApprovalWorkflow(row.id)
      ElMessage.success('已停用')
    } else {
      await activateApprovalWorkflow(row.id)
      ElMessage.success('已启用')
    }
    await reload()
  } catch (err: any) {
    ElMessage.error(formatError(err, '操作失败'))
  } finally {
    actingId.value = null
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该工作流？', '提示', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deleteApprovalWorkflow(id)
    ElMessage.success('已删除')
    await reload()
  } catch (err: any) {
    ElMessage.error(formatError(err, '删除失败'))
  } finally {
    deletingId.value = null
  }
}

async function handleCreateDefault() {
  submitting.value = true
  try {
    await createDefaultApprovalWorkflows()
    ElMessage.success('已生成默认工作流')
    await reload()
  } catch (err: any) {
    ElMessage.error(formatError(err, '生成失败'))
  } finally {
    submitting.value = false
  }
}

function openDuplicate(row: ApprovalWorkflow) {
  dupSourceId.value = row.id
  dupForm.new_name = `${row.name}-副本`
  dupOpen.value = true
}

async function submitDuplicate() {
  if (!dupSourceId.value) return
  if (!dupForm.new_name.trim()) {
    ElMessage.warning('请输入新名称')
    return
  }
  submitting.value = true
  try {
    await duplicateApprovalWorkflow({ source_id: dupSourceId.value, new_name: dupForm.new_name.trim() })
    ElMessage.success('复制成功')
    dupOpen.value = false
    await reload()
  } catch (err: any) {
    ElMessage.error(formatError(err, '复制失败'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page {
  padding: 16px;
}
</style>

