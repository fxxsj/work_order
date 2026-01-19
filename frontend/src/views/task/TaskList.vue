<template>
  <div class="task-list">
    <el-card>
      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="5">
            <el-input
              v-model="filters.search"
              placeholder="搜索任务内容、施工单号"
              clearable
              @input="handleSearchDebounced"
              @clear="handleSearchDebounced"
            >
              <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
            </el-input>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.status" placeholder="任务状态" clearable @change="handleSearchDebounced">
              <el-option
                v-for="status in taskStatusOptions"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.task_type" placeholder="任务类型" clearable @change="handleSearchDebounced">
              <el-option
                v-for="type in taskTypeOptions"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.assigned_department" placeholder="分派部门" clearable filterable @change="handleSearchDebounced">
              <el-option
                v-for="dept in departmentList"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.work_order_process" placeholder="工序" clearable filterable @change="handleSearchDebounced">
              <el-option
                v-for="process in processList"
                :key="process.id"
                :label="process.name"
                :value="process.id"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="10" style="text-align: right;">
            <el-button icon="el-icon-refresh-left" @click="handleReset">重置筛选</el-button>
            <el-button
              v-if="permissionService.canExport()"
              type="success"
              icon="el-icon-download"
              @click="handleExport"
              :loading="exporting"
              style="margin-left: 10px;"
            >
              导出Excel
            </el-button>
            <el-button type="primary" icon="el-icon-refresh" @click="loadData" style="margin-left: 10px;">刷新</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 视图切换 -->
      <div style="margin-top: 20px; margin-bottom: 10px; text-align: right;">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="table">列表视图</el-radio-button>
          <el-radio-button label="kanban">看板视图</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 骨架屏 -->
      <SkeletonLoader
        v-if="loading && taskList.length === 0"
        type="table"
        :rows="5"
        style="margin-top: 20px;"
      />

      <!-- 看板视图 -->
      <TaskKanban
        v-if="viewMode === 'kanban'"
        :tasks="taskList"
        @task-click="handleTaskClickFromKanban"
      />

      <!-- 任务列表 -->
      <el-table
        v-if="viewMode === 'table'"
        v-loading="loading && taskList.length > 0"
        :data="taskList"
        border
        style="width: 100%; margin-top: 20px;"
        @sort-change="handleSortChange"
        :row-key="getRowKey"
      >
        <el-table-column type="expand" width="50">
          <template slot-scope="scope">
            <TaskLogs :task="scope.row" />
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="80" sortable="custom"></el-table-column>
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
        <el-table-column prop="work_content" label="任务内容" min-width="200" show-overflow-tooltip></el-table-column>
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
        <el-table-column prop="production_quantity" label="生产数量" width="100" align="right"></el-table-column>
        <el-table-column prop="quantity_completed" label="完成数量" width="100" align="right"></el-table-column>
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
      <div class="pagination-section" style="margin-top: 20px; text-align: right;">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.page_size"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
        ></el-pagination>
      </div>
    </el-card>

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
  </div>
</template>

<script>
import { debounce } from '@/utils/debounce'
import taskService from '@/services/TaskService'
import permissionService from '@/services/PermissionService'
import exportService from '@/services/ExportService'
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

