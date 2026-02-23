<template>
  <div class="resource-list">
    <div class="bar">
      <div class="left">
        <el-button v-if="showBack" size="small" @click="goHome">返回</el-button>
        <div class="title">{{ title }}</div>
        <el-tag v-if="totalCount !== null" type="info" size="small">共 {{ totalCount }} 条</el-tag>
      </div>

      <div class="right">
        <slot name="filters" />
        <el-input
          v-model="searchQuery"
          :placeholder="searchPlaceholder"
          size="small"
          clearable
          style="width: 260px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-button size="small" :loading="loading" @click="handleSearch">查询</el-button>
        <el-button v-if="canCreate" size="small" type="primary" @click="emit('create')">新建</el-button>
        <slot name="actions" />
      </div>
    </div>

    <el-card>
      <el-table v-loading="loading" :data="items" style="width: 100%" @row-click="handleRowClick">
        <slot name="columns" />
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="totalCount || 0"
          :page-size="pageSize"
          :current-page="currentPage"
          @update:current-page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts" generic="T">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { PaginatedResult } from '../../api/base'

type Api<TItem> = {
  list: (params?: any) => Promise<PaginatedResult<TItem>>
}

type Props = {
  title: string
  api: Api<T>
  extraParams?: Record<string, any> | (() => Record<string, any>)
  canCreate?: boolean
  defaultPageSize?: number
  searchPlaceholder?: string
  showBack?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canCreate: true,
  defaultPageSize: 20,
  searchPlaceholder: '搜索...',
  showBack: true
})

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'row-click', item: T): void
}>()

const router = useRouter()

const loading = ref(false)
const items = ref<T[]>([])
const totalCount = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(props.defaultPageSize)
const searchQuery = ref('')

async function loadData() {
  loading.value = true
  try {
    const extraParams = typeof props.extraParams === 'function' ? props.extraParams() : props.extraParams
    const data = await props.api.list({
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchQuery.value || undefined,
      ...(extraParams || {})
    })
    items.value = data.results
    totalCount.value = data.count
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadData()
}

function handlePageChange(next: number) {
  currentPage.value = next
  loadData()
}

function handlePageSizeChange(next: number) {
  pageSize.value = next
  currentPage.value = 1
  loadData()
}

function handleRowClick(row: T) {
  emit('row-click', row)
}

function goHome() {
  router.push({ name: 'dashboard' })
}

defineExpose({ loadData, handleSearch })

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.resource-list {
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
  gap: 12px;
  min-width: 220px;
}
.right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title {
  font-size: 14px;
  font-weight: 600;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
