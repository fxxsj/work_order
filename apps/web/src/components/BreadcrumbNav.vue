<template>
  <el-breadcrumb class="wo-breadcrumb" separator="/">
    <el-breadcrumb-item :to="{ path: '/' }">工作台</el-breadcrumb-item>
    <el-breadcrumb-item v-if="groupTitle && groupPath" :to="{ path: groupPath }">
      {{ groupTitle }}
    </el-breadcrumb-item>
    <el-breadcrumb-item v-if="pageTitle">
      {{ pageTitle }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { authedNavGroups } from '../router'

const route = useRoute()

const pageTitle = computed(() => (route.meta?.title as string | undefined) || '')
const groupTitle = computed(() => {
  const g = (route.meta?.group as string | undefined) || ''
  return g && g !== '工作台' ? g : ''
})

const groupPath = computed(() => {
  if (!groupTitle.value) return ''
  const g = authedNavGroups.find((x) => x.title === groupTitle.value)
  return g?.items?.[0]?.path || ''
})
</script>

