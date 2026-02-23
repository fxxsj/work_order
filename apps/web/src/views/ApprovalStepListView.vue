<template>
  <div class="page">
    <ResourceList
      ref="listRef"
      title="审核步骤（我的待办）"
      :api="approvalStepApi"
      search-placeholder="搜索步骤名/意见/施工单号"
    >
      <template #columns>
        <el-table-column prop="work_order_number" label="施工单" width="160" />
        <el-table-column prop="workflow_name" label="工作流" width="160" />
        <el-table-column prop="step_name" label="步骤" min-width="180" />
        <el-table-column prop="assigned_to_name" label="分配给" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="decision" label="结果" width="120" />
        <el-table-column prop="updated_at" label="更新时间" width="170" />
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button size="small" :loading="actingId === row.id" @click="handleStart(row)">开始</el-button>
            <el-button size="small" type="success" :loading="actingId === row.id" @click="openComplete(row, 'approve')">
              通过
            </el-button>
            <el-button size="small" type="danger" :loading="actingId === row.id" @click="openComplete(row, 'reject')">
              拒绝
            </el-button>
            <el-button size="small" type="warning" :loading="actingId === row.id" @click="openEscalate(row)">上报</el-button>
          </template>
        </el-table-column>
      </template>
    </ResourceList>

    <el-dialog v-model="completeOpen" :title="completeDecision === 'approve' ? '通过审核' : '拒绝审核'" width="560px" :close-on-click-modal="false">
      <el-form :model="completeForm" label-width="120px">
        <el-form-item label="意见">
          <el-input v-model="completeForm.comments" type="textarea" :rows="4" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitComplete">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="escalateOpen" title="上报审核步骤" width="560px" :close-on-click-modal="false">
      <el-form :model="escalateForm" label-width="120px">
        <el-form-item label="上报原因" required>
          <el-input v-model="escalateForm.escalation_reason" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="escalateOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEscalate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  approvalStepApi,
  completeApprovalStep,
  escalateApprovalStep,
  startApprovalStep,
  type ApprovalStep,
  type ApprovalStepDecision
} from '../api/approvalSteps'
import { formatError } from '../lib/formatError'
import ResourceList from './base/ResourceList.vue'

const listRef = ref<InstanceType<typeof ResourceList> | null>(null)
const actingId = ref<number | null>(null)

const completeOpen = ref(false)
const completingId = ref<number | null>(null)
const completeDecision = ref<ApprovalStepDecision>('approve')
const submitting = ref(false)

const completeForm = reactive({ comments: '' })

const escalateOpen = ref(false)
const escalatingId = ref<number | null>(null)
const escalateForm = reactive({ escalation_reason: '' })

async function reload() {
  await listRef.value?.loadData()
}

async function handleStart(row: ApprovalStep) {
  actingId.value = row.id
  try {
    await startApprovalStep(row.id)
    ElMessage.success('已开始')
    await reload()
  } catch (err: any) {
    ElMessage.error(formatError(err, '操作失败'))
  } finally {
    actingId.value = null
  }
}

function openComplete(row: ApprovalStep, decision: ApprovalStepDecision) {
  completingId.value = row.id
  completeDecision.value = decision
  completeForm.comments = ''
  completeOpen.value = true
}

async function submitComplete() {
  if (!completingId.value) return
  submitting.value = true
  actingId.value = completingId.value
  try {
    await completeApprovalStep(completingId.value, {
      decision: completeDecision.value,
      comments: completeForm.comments || undefined
    })
    ElMessage.success('已提交')
    completeOpen.value = false
    await reload()
  } catch (err: any) {
    ElMessage.error(formatError(err, '提交失败'))
  } finally {
    submitting.value = false
    actingId.value = null
  }
}

function openEscalate(row: ApprovalStep) {
  escalatingId.value = row.id
  escalateForm.escalation_reason = ''
  escalateOpen.value = true
}

async function submitEscalate() {
  if (!escalatingId.value) return
  if (!escalateForm.escalation_reason.trim()) {
    ElMessage.warning('请输入上报原因')
    return
  }
  submitting.value = true
  actingId.value = escalatingId.value
  try {
    await escalateApprovalStep(escalatingId.value, { escalation_reason: escalateForm.escalation_reason.trim() })
    ElMessage.success('已上报')
    escalateOpen.value = false
    await reload()
  } catch (err: any) {
    ElMessage.error(formatError(err, '上报失败'))
  } finally {
    submitting.value = false
    actingId.value = null
  }
}
</script>

<style scoped>
.page {
  padding: 16px;
}
</style>
