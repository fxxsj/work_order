<template>
  <div class="task-board">
    <!-- 统计信息（放在列表卡片外面） -->
    <task-stats :tasks="tableData" style="margin-bottom: 20px;" />

    <el-card>
      <!-- 头部搜索栏（参考 ProductList 简洁风格） -->
      <div class="header-section">
        <div class="filter-group">
          <el-select
            v-model="selectedDepartment"
            placeholder="选择部门"
            clearable
            filterable
            style="width: 160px; margin-right: 10px;"
            @change="handleDepartmentChange"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
          <el-select
            v-model="selectedStatus"
            placeholder="任务状态"
            clearable
            style="width: 120px; margin-right: 10px;"
            @change="handleStatusChange"
          >
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-input
            v-model="searchText"
            placeholder="搜索任务内容、施工单号"
            style="width: 280px;"
            clearable
            @input="handleSearchDebounced"
            @clear="handleSearch"
          >
            <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
          </el-input>
        </div>
        <div class="action-group">
          <el-button
            :loading="loading"
            icon="el-icon-refresh"
            @click="loadData"
          >
            刷新
          </el-button>
          <el-button
            :type="showListView ? 'default' : 'primary'"
            icon="el-icon-menu"
            @click="toggleView"
          >
            {{ showListView ? '看板视图' : '列表视图' }}
          </el-button>
        </div>
      </div>

      <!-- 看板视图 -->
      <task-board-view
        v-if="!showListView && tableData.length > 0"
        :tasks-by-status="tasksByStatus"
        :editable="canEdit()"
        :loading="loading"
        @task-click="handleTaskClick"
        @task-update="handleTaskUpdate"
        @task-assign="handleTaskAssign"
        @task-complete="handleTaskComplete"
      />

      <!-- 列表视图 -->
      <task-list-view
        v-if="showListView && tableData.length > 0"
        :tasks="tableData"
        :editable="canEdit()"
        :loading="loading"
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        @row-click="handleTaskClick"
        @task-update="handleTaskUpdate"
        @task-assign="handleTaskAssign"
        @task-complete="handleTaskComplete"
        @page-size-change="handleSizeChange"
        @page-change="handlePageChange"
      />

      <!-- 空状态显示（仅当无数据时显示） -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无任务数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button
          v-if="hasFilters"
          type="primary"
          @click="handleReset"
        >
          重置筛选
        </el-button>
      </el-empty>
    </el-card>

    <!-- 更新任务对话框 -->
    <board-update-dialog
      :visible.sync="updateDialogVisible"
      :task="currentTask"
      :loading="updating"
      @confirm="handleConfirmUpdate"
    />

    <!-- 分派任务对话框 -->
    <board-assign-dialog
      :visible.sync="assignDialogVisible"
      :task="currentTask"
      :users="userList"
      :loading="assigning"
      @confirm="handleConfirmAssign"
    />

    <!-- 完成任务对话框 -->
    <board-complete-dialog
      :visible.sync="completeDialogVisible"
      :task="currentTask"
      :loading="completing"
      @confirm="handleConfirmComplete"
    />
  </div>
</template>

