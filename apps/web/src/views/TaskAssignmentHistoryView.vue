<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">任务分派历史（vNext）</div>
      </div>
      <div class="right">
        <el-input v-model="taskId" size="small" clearable placeholder="任务ID（可选）" style="width: 140px" @keyup.enter="reload" />
        <el-select v-model="departmentId" size="small" clearable filterable placeholder="部门（可选）" style="width: 160px">
          <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="String(d.id)" />
        </el-select>
        <el-select v-model="operatorId" size="small" clearable filterable placeholder="操作员（可选）" style="width: 160px">
          <el-option v-for="u in users" :key="u.id" :label="u.username" :value="String(u.id)" />
        </el-select>
        <el-date-picker v-model="dateRange" size="small" type="daterange" unlink-panels value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ row.created_at || '-' }}</template>
        </el-table-column>
        <el-table-column label="施工单" width="140">
          <template #default="{ row }">{{ row.work_order_info?.order_number || '-' }}</template>
        </el-table-column>
        <el-table-column label="客户" width="140">
          <template #default="{ row }">{{ row.work_order_info?.customer_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="任务" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            #{{ row.task_info?.id || '-' }} {{ row.task_info?.work_content || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作员" width="120">
          <template #default="{ row }">{{ row.operator_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="内容" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">{{ row.content || '-' }}</template>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAssignmentHistory, type AssignmentHistoryItem } from '../api/tasks'
import { listAllDepartments, type Department } from '../api/departments'
import { listUsersByDepartment, type UserItem } from '../api/users'

const router = useRouter()

const loading = ref(false)
const items = ref<AssignmentHistoryItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const taskId = ref('')
const departmentId = ref<string | null>(null)
const operatorId = ref<string | null>(null)
const dateRange = ref<[string, string] | null>(null)

const departments = ref<Department[]>([])
const users = ref<UserItem[]>([])

async function fetchList() {
  loading.value = true
  try {
    const [startDate, endDate] = dateRange.value || []
    const data = await getAssignmentHistory({
      page: page.value,
      page_size: pageSize.value,
      task_id: taskId.value || undefined,
      department_id: departmentId.value || undefined,
      operator_id: operatorId.value || undefined,
      start_date: startDate,
      end_date: endDate
    })
    items.value = data.results
    total.value = data.total
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

onMounted(() => {
  listAllDepartments()
    .then((rows) => {
      departments.value = rows
    })
    .catch(() => {})

  listUsersByDepartment()
    .then((rows) => {
      users.value = rows
    })
    .catch(() => {})

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

