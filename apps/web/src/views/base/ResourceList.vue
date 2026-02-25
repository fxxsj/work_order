<template>
  <PageLayout :title="title" :show-back="showBack" :loading="loading" @back="goHome">
    <template v-if="totalCount !== null" #titleExtra>
      <el-tag type="info" size="small">共 {{ totalCount }} 条</el-tag>
    </template>

    <template #actions>
      <slot name="filters" />
      <el-input
        v-model="searchQuery"
        class="wo-pagebar__search"
        :placeholder="searchPlaceholder"
        size="small"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
      <el-button size="small" :loading="loading" @click="handleSearch">查询</el-button>
      <el-button v-if="canCreate" size="small" type="primary" @click="emit('create')">新建</el-button>
      <slot name="actions" />
    </template>

    <el-card>
      <div v-if="slots.cardTop" class="card-top">
        <slot name="cardTop" />
      </div>
      <el-table :data="items" :row-key="props.rowKey" style="width: 100%" @row-click="handleRowClick">
        <slot name="columns" />
      </el-table>

      <div class="wo-pager">
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
  </PageLayout>
</template>

<script setup lang="ts" generic="T">
import { onMounted, ref, useSlots } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { PaginatedResult } from '../../api/base'
import { getHttpErrorMessage } from '../../lib/http'
import PageLayout from '../../components/PageLayout.vue'

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
  rowKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  canCreate: true,
  defaultPageSize: 20,
  searchPlaceholder: '搜索...',
  showBack: true,
  rowKey: 'id'
})

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'row-click', item: T): void
}>()

const slots = useSlots()

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
    ElMessage.error(getHttpErrorMessage(err, '加载失败'))
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
.card-top {
  margin-bottom: 12px;
}
</style>