export default {
  name: 'TaskList',
  components: {
    SkeletonLoader,
    TaskKanban,
    TaskLogs,
    TaskRelatedInfo,
    TaskActions,
    CompleteTaskDialog,
    UpdateTaskDialog,
    AssignTaskDialog,
    SplitTaskDialog
  },
  data() {
    return {
      // 服务实例
      taskService,
      permissionService,
      exportService,

      // 数据状态
      loading: false,
      exporting: false,
      taskList: [],
      viewMode: 'table',
      processList: [],
      departmentList: [],
      userList: [],
      loadingDepartments: false,
      loadingUsers: false,

      // 筛选和分页
      filters: {
        search: '',
        status: '',
        task_type: '',
        work_order_process: '',
        assigned_department: ''
      },
      pagination: {
        page: 1,
        page_size: 20,
        total: 0
      },
      ordering: '-created_at',

      // 对话框状态
      completeTaskDialogVisible: false,
      updateDialogVisible: false,
      assignDialogVisible: false,
      splitDialogVisible: false,
      currentTask: null,
      currentSplitTask: null
    }
  },
  computed: {
    // 任务状态选项
    taskStatusOptions() {
      return this.taskService.getStatusOptions()
    },
    // 任务类型选项
    taskTypeOptions() {
      return this.taskService.getTaskTypeOptions()
    }
  },
  created() {
    this.initData()
  },
  methods: {
    // 初始化数据
    async initData() {
      await Promise.all([
        this.loadProcessList(),
        this.loadDepartmentList()
      ])
      await this.loadData()
    },

    // 加载任务列表
    async loadData() {
      this.loading = true
      try {
        const result = await this.taskService.getTasks({
          page: this.pagination.page,
          page_size: this.pagination.page_size,
          ordering: this.ordering,
          ...this.filters
        })

        if (result.success) {
          this.taskList = result.data.results || []
          this.pagination.total = result.data.count || 0
        } else {
          this.$message.error(result.error || '加载任务列表失败')
          this.taskList = []
          this.pagination.total = 0
        }
      } finally {
        this.loading = false
      }
    },

    // 加载工序列表
    async loadProcessList() {
      try {
        const result = await this.taskService.getProcessList()
        if (result.success) {
          this.processList = result.data || []
        }
      } catch (error) {
        console.error('加载工序列表失败:', error)
      }
    },

    // 加载部门列表
    async loadDepartmentList() {
      if (this.departmentList.length > 0) return

      this.loadingDepartments = true
      try {
        const result = await this.taskService.getDepartmentList()
        if (result.success) {
          this.departmentList = result.data || []
        }
      } catch (error) {
        console.error('加载部门列表失败:', error)
      } finally {
        this.loadingDepartments = false
      }
    },

    // 加载用户列表
    async loadUserList(departmentId = null) {
      this.loadingUsers = true
      try {
        const result = await this.taskService.getUserList(departmentId)
        if (result.success) {
          this.userList = result.data || []
        }
      } catch (error) {
        console.error('加载用户列表失败:', error)
      } finally {
        this.loadingUsers = false
      }
    },

    // 搜索和筛选
    handleSearch() {
      this.pagination.page = 1
      this.loadData()
    },
    handleSearchDebounced: debounce(function() {
      this.handleSearch()
    }, 300),
    handleReset() {
      this.filters = {
        search: '',
        status: '',
        task_type: '',
        work_order_process: '',
        assigned_department: ''
      }
      this.pagination.page = 1
      this.loadData()
    },

    // 分页和排序
    handleSizeChange(val) {
      this.pagination.page_size = val
      this.pagination.page = 1
      this.loadData()
    },
    handleCurrentChange(val) {
      this.pagination.page = val
      this.loadData()
    },
    handleSortChange({ prop, order }) {
      if (order && prop) {
        this.ordering = order === 'ascending' ? prop : `-${prop}`
        this.pagination.page = 1
        this.loadData()
      }
    },

    // 表格行键
    getRowKey(row) {
      return row.id
    },

    // 从看板点击任务
    handleTaskClickFromKanban(task) {
      if (task.work_order_id) {
        this.$router.push(`/workorders/${task.work_order_id}`)
      }
    },

    // 跳转到施工单详情
    goToWorkOrderDetail(workOrder) {
      if (workOrder && workOrder.id) {
        this.$router.push(`/workorders/${workOrder.id}`)
      } else {
        this.$message.warning('施工单信息不存在')
      }
    },

    // 完成任务
    handleCompleteTask(task) {
      this.currentTask = { ...task }
      this.completeTaskDialogVisible = true
    },
    async handleConfirmCompleteTask(data) {
      try {
        const result = await this.taskService.completeTask(this.currentTask.id, data)
        if (result.success) {
          this.$message.success('任务已完成')
          this.completeTaskDialogVisible = false
          await this.loadData()
        } else {
          this.$message.error(result.error || '操作失败')
        }
      } catch (error) {
        this.$message.error(error.message || '操作失败')
      }
    },

    // 更新任务
    showUpdateDialog(task) {
      this.currentTask = { ...task }
      this.updateDialogVisible = true
    },
    async handleUpdateTask(data) {
      try {
        const result = await this.taskService.updateTaskQuantity(
          this.currentTask.id,
          data.quantity_increment,
          this.currentTask.version
        )
        if (result.success) {
          this.$message.success('更新成功')
          this.updateDialogVisible = false
          await this.loadData()
        } else {
          this.$message.error(result.error || '更新失败')
        }
      } catch (error) {
        this.$message.error(error.message || '更新失败')
      }
    },

    // 分派任务
    showAssignDialog(task) {
      this.currentTask = { ...task }
      this.assignDialogVisible = true
      this.loadDepartmentListForProcess(task)
      this.loadUserList(task.assigned_department || null)
    },
    async handleAssignTask(data) {
      try {
        const result = await this.taskService.assignTask(this.currentTask.id, data)
        if (result.success) {
          this.$message.success('任务分派已更新')
          this.assignDialogVisible = false
          await this.loadData()
        } else {
          this.$message.error(result.error || '操作失败')
        }
      } catch (error) {
        this.$message.error(error.message || '操作失败')
      }
    },
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
    handleDepartmentChange(departmentId) {
      this.loadUserList(departmentId)
    },

    // 拆分任务
    showSplitDialog(task) {
      this.currentSplitTask = { ...task }
      this.splitDialogVisible = true
      this.loadDepartmentListForProcess(task)
      this.loadUserList()
    },
    async handleSplitTask(data) {
      try {
        const result = await this.taskService.splitTask(this.currentSplitTask.id, data)
        if (result.success) {
          this.$message.success('任务拆分成功')
          this.splitDialogVisible = false
          await this.loadData()
        } else {
          this.$message.error(result.error || '操作失败')
        }
      } catch (error) {
        this.$message.error(error.message || '操作失败')
      }
    },

    // 导出
    async handleExport() {
      try {
        this.exporting = true

        // 获取所有符合筛选条件的数据
        const result = await this.taskService.getTasks({
          ...this.filters,
          page_size: 9999, // 获取所有数据
          ordering: this.ordering
        })

        if (result.success) {
          const tasks = result.data.results || []
          const exportResult = await this.exportService.exportTasks(tasks, this.filters)

          if (exportResult.success) {
            this.$message.success(exportResult.message)
          } else {
            this.$message.error(exportResult.error || '导出失败')
          }
        } else {
          this.$message.error(result.error || '获取数据失败')
        }
      } catch (error) {
        this.$message.error(error.message || '导出失败')
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

.pagination-section {
  margin-top: 20px;
}
</style>
