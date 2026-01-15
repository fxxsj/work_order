<template>
  <div class="task-filters">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-select
          :value="selectedDepartment"
          placeholder="选择部门查看任务"
          clearable
          filterable
          @change="handleDepartmentChange"
          style="width: 100%;"
        >
          <el-option
            v-for="dept in departments"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          ></el-option>
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-input
          :value="searchText"
          placeholder="搜索任务内容、施工单号"
          clearable
          @input="handleSearchInput"
          @clear="handleClear"
        >
          <el-button
            slot="append"
            icon="el-icon-search"
            @click="handleSearch"
          ></el-button>
        </el-input>
      </el-col>
      <el-col :span="12" style="text-align: right;">
        <el-button
          :loading="loading"
          icon="el-icon-refresh"
          @click="handleRefresh"
        >
          刷新
        </el-button>
        <el-button
          type="primary"
          icon="el-icon-view"
          @click="handleViewToggle"
        >
          {{ isListView ? '看板视图' : '列表视图' }}
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'TaskFilters',
  props: {
    departments: {
      type: Array,
      default: () => []
    },
    selectedDepartment: {
      type: [Number, null],
      default: null
    },
    searchText: {
      type: String,
      default: ''
    },
    isListView: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleDepartmentChange(value) {
      this.$emit('department-change', value)
    },
    handleSearchInput(value) {
      this.$emit('search-input', value)
    },
    handleSearch() {
      this.$emit('search')
    },
    handleClear() {
      this.$emit('clear')
    },
    handleRefresh() {
      this.$emit('refresh')
    },
    handleViewToggle() {
      this.$emit('view-toggle')
    }
  }
}
</script>

<style scoped>
.task-filters {
  padding: 10px 0;
}
</style>
