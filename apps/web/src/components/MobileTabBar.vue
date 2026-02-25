<template>
  <nav class="wo-tabbar">
    <button type="button" class="wo-tabbar__item" :class="{ active: isActive('/') }" @click="go('/')">
      <el-icon :size="18"><HomeFilled /></el-icon>
      <span>工作台</span>
    </button>
    <button
      type="button"
      class="wo-tabbar__item"
      :class="{ active: isActive('/workorders') }"
      @click="go('/workorders')"
    >
      <el-icon :size="18"><Document /></el-icon>
      <span>施工单</span>
    </button>
    <button type="button" class="wo-tabbar__item" :class="{ active: isActive('/tasks') }" @click="go('/tasks')">
      <el-icon :size="18"><List /></el-icon>
      <span>任务</span>
    </button>
    <button
      type="button"
      class="wo-tabbar__item"
      :class="{ active: isActive('/notifications') }"
      @click="go('/notifications')"
    >
      <el-icon :size="18"><Bell /></el-icon>
      <span>
        通知<span v-if="unreadCount" class="wo-tabbar__badge">{{ unreadCount }}</span>
      </span>
    </button>
    <button type="button" class="wo-tabbar__item" :class="{ active: isActive('/scan') }" @click="go('/scan')">
      <el-icon :size="18"><Camera /></el-icon>
      <span>扫码</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Bell, Camera, Document, HomeFilled, List } from '@element-plus/icons-vue'

defineProps<{
  unreadCount: number
}>()

const router = useRouter()
const route = useRoute()

function go(path: string) {
  router.push(path)
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
