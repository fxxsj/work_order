<template>
  <div class="task-board-refactored">
    <el-card>
      <!-- 统计信息 -->
      <task-stats :tasks="tasks" />

      <!-- 筛选工具栏 -->
      <task-filters
        :departments="departmentList"
        :selected-department="selectedDepartment"
        :search-text="filters.search"
        :is-list-view="showListView"
        :loading="loading"
        @department-change="handleDepartmentChange"
        @search-input="handleSearchInput"
        @search="handleSearch"
        @clear="handleClear"
        @refresh="loadData"
        @view-toggle="toggleView"
      />

      <!-- 看板视图 -->
      <task-board-view
        v-if="!showListView"
        :tasks-by-status="tasksByStatus"
        :editable="editable"
        :loading="loading"
        @task-click="handleTaskClick"
        @task-update="handleTaskUpdate"
        @task-assign="handleTaskAssign"
        @task-complete="handleTaskComplete"
      />

      <!-- 列表视图 -->
      <task-list-view
        v-else
        :tasks="tasks"
        :editable="editable"
        :loading="loading"
        :total="pagination.total"
        :current-page="pagination.page"
        :page-size="pagination.page_size"
        @row-click="handleTaskClick"
        @task-update="handleTaskUpdate"
        @task-assign="handleTaskAssign"
        @task-complete="handleTaskComplete"
        @page-size-change="handlePageSizeChange"
        @page-change="handlePageChange"
      />
    </el-card>

    <!-- 更新任务对话框 -->
    <el-dialog
      title="更新任务"
      :visible.sync="updateDialogVisible"
      width="600px"
    >
      <el-form
        ref="updateFormRef"
        :model="updateForm"
        label-width="120px"
        :rules="updateRules"
      >
        <el-form-item label="完成数量" prop="quantity_completed">
          <el-input-number
            v-model="updateForm.quantity_completed"
            :min="0"
            :max="currentTask?.production_quantity || 999999"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="更新说明">
          <el-input
            v-model="updateForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入更新说明（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="updateDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="updating" @click="handleConfirmUpdate">
          确定
        </el-button>
      </div>
    </el-dialog>

    <!-- 分派任务对话框 -->
    <el-dialog
      title="分派任务"
      :visible.sync="assignDialogVisible"
      width="500px"
    >
      <el-form
        ref="assignFormRef"
        :model="assignForm"
        label-width="120px"
        :rules="assignRules"
      >
        <el-form-item label="任务内容">
          <el-input v-model="currentTask.work_content" disabled />
        </el-form-item>
        <el-form-item label="操作员" prop="operator_id">
          <el-select
            v-model="assignForm.operator_id"
            filterable
            placeholder="请选择操作员"
            style="width: 100%"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分派说明">
          <el-input
            v-model="assignForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入分派说明（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="assignDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="assigning" @click="handleConfirmAssign">
          确定
        </el-button>
      </div>
    </el-dialog>

    <!-- 完成任务对话框 -->
    <el-dialog
      title="完成任务"
      :visible.sync="completeDialogVisible"
      width="600px"
    >
      <el-form
        ref="completeFormRef"
        :model="completeForm"
        label-width="120px"
        :rules="completeRules"
      >
        <el-form-item label="完成数量" prop="quantity_completed">
          <el-input-number
            v-model="completeForm.quantity_completed"
            :min="0"
            :max="currentTask?.production_quantity || 999999"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="不良品数量" prop="quantity_defective">
          <el-input-number
            v-model="completeForm.quantity_defective"
            :min="0"
            :max="completeForm.quantity_completed"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="完成说明">
          <el-input
            v-model="completeForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入完成说明（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="completeDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="completing" @click="handleConfirmComplete">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { taskAPI, departmentAPI } from '@/api/workorder'
import { getUsersByDepartment } from '@/api/auth'
import { permissionService } from '@/services'
import TaskStats from './components/TaskStats.vue'
import TaskFilters from './components/TaskFilters.vue'
import TaskBoardView from './components/TaskBoardView.vue'
import TaskListView from './components/TaskListView.vue'

