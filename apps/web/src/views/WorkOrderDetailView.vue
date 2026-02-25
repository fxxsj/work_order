<template>
  <PageLayout title="施工单详情（vNext）" :loading="loading" @back="goBack">
    <template v-if="workOrder" #actions>
      <el-dropdown @command="handleStatusCommand">
        <el-button size="small" type="success">更改状态</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="pending">待开始</el-dropdown-item>
            <el-dropdown-item command="in_progress">进行中</el-dropdown-item>
            <el-dropdown-item command="paused">已暂停</el-dropdown-item>
            <el-dropdown-item command="completed">已完成</el-dropdown-item>
            <el-dropdown-item command="cancelled">已取消</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>

    <el-card v-if="workOrder">
      <el-descriptions title="基本信息" :column="infoColumns" border>
        <el-descriptions-item label="施工单号">{{ workOrder.order_number }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ workOrder.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="业务员">{{ workOrder.salesperson_name || '-' }}</el-descriptions-item>

        <el-descriptions-item label="状态">{{ workOrder.status_display }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ workOrder.approval_status_display || '-' }}</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ workOrder.priority_display }}</el-descriptions-item>

        <el-descriptions-item label="交期">{{ workOrder.delivery_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="进度">
          <el-progress :percentage="workOrder.progress_percentage || 0" :stroke-width="10" />
        </el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ workOrder.total_amount ?? '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-descriptions title="产品" :column="productColumns" border>
        <el-descriptions-item label="产品名称">{{ workOrder.product_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ workOrder.quantity }} {{ workOrder.unit }}</el-descriptions-item>
      </el-descriptions>

      <el-divider v-if="canApprove && workOrder.approval_status === 'pending'" />

      <el-card v-if="canApprove && workOrder.approval_status === 'pending'" class="approve-card">
        <template #header>
          <div class="card-header">业务员审核</div>
        </template>

        <el-form :model="approveForm" label-width="120px">
          <el-form-item label="审核结果">
            <el-radio-group v-model="approveForm.approval_status">
              <el-radio label="approved">通过</el-radio>
              <el-radio label="rejected">拒绝</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="审核意见">
            <el-input v-model="approveForm.approval_comment" type="textarea" :rows="3" />
          </el-form-item>

          <el-form-item v-if="approveForm.approval_status === 'rejected'" label="拒绝原因">
            <el-input v-model="approveForm.rejection_reason" type="textarea" :rows="3" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="approving" @click="submitApprove">提交审核</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-divider />

      <el-card>
        <template #header>
          <div class="card-header">工序与任务（简版）</div>
        </template>
        <el-table :data="workOrder.order_processes || []" style="width: 100%">
          <el-table-column prop="process_name" label="工序" width="160" />
          <el-table-column prop="status_display" label="状态" width="120" />
          <el-table-column label="任务数" width="120">
            <template #default="{ row }">{{ row.tasks ? row.tasks.length : 0 }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageLayout from '../components/PageLayout.vue'
import { useBreakpoints } from '../composables/useBreakpoints'
import { approveWorkOrder, getWorkOrder, updateWorkOrderStatus } from '../api/workorders'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const { isMobile } = useBreakpoints()

const id = computed(() => Number(route.params.id))
const loading = ref(false)
const workOrder = ref<any | null>(null)

const approving = ref(false)
const approveForm = reactive({
  approval_status: 'approved' as 'approved' | 'rejected',
  approval_comment: '',
  rejection_reason: ''
})

const canApprove = computed(() => user.hasRole('业务员'))
const infoColumns = computed(() => (isMobile.value ? 1 : 3))
const productColumns = computed(() => (isMobile.value ? 1 : 2))

async function load() {
  loading.value = true
  try {
    workOrder.value = await getWorkOrder(id.value)
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function handleStatusCommand(nextStatus: string) {
  if (!workOrder.value) return
  loading.value = true
  try {
    await updateWorkOrderStatus(workOrder.value.id, nextStatus)
    ElMessage.success('状态已更新')
    await load()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '更新失败')
  } finally {
    loading.value = false
  }
}

async function submitApprove() {
  if (!workOrder.value) return
  if (approveForm.approval_status === 'rejected' && !approveForm.rejection_reason.trim()) {
    ElMessage.warning('拒绝审核时必须填写拒绝原因')
    return
  }
  approving.value = true
  try {
    await approveWorkOrder({
      id: workOrder.value.id,
      approval_status: approveForm.approval_status,
      approval_comment: approveForm.approval_comment,
      rejection_reason: approveForm.rejection_reason
    })
    ElMessage.success('审核已提交')
    await load()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.response?.data?.detail || err?.message || '提交失败')
  } finally {
    approving.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.approve-card {
  border: 1px solid #ebeef5;
}
.card-header {
  font-weight: 600;
}
</style>
