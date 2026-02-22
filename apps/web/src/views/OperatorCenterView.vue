<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">操作员任务中心（vNext）</div>
      </div>
      <div class="right">
        <el-button size="small" :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>

    <el-row :gutter="12">
      <el-col :span="6">
        <el-card class="stat">
          <div class="value">{{ summary.my_total || 0 }}</div>
          <div class="label">我的任务</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat pending">
          <div class="value">{{ summary.my_pending || 0 }}</div>
          <div class="label">待开始</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat progress">
          <div class="value">{{ summary.my_in_progress || 0 }}</div>
          <div class="label">进行中</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat claimable">
          <div class="value">{{ summary.claimable_count || 0 }}</div>
          <div class="label">可认领</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的任务</span>
              <el-tag type="info">{{ myTasks.length }}</el-tag>
            </div>
          </template>

          <el-tabs v-model="myTab">
            <el-tab-pane name="all" label="全部" />
            <el-tab-pane name="pending" label="待开始" />
            <el-tab-pane name="in_progress" label="进行中" />
          </el-tabs>

          <el-table :data="filteredMyTasks" v-loading="loading" style="width: 100%">
            <el-table-column label="施工单" min-width="140">
              <template #default="{ row }">{{ row.work_order_process_info?.work_order?.order_number || '-' }}</template>
            </el-table-column>
            <el-table-column label="工序" width="120">
              <template #default="{ row }">{{ row.work_order_process_info?.process?.name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="work_content" label="内容" min-width="220" show-overflow-tooltip />
            <el-table-column prop="status_display" label="状态" width="110" />
            <el-table-column label="完成" width="140">
              <template #default="{ row }">{{ row.quantity_completed ?? 0 }} / {{ row.production_quantity ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="220">
              <template #default="{ row }">
                <el-button size="small" @click="openUpdate(row)">报工</el-button>
                <el-button size="small" type="primary" @click="openComplete(row)">完成</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>可认领任务</span>
              <el-tag type="warning">{{ claimableTasks.length }}</el-tag>
            </div>
          </template>

          <el-table :data="claimableTasks" v-loading="loading" style="width: 100%">
            <el-table-column label="施工单" min-width="140">
              <template #default="{ row }">{{ row.work_order_process_info?.work_order?.order_number || '-' }}</template>
            </el-table-column>
            <el-table-column label="工序" width="120">
              <template #default="{ row }">{{ row.work_order_process_info?.process?.name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="work_content" label="内容" min-width="220" show-overflow-tooltip />
            <el-table-column prop="status_display" label="状态" width="110" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" type="warning" :loading="claimingId === row.id" @click="handleClaim(row.id)">
                  认领
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="updateDialogOpen" title="报工" width="520px" :close-on-click-modal="false">
      <el-form :model="updateForm" label-width="120px">
        <el-form-item label="本次完成数量">
          <el-input-number v-model="updateForm.quantity_increment" :min="0" :max="999999" />
        </el-form-item>
        <el-form-item label="不良品数量">
          <el-input-number v-model="updateForm.quantity_defective" :min="0" :max="999999" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="updateForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="updateDialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitUpdate">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogOpen" title="完成任务" width="520px" :close-on-click-modal="false">
      <el-form :model="completeForm" label-width="120px">
        <el-form-item label="完成原因">
          <el-input v-model="completeForm.completion_reason" />
        </el-form-item>
        <el-form-item label="不良品数量">
          <el-input-number v-model="completeForm.quantity_defective" :min="0" :max="999999" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="completeForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitComplete">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { WorkOrderTaskListItem } from '../api/tasks'
import { claimTask, completeTask, getOperatorCenter, updateTaskQuantity } from '../api/tasks'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const myTab = ref<'all' | 'pending' | 'in_progress'>('all')

const myTasks = ref<WorkOrderTaskListItem[]>([])
const claimableTasks = ref<WorkOrderTaskListItem[]>([])
const summary = reactive({
  my_total: 0,
  my_pending: 0,
  my_in_progress: 0,
  claimable_count: 0
})

const filteredMyTasks = computed(() => {
  if (myTab.value === 'all') return myTasks.value
  return myTasks.value.filter(t => t.status === myTab.value)
})

const claimingId = ref<number | null>(null)

const currentTask = ref<WorkOrderTaskListItem | null>(null)
const updateDialogOpen = ref(false)
const completeDialogOpen = ref(false)

const updateForm = reactive({
  quantity_increment: 0,
  quantity_defective: 0,
  notes: ''
})

const completeForm = reactive({
  completion_reason: '',
  quantity_defective: 0,
  notes: ''
})

async function load() {
  loading.value = true
  try {
    const data = await getOperatorCenter()
    myTasks.value = data.my_tasks || []
    claimableTasks.value = data.claimable_tasks || []
    summary.my_total = data.summary?.my_total || 0
    summary.my_pending = data.summary?.my_pending || 0
    summary.my_in_progress = data.summary?.my_in_progress || 0
    summary.claimable_count = data.summary?.claimable_count || 0
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.detail || err?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function handleClaim(taskId: number) {
  claimingId.value = taskId
  try {
    await claimTask(taskId)
    ElMessage.success('任务认领成功')
    await load()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.detail || err?.response?.data?.error || err?.message || '认领失败')
  } finally {
    claimingId.value = null
  }
}

function openUpdate(task: WorkOrderTaskListItem) {
  currentTask.value = task
  updateForm.quantity_increment = 0
  updateForm.quantity_defective = 0
  updateForm.notes = ''
  updateDialogOpen.value = true
}

function openComplete(task: WorkOrderTaskListItem) {
  currentTask.value = task
  completeForm.completion_reason = ''
  completeForm.quantity_defective = 0
  completeForm.notes = ''
  completeDialogOpen.value = true
}

async function submitUpdate() {
  if (!currentTask.value) return
  if (!updateForm.quantity_increment || updateForm.quantity_increment <= 0) {
    ElMessage.warning('请输入本次完成数量')
    return
  }
  submitting.value = true
  try {
    await updateTaskQuantity({
      taskId: currentTask.value.id,
      version: currentTask.value.version,
      quantity_increment: updateForm.quantity_increment,
      quantity_defective: updateForm.quantity_defective,
      notes: updateForm.notes
    })
    ElMessage.success('已提交')
    updateDialogOpen.value = false
    await load()
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 409) {
      ElMessage.error('任务已被他人更新，请刷新后重试')
    } else {
      ElMessage.error(err?.response?.data?.detail || err?.response?.data?.error || err?.message || '提交失败')
    }
  } finally {
    submitting.value = false
  }
}

async function submitComplete() {
  if (!currentTask.value) return
  submitting.value = true
  try {
    await completeTask({
      taskId: currentTask.value.id,
      version: currentTask.value.version,
      completion_reason: completeForm.completion_reason,
      quantity_defective: completeForm.quantity_defective,
      notes: completeForm.notes
    })
    ElMessage.success('任务已完成')
    completeDialogOpen.value = false
    await load()
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 409) {
      ElMessage.error('任务已被他人更新，请刷新后重试')
    } else {
      ElMessage.error(err?.response?.data?.detail || err?.response?.data?.error || err?.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

function goHome() {
  router.push({ name: 'dashboard' })
}

onMounted(() => {
  load()
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
.stat .value {
  font-size: 26px;
  font-weight: 700;
}
.stat .label {
  margin-top: 4px;
  color: #666;
}
.pending {
  border-left: 4px solid #e6a23c;
}
.progress {
  border-left: 4px solid #409eff;
}
.claimable {
  border-left: 4px solid #f56c6c;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