<script>
import { departmentAPI, authAPI, workOrderTaskAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'
import TaskStats from './components/TaskStats.vue'
import TaskBoardView from './components/TaskBoardView.vue'
import TaskListView from './components/TaskListView.vue'
import BoardUpdateDialog from './components/BoardUpdateDialog.vue'
import BoardAssignDialog from './components/BoardAssignDialog.vue'
import BoardCompleteDialog from './components/BoardCompleteDialog.vue'

export default {
  name: 'TaskBoard',
  components: {
    TaskStats,
    TaskBoardView,
    TaskListView,
    BoardUpdateDialog,
    BoardAssignDialog,
    BoardCompleteDialog
  },
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // Mixin 配置
      apiService: workOrderTaskAPI,
      permissionPrefix: 'workordertask',

      // 页面状态
      departmentList: [],
      userList: [],
      selectedDepartment: null,
      selectedStatus: '',
      showListView: false,

      // 对话框状态
      updateDialogVisible: false,
      assignDialogVisible: false,
      completeDialogVisible: false,
      currentTask: null,
      updating: false,
      assigning: false,
      completing: false
    }
  },
  computed: {
    tasksByStatus() {
      const grouped = {
        pending: [],
        in_progress: [],
        completed: []
      }

      this.tableData.forEach(task => {
        if (grouped[task.status]) {
          grouped[task.status].push(task)
        }
      })

      return grouped
    },
    // 检查是否有筛选条件
    hasFilters() {
      return this.selectedDepartment || this.selectedStatus || this.searchText
    }
  },
  async created() {
    await this.loadDepartments()
    await this.loadData()
  },
  methods: {
    /**
     * 获取数据（实现 listPageMixin 要求的方法）
     */
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        ordering: '-created_at'
      }

      if (this.selectedDepartment) {
        params.department = this.selectedDepartment
      }

      if (this.selectedStatus) {
        params.status = this.selectedStatus
      }

      if (this.searchText) {
        params.search = this.searchText
      }

      const response = await this.apiService.getList(params)
      return response
    },

    /**
     * 加载部门列表
     */
    async loadDepartments() {
      try {
        const response = await departmentAPI.getList({ page_size: 1000 })
        this.departmentList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载部门列表')
      }
    },

    /**
     * 加载部门用户列表
     */
    async loadUsers(departmentId) {
      try {
        const response = await authAPI.getUsersByDepartment(departmentId)
        this.userList = response.data || response || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载用户列表')
      }
    },

    /**
     * 处理部门切换
     */
    handleDepartmentChange(departmentId) {
      this.currentPage = 1
      this.loadData()
      if (departmentId) {
        this.loadUsers(departmentId)
      }
    },

    /**
     * 处理状态切换
     */
    handleStatusChange() {
      this.currentPage = 1
      this.loadData()
    },

    /**
     * 处理重置筛选
     */
    handleReset() {
      this.selectedDepartment = null
      this.selectedStatus = ''
      this.searchText = ''
      this.currentPage = 1
      this.loadData()
    },

    /**
     * 切换视图
     */
    toggleView() {
      this.showListView = !this.showListView
    },

    /**
     * 处理任务点击（查看详情）
     */
    handleTaskClick(task) {
      this.$router.push({
        name: 'TaskDetail',
        params: { id: task.id }
      })
    },

    /**
     * 处理更新任务
     */
    handleTaskUpdate(task) {
      this.currentTask = task
      this.updateDialogVisible = true
    },

    /**
     * 确认更新任务
     */
    async handleConfirmUpdate(formData) {
      this.updating = true
      try {
        await this.apiService.update(this.currentTask.id, formData)
        ErrorHandler.showSuccess('任务更新成功')
        this.updateDialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '更新任务')
      } finally {
        this.updating = false
      }
    },

    /**
     * 处理分派任务
     */
    handleTaskAssign(task) {
      this.currentTask = task

      // 加载该工序所在部门的用户
      if (task.work_order_process_info?.process?.department) {
        this.loadUsers(task.work_order_process_info.process.department)
      }

      this.assignDialogVisible = true
    },

    /**
     * 确认分派任务
     */
    async handleConfirmAssign(formData) {
      this.assigning = true
      try {
        await this.apiService.assign(this.currentTask.id, formData)
        ErrorHandler.showSuccess('任务分派成功')
        this.assignDialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '分派任务')
      } finally {
        this.assigning = false
      }
    },

    /**
     * 处理完成任务
     */
    handleTaskComplete(task) {
      this.currentTask = task
      this.completeDialogVisible = true
    },

    /**
     * 确认完成任务
     */
    async handleConfirmComplete(formData) {
      this.completing = true
      try {
        await this.apiService.complete(this.currentTask.id, formData)
        ErrorHandler.showSuccess('任务完成成功')
        this.completeDialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '完成任务')
      } finally {
        this.completing = false
      }
    }
  }
}
</script>

<style scoped>
.task-board {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
