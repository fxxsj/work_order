<template>
  <div class="date-range-picker">
    <el-date-picker
      v-model="dateRange"
      type="daterange"
      :start-placeholder="startPlaceholder"
      :end-placeholder="endPlaceholder"
      :range-separator="rangeSeparator"
      :clearable="clearable"
      :value-format="valueFormat"
      :format="format"
      :picker-options="pickerOptions"
      :unlink-panels="unlinkPanels"
      :disabled="disabled"
      @change="handleChange"
    />
  </div>
</template>

<script>
export default {
  name: 'DateRangePicker',
  props: {
    // 绑定值
    value: {
      type: Array,
      default: () => []
    },
    // 开始日期占位符
    startPlaceholder: {
      type: String,
      default: '开始日期'
    },
    // 结束日期占位符
    endPlaceholder: {
      type: String,
      default: '结束日期'
    },
    // 分隔符
    rangeSeparator: {
      type: String,
      default: '至'
    },
    // 是否可清空
    clearable: {
      type: Boolean,
      default: true
    },
    // 日期格式
    valueFormat: {
      type: String,
      default: 'yyyy-MM-dd'
    },
    // 显示格式
    format: {
      type: String,
      default: 'yyyy-MM-dd'
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 是否解绑面板
    unlinkPanels: {
      type: Boolean,
      default: false
    },
    // 快捷选项
    shortcuts: {
      type: Array,
      default: () => []
    },
    // 禁用日期
    disabledDate: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      dateRange: this.value || []
    }
  },
  computed: {
    pickerOptions() {
      const options = {}

      if (this.shortcuts && this.shortcuts.length > 0) {
        options.shortcuts = this.shortcuts
      }

      if (this.disabledDate) {
        options.disabledDate = this.disabledDate
      }

      return options
    }
  },
  watch: {
    value: {
      handler(val) {
        this.dateRange = val || []
      },
      immediate: true
    }
  },
  methods: {
    // 处理变化
    handleChange(value) {
      this.$emit('input', value)
      this.$emit('change', value)
    },
    // 获取开始日期
    getStartDate() {
      return this.dateRange && this.dateRange[0] ? this.dateRange[0] : null
    },
    // 获取结束日期
    getEndDate() {
      return this.dateRange && this.dateRange[1] ? this.dateRange[1] : null
    }
  }
}
</script>

<style scoped>
.date-range-picker {
  display: inline-block;
}
</style>
