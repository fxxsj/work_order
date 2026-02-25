<template>
  <PageLayout title="任务列表（vNext）" @back="goHome">
    <template #actions>
      <el-input
        v-model="search"
        class="wo-pagebar__search"
        size="small"
        clearable
        placeholder="搜索：内容/要求"
        @keyup.enter="reload"
      />
      <el-button size="small" :loading="loading" @click="reload">查询</el-button>
      <el-button size="small" :loading="exporting" @click="handleExport">导出</el-button>
    </template>

    <el-card v-loading="loading">
      <div class="batch-bar">
        <div class="batch-bar__left">
          <el-button size="small" type="success" :disabled="!selectedCount" :loading="batchCompleting" @click="openBatchComplete">
            批量完成
          </el-button>
          <el-button size="small" type="danger" :disabled="!selectedCount" :loading="batchCancelling" @click="openBatchCancel">
            批量取消
          </el-button>
          <el-button size="small" type="warning" :disabled="!selectedCount" :loading="batchAssigning" @click="openBatchAssign">
            批量分派
          </el-button>
          <div class="batch-bar__count">已选 {{ selectedCount }} 项</div>
        </div>
      </div>

      <template v-if="isMobile">
        <div class="mobile-list">
          <el-card v-for="row in items" :key="row.id" class="mobile-card" shadow="hover">
            <div class="mobile-card__top">
              <el-checkbox
                :model-value="isSelected(row.id)"
                @update:model-value="(v: boolean) => setSelected(row.id, v)"
              />
              <div class="mobile-card__order">
                {{ row.work_order_process_info?.work_order?.order_number || '-' }}
              </div>
              <el-tag size="small">{{ row.status_display || '-' }}</el-tag>
            </div>

            <div class="mobile-card__meta">
              <div class="mobile-card__line">工序：{{ row.work_order_process_info?.process?.name || '-' }}</div>
              <div class="mobile-card__line">类型：{{ row.task_type_display || '-' }}</div>
              <div class="mobile-card__line">完成：{{ row.quantity_completed ?? 0 }} / {{ row.production_quantity ?? '-' }}</div>
              <div class="mobile-card__line">部门：{{ row.assigned_department_name || '-' }}</div>
              <div class="mobile-card__line">操作员：{{ row.assigned_operator_name || '-' }}</div>
            </div>

            <div class="mobile-card__content">{{ row.work_content || '-' }}</div>
          </el-card>
        </div>
      </template>

      <template v-else>
        <el-table
          :data="items"
          row-key="id"
          style="width: 100%"
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
      </template>

      <div class="wo-pager">
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

    <el-dialog v-model="batchCompleteOpen" title="批量完成任务" :width="isMobile ? '92%' : '520px'">
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

    <el-dialog v-model="batchCancelOpen" title="批量取消任务" :width="isMobile ? '92%' : '520px'">
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

    <el-dialog v-model="batchAssignOpen" title="批量分派任务" :width="isMobile ? '96%' : '560px'">
      <el-form label-width="90px">
        <el-form-item label="部门">
          <el-select v-model="batchAssignDepartmentId" filterable clearable placeholder="可选">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作员">
          <el-select v-model="batchAssignOperatorId" filterable clearable placeholder="可选">
            <el-option v-for="u in users" :key="u.id" :label="u.username" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="batchAssignReason" placeholder="可选" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchAssignNotes" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="batchAssignOpen = false">取消</el-button>
        <el-button size="small" type="warning" :loading="batchAssigning" @click="submitBatchAssign">确定分派</el-button>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageLayout from '../components/PageLayout.vue'
import { useBreakpoints } from '../composables/useBreakpoints'
import { batchAssignTasks, batchCancelTasks, batchCompleteTasks, exportTasks, listTasks, type WorkOrderTaskListItem } from '../api/tasks'
import { downloadBlob, getFilenameFromContentDisposition } from '../lib/download'
import { listAllDepartments, type Department } from '../api/departments'
import { listUsersByDepartment, type UserItem } from '../api/users'

