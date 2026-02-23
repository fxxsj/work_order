<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">任务列表（vNext）</div>
      </div>
      <div class="right">
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索：内容/要求"
          style="width: 260px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" :loading="exporting" @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-card>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
        <div style="display: flex; gap: 8px; align-items: center">
          <el-button size="small" type="success" :disabled="!selected.length" :loading="batchCompleting" @click="openBatchComplete">
            批量完成
          </el-button>
          <el-button size="small" type="danger" :disabled="!selected.length" :loading="batchCancelling" @click="openBatchCancel">
            批量取消
          </el-button>
          <div style="font-size: 12px; color: #666">已选 {{ selected.length }} 项</div>
        </div>
      </div>

      <el-table
        :data="items"
        v-loading="loading"
        style="width: 100%"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column label="施工单" min-width="140">
          <template #default="{ row }">{{ row.work_order_process_info?.work_order?.order_number || '-' }}</template>
        </el-table-column>
        <el-table-column label="工序" width="120">
          <template #default="{ row }">{{ row.work_order_process_info?.process?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="task_type_display" label="类型" width="120" />
        <el-table-column prop="work_content" label="内容" min-width="220" show-overflow-tooltip />
        <el-table-column prop="status_display" label="状态" width="110" />
        <el-table-column label="完成" width="140">
          <template #default="{ row }">
            {{ row.quantity_completed ?? 0 }} / {{ row.production_quantity ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="assigned_department_name" label="部门" width="120" />
        <el-table-column prop="assigned_operator_name" label="操作员" width="120" />
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

    <el-dialog v-model="batchCompleteOpen" title="批量完成任务" width="520px">
      <el-form label-width="90px">
        <el-form-item label="完成理由">
          <el-input v-model="batchCompleteReason" placeholder="可选" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchCompleteNotes" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="batchCompleteOpen = false">取消</el-button>
        <el-button size="small" type="primary" :loading="batchCompleting" @click="submitBatchComplete">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchCancelOpen" title="批量取消任务" width="520px">
      <el-form label-width="90px">
        <el-form-item label="取消原因" required>
          <el-input v-model="batchCancelReason" placeholder="必填" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchCancelNotes" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="batchCancelOpen = false">取消</el-button>
        <el-button size="small" type="danger" :loading="batchCancelling" @click="submitBatchCancel">确定取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { batchCancelTasks, batchCompleteTasks, exportTasks, listTasks, type WorkOrderTaskListItem } from '../api/tasks'
import { downloadBlob, getFilenameFromContentDisposition } from '../lib/download'

const router = useRouter()

const loading = ref(false)
const items = ref<WorkOrderTaskListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const exporting = ref(false)
const selected = ref<WorkOrderTaskListItem[]>([])
const batchCompleteOpen = ref(false)
const batchCompleteReason = ref('')
const batchCompleteNotes = ref('')
const batchCompleting = ref(false)
const batchCancelOpen = ref(false)
const batchCancelReason = ref('')
const batchCancelNotes = ref('')
const batchCancelling = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const data = await listTasks({
      page: page.value,
      page_size: pageSize.value,
      search: search.value || undefined
    })
    items.value = data.results
    total.value = data.count
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '加载失败')
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

function goHome() {
  router.push({ name: 'dashboard' })
}

function handleSelectionChange(rows: WorkOrderTaskListItem[]) {
  selected.value = rows
}

function openBatchComplete() {
  if (!selected.value.length) return
  batchCompleteReason.value = ''
  batchCompleteNotes.value = ''
  batchCompleteOpen.value = true
}

function openBatchCancel() {
  if (!selected.value.length) return
  batchCancelReason.value = ''
  batchCancelNotes.value = ''
  batchCancelOpen.value = true
}

async function submitBatchComplete() {
  if (!selected.value.length) {
    batchCompleteOpen.value = false
    return
  }

  batchCompleting.value = true
  try {
    await batchCompleteTasks({
      task_ids: selected.value.map((t) => t.id),
      completion_reason: batchCompleteReason.value,
      notes: batchCompleteNotes.value
    })
    ElMessage.success('批量完成已提交')
    batchCompleteOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '批量完成失败')
  } finally {
    batchCompleting.value = false
  }
}

async function submitBatchCancel() {
  if (!selected.value.length) {
    batchCancelOpen.value = false
    return
  }

  if (!batchCancelReason.value.trim()) {
    ElMessage.error('请填写取消原因')
    return
  }

  batchCancelling.value = true
  try {
    await batchCancelTasks({
      task_ids: selected.value.map((t) => t.id),
      cancellation_reason: batchCancelReason.value.trim(),
      notes: batchCancelNotes.value
    })
    ElMessage.success('批量取消已提交')
    batchCancelOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '批量取消失败')
  } finally {
    batchCancelling.value = false
  }
}

async function handleExport() {
  exporting.value = true
  try {
    const res = await exportTasks({
      search: search.value || undefined
    })
    const cd = (res.headers?.['content-disposition'] || res.headers?.['Content-Disposition']) as
      | string
      | undefined
    const filename = getFilenameFromContentDisposition(cd) || 'tasks.xlsx'
    downloadBlob(res.data as Blob, filename)
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '导出失败')
  } finally {
    exporting.value = false
  }
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
</style>
