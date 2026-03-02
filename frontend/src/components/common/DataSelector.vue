<template>
  <el-select
    v-model="selectedValue"
    :remote="true"
    :remote-method="remoteMethod"
    :loading="loading"
    :clearable="clearable"
    :filterable="filterable"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="placeholder"
    :collapse-tags="collapseTags"
    value-key="valueKey"
    @change="handleChange"
    @focus="handleFocus"
  >
    <el-option
      v-for="item in options"
      :key="item[valueKey]"
      :label="item[labelKey]"
      :value="item[valueKey]"
    >
      <slot name="option" :option="item">
        {{ item[labelKey] }}
      </slot>
    </el-option>
  </el-select>
</template>

<script>
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'DataSelector',
  props: {
    // 获取数据的方法
    fetchMethod: {
      type: Function,
      required: true
    },
    // 用于显示的键
    labelKey: {
      type: String,
      default: 'label'
    },
    // 用于值的键
    valueKey: {
      type: String,
      default: 'value'
    },
    // 绑定值
    value: {
      type: [String, Number, Array],
      default: ''
    },
    // 占位符
    placeholder: {
      type: String,
      default: '请选择'
    },
    // 是否可清空
    clearable: {
      type: Boolean,
      default: true
    },
    // 是否可搜索
    filterable: {
      type: Boolean,
      default: true
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 是否多选
    multiple: {
      type: Boolean,
      default: false
    },
    // 是否折叠标签
    collapseTags: {
      type: Boolean,
      default: false
    },
    // 查询参数
    params: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      loading: false,
      options: [],
      selectedValue: this.value
    }
  },
  watch: {
    value(val) {
      this.selectedValue = val
    }
  },
  methods: {
    // 远程搜索
    async remoteMethod(query) {
      if (query === '') {
        this.options = []
        return
      }

      this.loading = true
      try {
        const response = await this.fetchMethod({
          search: query,
          ...this.params
        })

        const payload = response?.data ?? response
        if (Array.isArray(payload)) {
          this.options = payload
        } else if (payload?.results) {
          this.options = payload.results
        } else if (payload?.items) {
          this.options = payload.items
        } else {
          this.options = []
        }
      } catch (error) {
        ErrorHandler.handle(error, 'DataSelector.remoteMethod')
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },
    // 处理变化
    handleChange(value) {
      this.$emit('input', value)
      this.$emit('change', value)
    },
    // 处理焦点
    handleFocus() {
      if (this.options.length === 0) {
        this.remoteMethod('')
      }
      this.$emit('focus')
    }
  }
}
</script>
