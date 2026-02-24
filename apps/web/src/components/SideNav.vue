<template>
  <el-menu :default-active="activePath" class="wo-sidenav" router @select="handleSelect">
    <template v-for="group in groups" :key="group.key">
      <el-sub-menu v-if="group.items.length > 1" :index="group.key">
        <template #title>
          <span>{{ group.title }}</span>
        </template>
        <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path">
          {{ item.title }}
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item v-else :index="group.items[0].path">
        {{ group.items[0].title }}
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export type NavItem = {
  path: string
  title: string
  order: number
}

export type NavGroup = {
  key: string
  title: string
  order: number
  items: NavItem[]
}

defineProps<{
  groups: NavGroup[]
}>()

const emit = defineEmits<{
  (e: 'navigate'): void
}>()

const route = useRoute()
const activePath = computed(() => route.path)

function handleSelect() {
  emit('navigate')
}
</script>