const router = useRouter()
const { isMobile } = useBreakpoints()

const loading = ref(false)
const items = ref<WorkOrderTaskListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const exporting = ref(false)
const selectedIds = reactive(new Set<number>())
const batchCompleteOpen = ref(false)
const batchCompleteReason = ref('')
const batchCompleteNotes = ref('')
const batchCompleting = ref(false)
const batchCancelOpen = ref(false)
const batchCancelReason = ref('')
const batchCancelNotes = ref('')
const batchCancelling = ref(false)
const batchAssignOpen = ref(false)
const batchAssignDepartmentId = ref<number | null>(null)
const batchAssignOperatorId = ref<number | null>(null)
const batchAssignReason = ref('')
const batchAssignNotes = ref('')
const batchAssigning = ref(false)
const departments = ref<Department[]>([])
const users = ref<UserItem[]>([])

const selectedCount = computed(() => selectedIds.size)

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
    selectedIds.clear()
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
  selectedIds.clear()
  for (const row of rows) selectedIds.add(row.id)
}

function isSelected(id: number) {
  return selectedIds.has(id)
}

function setSelected(id: number, v: boolean) {
  if (v) selectedIds.add(id)
  else selectedIds.delete(id)
}

function getSelectedTaskIds() {
  return Array.from(selectedIds.values())
}

function openBatchComplete() {
  if (!selectedIds.size) return
  batchCompleteReason.value = ''
  batchCompleteNotes.value = ''
  batchCompleteOpen.value = true
}

function openBatchCancel() {
  if (!selectedIds.size) return
  batchCancelReason.value = ''
  batchCancelNotes.value = ''
  batchCancelOpen.value = true
}

function openBatchAssign() {
  if (!selectedIds.size) return
  batchAssignDepartmentId.value = null
  batchAssignOperatorId.value = null
  batchAssignReason.value = ''
  batchAssignNotes.value = ''
  batchAssignOpen.value = true
}

async function submitBatchComplete() {
  const taskIds = getSelectedTaskIds()
  if (!taskIds.length) {
    batchCompleteOpen.value = false
    return
  }

  batchCompleting.value = true
  try {
    await batchCompleteTasks({
      task_ids: taskIds,
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
  const taskIds = getSelectedTaskIds()
  if (!taskIds.length) {
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
      task_ids: taskIds,
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

async function submitBatchAssign() {
  const taskIds = getSelectedTaskIds()
  if (!taskIds.length) {
    batchAssignOpen.value = false
    return
  }

  if (!batchAssignDepartmentId.value && !batchAssignOperatorId.value) {
    ElMessage.error('请选择部门或操作员（至少一项）')
    return
  }

  batchAssigning.value = true
  try {
    await batchAssignTasks({
      task_ids: taskIds,
      assigned_department: batchAssignDepartmentId.value,
      assigned_operator: batchAssignOperatorId.value,
      reason: batchAssignReason.value,
      notes: batchAssignNotes.value
    })
    ElMessage.success('批量分派已提交')
    batchAssignOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '批量分派失败')
  } finally {
    batchAssigning.value = false
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
  listAllDepartments()
    .then((rows) => {
      departments.value = rows
    })
    .catch(() => {
      // ignore
    })
  fetchList()
})

watch(
  () => batchAssignDepartmentId.value,
  async (departmentId) => {
    try {
      users.value = await listUsersByDepartment(
        departmentId ? { department_id: departmentId } : undefined
      )
    } catch {
      users.value = []
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
  flex-wrap: wrap;
}
.batch-bar__left {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.batch-bar__count {
  font-size: 12px;
  color: #666;
}
.mobile-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mobile-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.mobile-card__order {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.mobile-card__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  color: #606266;
  font-size: 13px;
}
.mobile-card__content {
  color: #303133;
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
}
</style>
