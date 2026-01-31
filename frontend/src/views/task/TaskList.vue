<template>
  <div class="task-list">
    <el-card>
      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="5">
            <el-input
              v-model="searchText"
              placeholder="搜索任务内容、施工单号"
              clearable
              @input="handleSearchDebounced"
              @clear="handleSearchDebounced"
            >
              <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
            </el-input>
          </el-col>
          <el-col :span="3">
            <el-select
              v-model="filters.status"
              placeholder="任务状态"
              clearable
              @change="handleSearchDebounced"
            >
              <el-option
                v-for="status in taskStatusOptions"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select
              v-model="filters.task_type"
              placeholder="任务类型"
              clearable
              @change="handleSearchDebounced"
            >
              <el-option
                v-for="type in taskTypeOptions"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select
              v-model="filters.assigned_department"
              placeholder="分派部门"
              clearable
              filterable
              @change="handleSearchDebounced"
            >
              <el-option
                v-for="dept in departmentList"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select
              v-model="filters.priority"
              placeholder="优先级"
              clearable
              @change="handleSearchDebounced"
            >
              <el-option
                v-for="p in priorityOptions"
                :key="p.value"
                :label="p.label"
                :value="p.value"
              />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select
              v-model="filters.work_order_process"
              placeholder="工序"
              clearable
              filterable
              @change="handleSearchDebounced"
            >
              <el-option
                v-for="process in processList"
                :key="process.id"
                :label="process.name"
                :value="process.id"
              />
            </el-select>
          </el-col>
          <el-col :span="7" style="text-align: right;">
            <el-button icon="el-icon-refresh-left" @click="resetFilters">
              重置筛选
            </el-button>
            <el-button
              v-if="canExport()"
              type="success"
              icon="el-icon-download"
              :loading="exporting"
              @click="handleExport"
            >
              导出Excel
            </el-button>
            <el-button type="primary" icon="el-icon-refresh" @click="loadData">
              刷新
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 视图切换 -->
      <div style="margin-top: 20px; margin-bottom: 10px; text-align: right;">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="table">
            列表视图
          </el-radio-button>
          <el-radio-button label="kanban">
            看板视图
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 骨架屏 -->
      <SkeletonLoader
        v-if="loading && tableData.length === 0"
        type="table"
        :rows="5"
        style="margin-top: 20px;"
      />

      <!-- 看板视图 -->
      <TaskKanban
        v-if="viewMode === 'kanban'"
        :tasks="tableData"
        @task-click="handleTaskClickFromKanban"
      />

      <!-- 任务列表 -->
      <el-table
        v-if="viewMode === 'table'"
        ref="taskTable"
        v-loading="loading && tableData.length > 0"
        :data="tableData"
        border
        style="width: 100%; margin-top: 20px;"
        :row-key="getRowKey"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
          :selectable="checkRowSelectable"
        />
        <el-table-column type="expand" width="50">
          <template slot-scope="scope">
            <TaskLogs :task="scope.row" />
          </template>
        </el-table-column>
        <el-table-column
          prop="id"
          label="ID"
          width="80"
          sortable="custom"
        />
        <el-table-column label="施工单号" width="150">
          <template slot-scope="scope">
            <el-link
              v-if="scope.row.work_order_process_info?.work_order?.id"
              type="primary"
              @click="goToWorkOrderDetail(scope.row.work_order_process_info.work_order)"
            >
              {{ scope.row.work_order_process_info.work_order.order_number || '-' }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="工序" width="120">
          <template slot-scope="scope">
            {{ scope.row.work_order_process_info?.process?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="work_content"
          label="任务内容"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="分派部门" width="120">
          <template slot-scope="scope">
            {{ scope.row.assigned_department_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="分派操作员" width="120">
          <template slot-scope="scope">
            {{ scope.row.assigned_operator_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="关联对象" width="150">
          <template slot-scope="scope">
            <TaskRelatedInfo :task="scope.row" />
          </template>
        </el-table-column>
        <el-table-column
          prop="production_quantity"
          label="生产数量"
          width="100"
          align="right"
        />
        <el-table-column
          prop="quantity_completed"
          label="完成数量"
          width="100"
          align="right"
        />
        <el-table-column label="进度" width="80" align="right">
          <template slot-scope="scope">
            {{ taskService.calculateProgress(scope.row) }}%
          </template>
        </el-table-column>
        <el-table-column prop="status_display" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag
              :type="taskService.getStatusType(scope.row.status)"
              size="small"
            >
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template slot-scope="scope">
            <TaskActions
              :task="scope.row"
              @complete="handleCompleteTask"
              @update="showUpdateDialog"
              @assign="showAssignDialog"
              @split="showSplitDialog"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        v-if="viewMode === 'table' && total > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />

      <!-- 空状态（完善版） -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        :description="hasFilters ? '未找到匹配的任务' : '暂无任务数据'"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="hasFilters" type="primary" @click="resetFilters">
          重置筛选
        </el-button>
      </el-empty>
    </el-card>

    <!-- 批量操作栏 -->
    <BatchActionBar
      v-if="selectedTasks.length > 0"
      :selected-count="selectedTasks.length"
      :loading="batchOperationLoading"
      :can-batch-assign="canBatchAssign()"
      :can-batch-complete="canBatchComplete()"
      :can-batch-delete="canBatchDelete()"
      :can-batch-cancel="canBatchCancel()"
      @batch-assign="handleBatchAssign"
      @batch-complete="handleBatchComplete"
      @batch-delete="handleBatchDelete"
      @batch-cancel="handleBatchCancel"
      @clear-selection="clearSelection"
    />

    <!-- 完成任务对话框 -->
    <CompleteTaskDialog
      :visible.sync="completeTaskDialogVisible"
      :task="currentTask"
      @confirm="handleConfirmCompleteTask"
    />

    <!-- 更新数量对话框 -->
    <UpdateTaskDialog
      :visible.sync="updateDialogVisible"
      :task="currentTask"
      @confirm="handleUpdateTask"
    />

    <!-- 分派任务对话框 -->
    <AssignTaskDialog
      :visible.sync="assignDialogVisible"
      :task="currentTask"
      :department-list="departmentList"
      :user-list="userList"
      :loading-departments="loadingDepartments"
      :loading-users="loadingUsers"
      @confirm="handleAssignTask"
      @department-change="handleDepartmentChange"
    />

    <!-- 拆分任务对话框 -->
    <SplitTaskDialog
      :visible.sync="splitDialogVisible"
      :task="currentSplitTask"
      :department-list="departmentList"
      :user-list="userList"
      :loading-departments="loadingDepartments"
      :loading-users="loadingUsers"
      @confirm="handleSplitTask"
    />

    <!-- 批量分派对话框 -->
    <BatchAssignDialog
      :visible.sync="batchAssignDialogVisible"
      :task-count="selectedTasks.length"
      :department-list="departmentList"
      @confirm="handleConfirmBatchAssign"
    />
  </div>
</template>

<script>
import { workOrderTaskAPI, departmentAPI, processAPI } from '@/api/modules'
import { getUserList } from '@/api/user'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import exportMixin from '@/mixins/exportMixin'
import Pagination from '@/components/common/Pagination.vue'
import ErrorHandler from '@/utils/errorHandler'
import { debounce } from '@/utils/debounce'
import taskService from '@/services/TaskService'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import TaskKanban from '@/components/TaskKanban.vue'

// 子组件
import TaskLogs from './components/TaskLogs.vue'
import TaskRelatedInfo from './components/TaskRelatedInfo.vue'
import TaskActions from './components/TaskActions.vue'
import CompleteTaskDialog from './components/CompleteTaskDialog.vue'
import UpdateTaskDialog from './components/UpdateTaskDialog.vue'
import AssignTaskDialog from './components/AssignTaskDialog.vue'
import SplitTaskDialog from './components/SplitTaskDialog.vue'
import BatchActionBar from './components/BatchActionBar.vue'
import BatchAssignDialog from './components/BatchAssignDialog.vue'
import VirtualTable from '@/components/VirtualTable.vue'

export default {
  name: 'TaskList',

  components: {
    Pagination,
    SkeletonLoader,
    TaskKanban,
    TaskLogs,
    TaskRelatedInfo,
    TaskActions,
    CompleteTaskDialog,
    UpdateTaskDialog,
    AssignTaskDialog,
    SplitTaskDialog,
    BatchActionBar,
    BatchAssignDialog,
    VirtualTable
  },

  mixins: [listPageMixin, crudPermissionMixin, exportMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: workOrderTaskAPI,
      permissionPrefix: 'workordertask',

      // TaskService（保留业务逻辑）
      taskService,

      // 视图模式
      viewMode: 'table',

      // 额外的筛选条件
      filters: {
        task_type: '',
        work_order_process: '',
        assigned_department: '',
        priority: ''
      },

      // 选项数据
      processList: [],
      departmentList: [],
      userList: [],
      loadingDepartments: false,
      loadingUsers: false,

      // 排序
      ordering: '-created_at',

      // 对话框状态
      completeTaskDialogVisible: false,
      updateDialogVisible: false,
      assignDialogVisible: false,
      splitDialogVisible: false,
      currentTask: null,
      currentSplitTask: null,

      // 导出状态
      exporting: false,

      // 批量操作
      selectedTasks: [],
      batchOperationLoading: false,
      batchAssignDialogVisible: false
    }
  },

  computed: {
    /**
     * 任务状态选项
     */
    taskStatusOptions() {
      return this.taskService.getStatusOptions()
    },

    /**
     * 任务类型选项
     */
    taskTypeOptions() {
      return this.taskService.getTaskTypeOptions()
    },

    /**
     * 优先级选项
     */
    priorityOptions() {
      return [
        { value: 'low', label: '低' },
        { value: 'normal', label: '普通' },
        { value: 'high', label: '高' },
        { value: 'urgent', label: '紧急' }
      ]
    },

    /**
     * 是否有筛选条件
     */
    hasFilters() {
      return this.searchText ||
             this.filters.status ||
             this.filters.task_type ||
             this.filters.assigned_department ||
             this.filters.work_order_process ||
             this.filters.priority
    },

    /**
     * 是否启用虚拟滚动（总数超过100条时启用）
     */
    shouldUseVirtualScroll() {
      return this.total > 100
    }
  },

  created() {
    this.initData()
  },

  methods: {
    /**
     * 初始化数据
     */
    async initData() {
      await Promise.all([
        this.loadProcessList(),
        this.loadDepartmentList()
      ])
      await this.loadData()
    },

    /**
     * 获取数据（listPageMixin 要求实现）
     */
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        ordering: this.ordering,
        search: this.searchText || undefined,
        status: this.filters.status || undefined,
        task_type: this.filters.task_type || undefined,
        work_order_process: this.filters.work_order_process || undefined,
        assigned_department: this.filters.assigned_department || undefined,
        priority: this.filters.priority || undefined
      }
      return await this.apiService.getList(params)
    },

    /**
     * 加载工序列表
     */
    async loadProcessList() {
      try {
        const response = await processAPI.getList({ page_size: 1000 })
        this.processList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载工序列表')
      }
    },

    /**
     * 加载部门列表
     */
    async loadDepartmentList() {
      if (this.departmentList.length > 0) return

      this.loadingDepartments = true
      try {
        const response = await departmentAPI.getList({ page_size: 1000 })
        this.departmentList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载部门列表')
      } finally {
        this.loadingDepartments = false
      }
    },

    /**
     * 加载用户列表
     */
    async loadUserList(departmentId = null) {
      this.loadingUsers = true
      try {
        const params = departmentId ? { department: departmentId } : {}
        const response = await getUserList(params)
        this.userList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载用户列表')
      } finally {
        this.loadingUsers = false
      }
    },

    /**
     * 防抖搜索
     */
    handleSearchDebounced: debounce(function () {
      this.handleSearch()
    }, 300),

    /**
     * 排序变化
     */
    handleSortChange({ prop, order }) {
      if (order && prop) {
        this.ordering = order === 'ascending' ? prop : `-${prop}`
        this.currentPage = 1
        this.loadData()
      }
    },

    /**
     * 表格行键
     */
    getRowKey(row) {
      return row.id
    },

    /**
     * 表格选择变化
     */
    handleSelectionChange(selection) {
      this.selectedTasks = selection
    },

    /**
     * 检查行是否可选择
     */
    checkRowSelectable(row) {
      // 草稿任务和已取消任务不允许批量操作
      if (row.status === 'cancelled') {
        return false
      }
      // 操作员只能选择自己的任务
      if (!this.$store.getters['auth/hasPermission']('workorder.change_workorder')) {
        return row.assigned_operator === this.$store.getters['auth/currentUser'].id
      }
      return true
    },

    /**
     * 清空选择
     */
    clearSelection() {
      this.$refs.taskTable.clearSelection()
      this.selectedTasks = []
    },

    /**
     * 检查虚拟表格行是否选中
     */
    isRowSelected(row) {
      return this.selectedTasks.some(t => t.id === row.id)
    },

    /**
     * 切换虚拟表格行选择
     */
    toggleRowSelection(row) {
      const index = this.selectedTasks.findIndex(t => t.id === row.id)
      if (index > -1) {
        this.selectedTasks.splice(index, 1)
      } else {
        this.selectedTasks.push(row)
      }
    },

    /**
     * 从看板点击任务
     */
    handleTaskClickFromKanban(task) {
      if (task.work_order_id) {
        this.$router.push(`/workorders/${task.work_order_id}`)
      }
    },

    /**
     * 跳转到施工单详情
     */
    goToWorkOrderDetail(workOrder) {
      if (workOrder && workOrder.id) {
        this.$router.push(`/workorders/${workOrder.id}`)
      } else {
        ErrorHandler.showWarning('施工单信息不存在')
      }
    },

    /**
     * 完成任务
     */
    handleCompleteTask(task) {
      this.currentTask = { ...task }
      this.completeTaskDialogVisible = true
    },

    /**
     * 确认完成任务
     */
    async handleConfirmCompleteTask(data) {
      try {
        await this.apiService.complete(this.currentTask.id, data)
        ErrorHandler.showSuccess('任务已完成')
        this.completeTaskDialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '完成任务')
      }
    },

    /**
     * 显示更新对话框
     */
    showUpdateDialog(task) {
      this.currentTask = { ...task }
      this.updateDialogVisible = true
    },

    /**
     * 更新任务数量
     */
    async handleUpdateTask(data) {
      try {
        await this.apiService.updateQuantity(this.currentTask.id, {
          quantity_increment: data.quantity_increment,
          version: this.currentTask.version
        })
        ErrorHandler.showSuccess('更新成功')
        this.updateDialogVisible = false
        await this.loadData()
      } catch (error) {
        if (error.response?.status === 409) {
          ErrorHandler.showError('任务已被其他操作员更新，请刷新后重试')
        } else {
          ErrorHandler.showMessage(error, '更新任务')
        }
      }
    },

    /**
     * 显示分派对话框
     */
    showAssignDialog(task) {
      this.currentTask = { ...task }
      this.assignDialogVisible = true
      this.loadDepartmentListForProcess(task)
      this.loadUserList(task.assigned_department || null)
    },

    /**
     * 分派任务
     */
    async handleAssignTask(data) {
      try {
        await this.apiService.assign(this.currentTask.id, data)
        ErrorHandler.showSuccess('任务分派已更新')
        this.assignDialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '分派任务')
      }
    },

    /**
     * 加载工序关联的部门列表
     */
    loadDepartmentListForProcess(task) {
      if (task.work_order_process_info && task.work_order_process_info.process) {
        const processDepartments = task.work_order_process_info.process.departments || []
        if (processDepartments.length > 0) {
          this.departmentList = processDepartments
        } else {
          this.loadDepartmentList()
        }
      } else {
        this.loadDepartmentList()
      }
    },

    /**
     * 部门变化时加载用户
     */
    handleDepartmentChange(departmentId) {
      this.loadUserList(departmentId)
    },

    /**
     * 显示拆分对话框
     */
    showSplitDialog(task) {
      this.currentSplitTask = { ...task }
      this.splitDialogVisible = true
      this.loadDepartmentListForProcess(task)
      this.loadUserList()
    },

    /**
     * 拆分任务
     */
    async handleSplitTask(data) {
      try {
        await this.apiService.split(this.currentSplitTask.id, data)
        ErrorHandler.showSuccess('任务拆分成功')
        this.splitDialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '拆分任务')
      }
    },

    /**
     * 批量分派
     */
    async handleBatchAssign() {
      this.batchAssignDialogVisible = true
    },

    /**
     * 批量完成
     */
    async handleBatchComplete() {
      try {
        await this.$confirm('确定要完成选中的任务吗？', '批量完成确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        this.batchOperationLoading = true
        const taskIds = this.selectedTasks.map(t => t.id)
        await this.apiService.batchComplete({
          task_ids: taskIds,
          completion_reason: '批量完成'
        })
        ErrorHandler.showSuccess(`成功完成 ${taskIds.length} 个任务`)
        this.clearSelection()
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '批量完成')
        }
      } finally {
        this.batchOperationLoading = false
      }
    },

    /**
     * 批量删除
     */
    async handleBatchDelete() {
      try {
        this.batchOperationLoading = true
        const taskIds = this.selectedTasks.map(t => t.id)
        await this.apiService.batchDelete({
          task_ids: taskIds
        })
        ErrorHandler.showSuccess(`成功删除 ${taskIds.length} 个任务`)
        this.clearSelection()
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '批量删除')
      } finally {
        this.batchOperationLoading = false
      }
    },

    /**
     * 批量取消
     */
    async handleBatchCancel() {
      try {
        const { value } = await this.$prompt('请输入取消原因', '批量取消', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /\S+/,
          inputErrorMessage: '取消原因不能为空'
        })

        this.batchOperationLoading = true
        const taskIds = this.selectedTasks.map(t => t.id)
        await this.apiService.batchCancel({
          task_ids: taskIds,
          cancellation_reason: value
        })
        ErrorHandler.showSuccess(`成功取消 ${taskIds.length} 个任务`)
        this.clearSelection()
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '批量取消')
        }
      } finally {
        this.batchOperationLoading = false
      }
    },

    /**
     * 检查是否可以批量分派
     */
    canBatchAssign() {
      return this.selectedTasks.length > 0 && this.$store.getters['auth/hasPermission']('workorder.change_workorder')
    },

    /**
     * 检查是否可以批量完成
     */
    canBatchComplete() {
      return this.selectedTasks.length > 0
    },

    /**
     * 检查是否可以批量删除（仅草稿任务）
     */
    canBatchDelete() {
      return this.selectedTasks.length > 0 && this.selectedTasks.every(t => t.status === 'draft')
    },

    /**
     * 检查是否可以批量取消
     */
    canBatchCancel() {
      return this.selectedTasks.length > 0 && this.selectedTasks.every(t => !['completed', 'cancelled'].includes(t.status))
    },

    /**
     * 确认批量分派（从 BatchAssignDialog 调用）
     */
    async handleConfirmBatchAssign(data) {
      try {
        this.batchOperationLoading = true
        const taskIds = this.selectedTasks.map(t => t.id)
        await this.apiService.batchAssign({
          task_ids: taskIds,
          assigned_department: data.assigned_department,
          assigned_operator: data.assigned_operator || null,
          reason: data.reason,
          notes: data.notes
        })
        ErrorHandler.showSuccess(`成功分派 ${taskIds.length} 个任务`)
        this.batchAssignDialogVisible = false
        this.clearSelection()
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '批量分派')
      } finally {
        this.batchOperationLoading = false
      }
    },

    /**
     * 导出任务列表
     */
    async handleExport() {
      try {
        this.exporting = true

        // 如果有选中任务，只导出选中的
        const taskIds = this.selectedTasks.length > 0
          ? this.selectedTasks.map(t => t.id)
          : []

        // 调用后端导出API
        const response = await this.apiService.exportExcel({
          task_ids: taskIds,
          columns: [
            'id', 'work_order_number', 'process_name', 'task_type',
            'work_content', 'assigned_department', 'assigned_operator',
            'production_quantity', 'quantity_completed', 'progress',
            'priority', 'status', 'created_at', 'updated_at'
          ]
        })

        // 从响应中获取文件名
        const contentDisposition = response.headers['content-disposition']
        let filename = '任务列表.xlsx'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = decodeURIComponent(filenameMatch[1])
          }
        }

        // 创建下载链接
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        ErrorHandler.showSuccess('导出成功')
      } catch (error) {
        ErrorHandler.showMessage(error, '导出任务')
      } finally {
        this.exporting = false
      }
    }
  }
}
</script>

<style scoped>
.task-list {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
}
</style>
