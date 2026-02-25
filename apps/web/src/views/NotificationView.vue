<template>
  <PageLayout title="通知中心（vNext）" @back="goHome">
    <template #actions>
      <el-tag type="info">未读：{{ store.unreadCount }}</el-tag>
      <el-button size="small" :loading="loading" @click="reload">刷新</el-button>
      <el-button size="small" type="primary" :disabled="store.unreadCount === 0" @click="handleMarkAllRead">
        全部已读
      </el-button>
    </template>

    <el-card v-loading="loading">
      <template v-if="isMobile">
        <div class="mobile-list">
          <el-card v-for="row in items" :key="row.id" shadow="hover">
            <div class="mobile-card__top">
              <div class="mobile-card__title">{{ row.title || '-' }}</div>
              <el-tag v-if="row.is_read" size="small" type="success">已读</el-tag>
              <el-tag v-else size="small" type="warning">未读</el-tag>
            </div>

            <div class="mobile-card__content">{{ row.content || '-' }}</div>

            <div class="mobile-card__meta">
              <span>{{ row.created_at || '-' }}</span>
              <el-button v-if="!row.is_read" size="small" @click="handleMarkRead(row.id)">标记已读</el-button>
              <span v-else class="muted">-</span>
            </div>
          </el-card>
        </div>
      </template>

      <template v-else>
        <el-table :data="items" row-key="id" style="width: 100%">
          <el-table-column prop="created_at" label="时间" width="200" />
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="content" label="内容" min-width="260" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.is_read" type="success">已读</el-tag>
              <el-tag v-else type="warning">未读</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110">
            <template #default="{ row }">
              <el-button v-if="!row.is_read" size="small" @click="handleMarkRead(row.id)">标记已读</el-button>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
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
  </PageLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageLayout from '../components/PageLayout.vue'
import { useBreakpoints } from '../composables/useBreakpoints'
import { listNotifications, markAllRead, markRead, type NotificationItem } from '../api/notifications'
import { useNotificationsStore } from '../stores/notifications'

const router = useRouter()
const store = useNotificationsStore()
const { isMobile } = useBreakpoints()

const loading = ref(false)
const items = ref<NotificationItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

async function fetchList() {
  loading.value = true
  try {
    const data = await listNotifications({
      page: page.value,
      page_size: pageSize.value
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
  fetchList()
  store.refreshUnreadCount()
}

async function handleMarkRead(id: number) {
  try {
    await markRead(id)
    ElMessage.success('已标记为已读')
    reload()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '操作失败')
  }
}

async function handleMarkAllRead() {
  try {
    await markAllRead()
    ElMessage.success('已全部标记为已读')
    reload()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '操作失败')
  }
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
  store.refreshUnreadCount()
  store.connectIfNeeded()
  fetchList()
})
</script>

<style scoped>
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
.mobile-card__title {
  font-weight: 600;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-card__content {
  color: #303133;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}
.mobile-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #909399;
  font-size: 12px;
}
.muted {
  color: #999;
}
</style>
