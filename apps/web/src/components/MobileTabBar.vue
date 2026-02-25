<template>
  <nav class="wo-tabbar">
    <button type="button" class="wo-tabbar__item" :class="{ active: isActive('/') }" @click="go('/')">
      工作台
    </button>
    <button
      type="button"
      class="wo-tabbar__item"
      :class="{ active: isActive('/workorders') }"
      @click="go('/workorders')"
    >
      施工单
    </button>
    <button type="button" class="wo-tabbar__item" :class="{ active: isActive('/tasks') }" @click="go('/tasks')">
      任务
    </button>
    <button
      type="button"
      class="wo-tabbar__item"
      :class="{ active: isActive('/notifications') }"
      @click="go('/notifications')"
    >
      通知<span v-if="unreadCount" class="wo-tabbar__badge">{{ unreadCount }}</span>
    </button>
    <button type="button" class="wo-tabbar__item" :class="{ active: isActive('/scan') }" @click="go('/scan')">
      扫码
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

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