export default {
  name: 'TaskBoardRefactored',
  components: {
    TaskStats,
    TaskFilters,
    TaskBoardView,
    TaskListView
  },
  data() {
    return {
      loading: false,
      tasks: [],
      departmentList: [],
      userList: [],
      selectedDepartment: null,
      filters: {
        search: ''
      },
      pagination: {
        page: 1,
        page_size: 20,
        total: 0
      },
      showListView: false,

      // 对话框
      updateDialogVisible: false,
      assignDialogVisible: false,
      completeDialogVisible: false,
      currentTask: null,
      updating: false,
      assigning: false,
      completing: false,

      // 表单
      updateForm: {
        quantity_completed: 0,
        notes: ''
      },
      assignForm: {
        operator_id: null,
        notes: ''
      },
      completeForm: {
        quantity_completed: 0,
        quantity_defective: 0,
        notes: ''
      },

      // 验证规则
      updateRules: {
        quantity_completed: [
          { required: true, message: '请输入完成数量', trigger: 'blur' }
        ]
      },
      assignRules: {
        operator_id: [
          { required: true, message: '请选择操作员', trigger: 'change' }
        ]
      },
      completeRules: {
        quantity_completed: [
          { required: true, message: '请输入完成数量', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    editable() {
      return permissionService.hasPermission('task.change')
    },
    tasksByStatus() {
      const grouped = {
        pending: [],
        in_progress: [],
        completed: []
      }

      this.tasks.forEach(task => {
        if (grouped[task.status]) {
          grouped[task.status].push(task)
        }
      })

      return grouped
    }
  },
  async created() {
    await this.loadDepartments()
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.page_size,
          ordering: '-created_at'
        }

        if (this.selectedDepartment) {
          params.department = this.selectedDepartment
        }

        if (this.filters.search) {
          params.search = this.filters.search
        }

        const result = await taskAPI.list(params)
        if (result.data) {
          this.tasks = result.data.results || []
          this.pagination.total = result.data.count || 0
        }
      } catch (error) {
        this.$message.error('加载任务列表失败：' + (error.message || '未知错误'))
      } finally {
        this.loading = false
      }
    },
    async loadDepartments() {
      try {
        const result = await departmentAPI.list({ page_size: 1000 })
        if (result.data) {
          this.departmentList = result.data.results || []
        }
      } catch (error) {
        console.error('加载部门列表失败:', error)
      }
    },
    async loadUsers(departmentId) {
      try {
        const result = await getUsersByDepartment(departmentId)
        if (result.data) {
          this.userList = result.data
        }
      } catch (error) {
        console.error('加载用户列表失败:', error)
      }
    },
    handleDepartmentChange(departmentId) {
      this.selectedDepartment = departmentId
      this.pagination.page = 1
      this.loadData()
      if (departmentId) {
        this.loadUsers(departmentId)
      }
    },
    handleSearchInput(value) {
      this.filters.search = value
    },
    handleSearch() {
      this.pagination.page = 1
      this.loadData()
    },
    handleClear() {
      this.filters.search = ''
      this.pagination.page = 1
      this.loadData()
    },
    toggleView() {
      this.showListView = !this.showListView
    },
    handleTaskClick(task) {
      this.$router.push({
        name: 'TaskDetail',
        params: { id: task.id }
      })
    },
    handleTaskUpdate(task) {
      this.currentTask = task
      this.updateForm = {
        quantity_completed: task.quantity_completed || 0,
        notes: task.notes || ''
      }
      this.updateDialogVisible = true
    },
    async handleConfirmUpdate() {
      this.$refs.updateFormRef.validate(async (valid) => {
        if (valid) {
          this.updating = true
          try {
            const result = await taskAPI.update(this.currentTask.id, this.updateForm)
            if (result.data) {
              this.$message.success('任务更新成功')
              this.updateDialogVisible = false
              await this.loadData()
            }
          } catch (error) {
            this.$message.error('任务更新失败：' + (error.message || '未知错误'))
          } finally {
            this.updating = false
          }
        }
      })
    },
    handleTaskAssign(task) {
      this.currentTask = task
      this.assignForm = {
        operator_id: task.assigned_operator?.id || null,
        notes: ''
      }

      // 加载该工序所在部门的用户
      if (task.work_order_process_info?.process?.department) {
        this.loadUsers(task.work_order_process_info.process.department)
      }

      this.assignDialogVisible = true
    },
    async handleConfirmAssign() {
      this.$refs.assignFormRef.validate(async (valid) => {
        if (valid) {
          this.assigning = true
          try {
            const result = await taskAPI.assign(this.currentTask.id, this.assignForm)
            if (result.data) {
              this.$message.success('任务分派成功')
              this.assignDialogVisible = false
              await this.loadData()
            }
          } catch (error) {
            this.$message.error('任务分派失败：' + (error.message || '未知错误'))
          } finally {
            this.assigning = false
          }
        }
      })
    },
    handleTaskComplete(task) {
      this.currentTask = task
      this.completeForm = {
        quantity_completed: task.quantity_completed || 0,
        quantity_defective: task.quantity_defective || 0,
        notes: task.notes || ''
      }
      this.completeDialogVisible = true
    },
    async handleConfirmComplete() {
      this.$refs.completeFormRef.validate(async (valid) => {
        if (valid) {
          this.completing = true
          try {
            const result = await taskAPI.complete(this.currentTask.id, this.completeForm)
            if (result.data) {
              this.$message.success('任务完成成功')
              this.completeDialogVisible = false
              await this.loadData()
            }
          } catch (error) {
            this.$message.error('任务完成失败：' + (error.message || '未知错误'))
          } finally {
            this.completing = false
          }
        }
      })
    },
    handlePageSizeChange(size) {
      this.pagination.page_size = size
      this.pagination.page = 1
      this.loadData()
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.loadData()
    }
  }
}
</script>

<style scoped>
.task-board-refactored {
  padding: 20px;
}

.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  text-align: right;
}
</style>
