<template>
  <div class="wo-page" v-loading="loading">
    <div class="wo-pagebar">
      <div class="wo-pagebar__left">
        <el-button v-if="showBack" size="small" @click="$emit('back')">
          {{ backLabel }}
        </el-button>
        <div class="wo-pagebar__title" :title="title">{{ title }}</div>
      </div>
      <div v-if="$slots.actions" class="wo-pagebar__right">
        <slot name="actions" />
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    showBack?: boolean
    backLabel?: string
    loading?: boolean
  }>(),
  {
    showBack: true,
    backLabel: '返回',
    loading: false
  }
)

defineEmits<{
  (e: 'back'): void
}>()
</script>

