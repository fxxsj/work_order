<template>
  <el-tag
    :type="tagType"
    :size="size"
    :effect="effect"
    :hit="hit"
    :disable-transitions="disableTransitions"
    :color="color"
  >
    <slot>
      {{ displayText }}
    </slot>
    <i v-if="icon" :class="icon" class="status-icon"></i>
  </el-tag>
</template>

<script>
export default {
  name: 'StatusTag',
  props: {
    // 状态值
    status: {
      type: [String, Number],
      required: true
    },
    // 状态映射配置
    statusMap: {
      type: Object,
      default: () => ({})
    },
    // 大小
    size: {
      type: String,
      default: 'medium',
      validator: (val) => ['medium', 'small', 'mini'].includes(val)
    },
    // 主题风格
    effect: {
      type: String,
      default: 'light',
      validator: (val) => ['dark', 'light', 'plain'].includes(val)
    },
    // 是否空心
    hit: {
      type: Boolean,
      default: false
    },
    // 禁用渐变动画
    disableTransitions: {
      type: Boolean,
      default: false
    },
    // 自定义颜色
    color: {
      type: String,
      default: ''
    }
  },
  computed: {
    // 获取状态配置
    statusConfig() {
      return this.statusMap[this.status] || {}
    },
    // 获取标签类型
    tagType() {
      return this.statusConfig.type || 'info'
    },
    // 获取显示文本
    displayText() {
      return this.statusConfig.text || this.status
    },
    // 获取图标类名
    icon() {
      return this.statusConfig.icon || ''
    }
  }
}
</script>

<style scoped>
.status-icon {
  margin-right: 4px;
}

.el-tag .status-icon + span {
  margin-left: 4px;
}
</style>
