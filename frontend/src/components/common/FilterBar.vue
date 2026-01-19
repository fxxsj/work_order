<template>
  <div class="filter-bar">
    <el-form :inline="true" :model="filterData" class="filter-form">
      <template v-for="field in fields">
        <!-- 文本输入 -->
        <el-form-item
          v-if="field.type === 'text'"
          :key="field.name"
          :label="field.label"
        >
          <el-input
            v-model="filterData[field.name]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :clearable="field.clearable !== false"
            @input="handleFilterChange"
          />
        </el-form-item>

        <!-- 选择器 -->
        <el-form-item
          v-else-if="field.type === 'select'"
          :key="field.name"
          :label="field.label"
        >
          <el-select
            v-model="filterData[field.name]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :filterable="field.filterable"
            :multiple="field.multiple"
            @change="handleFilterChange"
          >
            <el-option
              v-for="option in field.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <!-- 日期选择 -->
        <el-form-item
          v-else-if="field.type === 'date'"
          :key="field.name"
          :label="field.label"
        >
          <el-date-picker
            v-model="filterData[field.name]"
            type="date"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            value-format="yyyy-MM-dd"
            @change="handleFilterChange"
          />
        </el-form-item>

        <!-- 日期范围 -->
        <el-form-item
          v-else-if="field.type === 'date-range'"
          :key="field.name"
          :label="field.label"
        >
          <el-date-picker
            v-model="filterData[field.name]"
            type="daterange"
            :start-placeholder="field.startPlaceholder || '开始日期'"
            :end-placeholder="field.endPlaceholder || '结束日期'"
            :clearable="field.clearable !== false"
            value-format="yyyy-MM-dd"
            @change="handleFilterChange"
          />
        </el-form-item>

        <!-- 数字输入 -->
        <el-form-item
          v-else-if="field.type === 'number'"
          :key="field.name"
          :label="field.label"
        >
          <el-input-number
            v-model="filterData[field.name]"
            :min="field.min"
            :max="field.max"
            :precision="field.precision"
            :controls-position="field.controlsPosition || 'right'"
            @change="handleFilterChange"
          />
        </el-form-item>
      </template>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'FilterBar',
  props: {
    // 筛选字段配置
    fields: {
      type: Array,
      required: true
    },
    // 筛选数据
    value: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      filterData: {}
    }
  },
  watch: {
    value: {
      handler(val) {
        this.filterData = { ...val }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    // 处理筛选变化
    handleFilterChange() {
      this.$emit('input', { ...this.filterData })
      this.$emit('change', { ...this.filterData })
    },
    // 处理查询
    handleSearch() {
      this.$emit('search', { ...this.filterData })
    },
    // 处理重置
    handleReset() {
      this.fields.forEach(field => {
        if (field.type === 'date-range') {
          this.filterData[field.name] = []
        } else {
          this.filterData[field.name] = field.multiple ? [] : null
        }
      })
      this.$emit('reset')
    }
  }
}
</script>

<style scoped>
.filter-bar {
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 20px;
}

.filter-form {
  margin-bottom: 0;
}

.filter-form .el-form-item {
  margin-bottom: 10px;
}
</style>
