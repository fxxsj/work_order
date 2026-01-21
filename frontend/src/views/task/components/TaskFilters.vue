<template>
  <div class="task-filters">
    <el-row :gutter="16">
      <el-col :span="5">
        <el-select
          :value="selectedDepartment"
          placeholder="选择部门"
          clearable
          filterable
          style="width: 100%;"
          @change="handleDepartmentChange"
        >
          <el-option
            v-for="dept in departments"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-select
          :value="selectedStatus"
          placeholder="任务状态"
          clearable
          style="width: 100%;"
          @change="handleStatusChange"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-select
          :value="selectedTaskType"
          placeholder="任务类型"
          clearable
          style="width: 100%;"
          @change="handleTaskTypeChange"
        >
          <el-option
            v-for="item in taskTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-col>
      <el-col :span="5">
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
          />
        </el-input>
      </el-col>
      <el-col :span="6" style="text-align: right;">
        <el-button
          icon="el-icon-refresh-left"
          @click="handleReset"
        >
          重置
        </el-button>
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
// 状态选项
const STATUS_OPTIONS = [
  { value: 'pending', label: '待开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' }
]

// 任务类型选项
const TASK_TYPE_OPTIONS = [
  { value: 'normal', label: '普通任务' },
  { value: 'urgent', label: '紧急任务' },
  { value: 'rework', label: '返工任务' }
]

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
    selectedStatus: {
      type: String,
      default: ''
    },
    selectedTaskType: {
      type: String,
      default: ''
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
  data() {
    return {
      statusOptions: STATUS_OPTIONS,
      taskTypeOptions: TASK_TYPE_OPTIONS
    }
  },
  methods: {
    handleDepartmentChange(value) {
      this.$emit('department-change', value)
    },
    handleStatusChange(value) {
      this.$emit('status-change', value)
    },
    handleTaskTypeChange(value) {
      this.$emit('task-type-change', value)
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
    handleReset() {
      this.$emit('reset')
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
  margin-bottom: 15px;
}
</style>
