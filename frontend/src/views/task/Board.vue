<template>
  <div class="task-board">
    <el-card>
      <!-- 筛选和工具栏 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select
              v-model="selectedDepartment"
              placeholder="选择部门查看任务"
              clearable
              filterable
              @change="handleDepartmentChange"
              style="width: 100%;"
            >
              <el-option
                v-for="dept in departmentList"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input
              v-model="filters.search"
              placeholder="搜索任务内容、施工单号"
              clearable
              @clear="loadData"
            >
              <el-button slot="append" icon="el-icon-search" @click="loadData"></el-button>
            </el-input>
          </el-col>
          <el-col :span="12" style="text-align: right;">
            <el-button icon="el-icon-refresh" @click="loadData">刷新</el-button>
            <el-button
              type="primary"
              icon="el-icon-view"
              @click="showListView = !showListView"
            >
              {{ showListView ? '看板视图' : '列表视图' }}
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 看板视图 -->
      <div v-if="!showListView" class="board-view" style="margin-top: 20px;">
        <el-row :gutter="20">
          <!-- 待开始 -->
          <el-col :span="8">
            <div class="board-column">
              <div class="column-header pending">
                <span class="column-title">待开始</span>
                <el-badge :value="tasksByStatus.pending.length" class="item"></el-badge>
              </div>
              <div class="column-content" v-loading="loading">
                <div
                  v-for="task in tasksByStatus.pending"
                  :key="task.id"
                  class="task-card"
                  @click="handleTaskClick(task)"
                >
                  <div class="task-header">
                    <div class="task-header-left">
                      <span class="task-order-number">{{ task.work_order_process_info?.work_order?.order_number || '-' }}</span>
                      <el-tag
                        v-if="task.work_order_process_info?.work_order?.priority"
                        :type="getPriorityTagType(task.work_order_process_info.work_order.priority)"
                        size="mini"
                        style="margin-left: 5px;"
                      >
                        {{ task.work_order_process_info.work_order.priority_display }}
                      </el-tag>
                    </div>
                    <el-tag :type="getTaskTypeTagType(task.task_type)" size="mini">
                      {{ task.task_type_display }}
                    </el-tag>
                  </div>
                  <div class="task-content">
                    <div class="task-title">{{ task.work_content }}</div>
                    <div class="task-info">
                      <div><i class="el-icon-s-custom"></i> {{ task.assigned_operator_name || '未分配' }}</div>
                      <div><i class="el-icon-s-data"></i> {{ task.production_quantity }} / {{ task.quantity_completed || 0 }}</div>
                    </div>
                    <div v-if="getDaysUntilDeadline(task) !== null" class="task-deadline" :class="getDeadlineClass(task)">
                      <i class="el-icon-time"></i>
                      {{ getDeadlineText(task) }}
                    </div>
                    <div v-if="task.quantity_defective > 0" class="task-defective">
                      <i class="el-icon-warning"></i> 不良品：{{ task.quantity_defective }}
                    </div>
                  </div>
                  <div class="task-actions">
                    <el-button
                      v-if="canUpdateTask(task)"
                      type="primary"
                      size="mini"
                      @click.stop="showUpdateDialog(task)"
                    >
                      更新
                    </el-button>
                    <el-button
                      type="warning"
                      size="mini"
                      @click.stop="showAssignDialog(task)"
                    >
                      分派
                    </el-button>
                    <el-button
                      v-if="canCompleteTask(task)"
                      type="success"
                      size="mini"
                      @click.stop="handleCompleteTask(task)"
                    >
                      完成
                    </el-button>
                  </div>
                </div>
                <div v-if="tasksByStatus.pending.length === 0" class="empty-column">
                  暂无待开始任务
                </div>
              </div>
            </div>
          </el-col>

          <!-- 进行中 -->
          <el-col :span="8">
            <div class="board-column">
              <div class="column-header in-progress">
                <span class="column-title">进行中</span>
                <el-badge :value="tasksByStatus.in_progress.length" class="item"></el-badge>
              </div>
              <div class="column-content" v-loading="loading">
                <div
                  v-for="task in tasksByStatus.in_progress"
                  :key="task.id"
                  class="task-card"
                  @click="handleTaskClick(task)"
                >
                  <div class="task-header">
                    <div class="task-header-left">
                      <span class="task-order-number">{{ task.work_order_process_info?.work_order?.order_number || '-' }}</span>
                      <el-tag
                        v-if="task.work_order_process_info?.work_order?.priority"
                        :type="getPriorityTagType(task.work_order_process_info.work_order.priority)"
                        size="mini"
                        style="margin-left: 5px;"
                      >
                        {{ task.work_order_process_info.work_order.priority_display }}
                      </el-tag>
                    </div>
                    <el-tag :type="getTaskTypeTagType(task.task_type)" size="mini">
                      {{ task.task_type_display }}
                    </el-tag>
                  </div>
                  <div class="task-content">
                    <div class="task-title">{{ task.work_content }}</div>
                    <div class="task-info">
                      <div><i class="el-icon-s-custom"></i> {{ task.assigned_operator_name || '未分配' }}</div>
                      <div><i class="el-icon-s-data"></i> {{ task.production_quantity }} / {{ task.quantity_completed || 0 }}</div>
                    </div>
                    <div class="task-progress">
                      <el-progress
                        :percentage="getTaskProgress(task)"
                        :color="getProgressColor(getTaskProgress(task))"
                        :stroke-width="6"
                      ></el-progress>
                    </div>
                    <div v-if="getDaysUntilDeadline(task) !== null" class="task-deadline" :class="getDeadlineClass(task)">
                      <i class="el-icon-time"></i>
                      {{ getDeadlineText(task) }}
                    </div>
                    <div v-if="task.quantity_defective > 0" class="task-defective">
                      <i class="el-icon-warning"></i> 不良品：{{ task.quantity_defective }}
                    </div>
                  </div>
                  <div class="task-actions">
                    <el-button
                      v-if="canUpdateTask(task)"
                      type="primary"
                      size="mini"
                      @click.stop="showUpdateDialog(task)"
                    >
                      更新
                    </el-button>
                    <el-button
                      type="warning"
                      size="mini"
                      @click.stop="showAssignDialog(task)"
                    >
                      分派
                    </el-button>
                    <el-button
                      v-if="canCompleteTask(task)"
                      type="success"
                      size="mini"
                      @click.stop="handleCompleteTask(task)"
                    >
                      完成
                    </el-button>
                  </div>
                </div>
                <div v-if="tasksByStatus.in_progress.length === 0" class="empty-column">
                  暂无进行中任务
                </div>
              </div>
            </div>
          </el-col>

          <!-- 已完成 -->
          <el-col :span="8">
            <div class="board-column">
              <div class="column-header completed">
                <span class="column-title">已完成</span>
                <el-badge :value="tasksByStatus.completed.length" class="item"></el-badge>
              </div>
              <div class="column-content" v-loading="loading">
                <div
                  v-for="task in tasksByStatus.completed"
                  :key="task.id"
                  class="task-card completed"
                  @click="handleTaskClick(task)"
                >
                  <div class="task-header">
                    <div class="task-header-left">
                      <span class="task-order-number">{{ task.work_order_process_info?.work_order?.order_number || '-' }}</span>
                      <el-tag
                        v-if="task.work_order_process_info?.work_order?.priority"
                        :type="getPriorityTagType(task.work_order_process_info.work_order.priority)"
                        size="mini"
                        style="margin-left: 5px;"
                      >
                        {{ task.work_order_process_info.work_order.priority_display }}
                      </el-tag>
                    </div>
                    <el-tag :type="getTaskTypeTagType(task.task_type)" size="mini">
                      {{ task.task_type_display }}
                    </el-tag>
                  </div>
                  <div class="task-content">
                    <div class="task-title">{{ task.work_content }}</div>
                    <div class="task-info">
                      <div><i class="el-icon-s-custom"></i> {{ task.assigned_operator_name || '未分配' }}</div>
                      <div><i class="el-icon-s-data"></i> {{ task.production_quantity }} / {{ task.quantity_completed || 0 }}</div>
                    </div>
                    <div v-if="getDaysUntilDeadline(task) !== null" class="task-deadline" :class="getDeadlineClass(task)">
                      <i class="el-icon-time"></i>
                      {{ getDeadlineText(task) }}
                    </div>
                    <div v-if="task.quantity_defective > 0" class="task-defective">
                      <i class="el-icon-warning"></i> 不良品：{{ task.quantity_defective }}
                    </div>
                  </div>
                </div>
                <div v-if="tasksByStatus.completed.length === 0" class="empty-column">
                  暂无已完成任务
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 列表视图 -->
      <div v-else style="margin-top: 20px;">
        <el-table
          v-loading="loading"
          :data="taskList"
          border
          style="width: 100%;"
        >
          <el-table-column prop="work_order_process_info.work_order.order_number" label="施工单号" width="150"></el-table-column>
          <el-table-column prop="work_content" label="任务内容" min-width="200"></el-table-column>
          <el-table-column prop="assigned_department_name" label="分派部门" width="120"></el-table-column>
          <el-table-column prop="assigned_operator_name" label="分派操作员" width="120"></el-table-column>
          <el-table-column label="数量" width="120">
            <template slot-scope="scope">
              {{ scope.row.quantity_completed || 0 }} / {{ scope.row.production_quantity }}
            </template>
          </el-table-column>
          <el-table-column prop="status_display" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="mini">
                {{ scope.row.status_display }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template slot-scope="scope">
              <el-button
                v-if="scope.row.status !== 'completed' && canUpdateTask(scope.row)"
                type="primary"
                size="mini"
                @click="showUpdateDialog(scope.row)"
              >
                更新
              </el-button>
              <el-button
                type="warning"
                size="mini"
                @click="showAssignDialog(scope.row)"
              >
                分派
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 任务更新对话框 -->
    <el-dialog
      title="更新任务"
      :visible.sync="updateDialogVisible"
      width="600px"
      @close="resetUpdateForm"
    >
      <el-form
        ref="updateForm"
        :model="updateForm"
        :rules="updateRules"
        label-width="120px"
      >
        <el-form-item label="任务内容">
          <el-input :value="currentTask?.work_content" disabled></el-input>
        </el-form-item>
        <el-form-item label="生产数量">
          <el-input-number
            :value="currentTask?.production_quantity"
            disabled
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="当前完成数量" v-if="currentTask">
          <el-input-number
            :value="currentTask.quantity_completed || 0"
            disabled
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="本次完成数量" prop="quantity_completed" required>
          <el-input-number
            v-model="updateForm.quantity_completed"
            :min="0"
            :max="currentTask?.production_quantity ? (currentTask.production_quantity - (currentTask.quantity_completed || 0)) : 999999"
            style="width: 100%;"
          ></el-input-number>
          <div v-if="currentTask?.production_quantity" style="color: #909399; font-size: 12px; margin-top: 4px;">
            计划数量：{{ currentTask.production_quantity }}，
            当前完成：{{ currentTask.quantity_completed || 0 }}，
            更新后：{{ (currentTask.quantity_completed || 0) + (updateForm.quantity_completed || 0) }}
            <span v-if="(currentTask.quantity_completed || 0) + (updateForm.quantity_completed || 0) >= currentTask.production_quantity" style="color: #67C23A;">
              （完成数量将达到计划数量，状态将自动标记为已完成）
            </span>
            <span v-else style="color: #E6A23C;">
              （完成数量未达到计划数量，状态将保持为进行中）
            </span>
          </div>
        </el-form-item>
        <el-form-item label="本次不良品数量">
          <el-input-number
            v-model="updateForm.quantity_defective"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            当前不良品：{{ currentTask?.quantity_defective || 0 }}，
            更新后：{{ (currentTask?.quantity_defective || 0) + (updateForm.quantity_defective || 0) }}
          </div>
        </el-form-item>
        <el-form-item label="任务备注">
          <el-input
            v-model="updateForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入任务备注（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="updateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateTask" :loading="updatingTask">确定</el-button>
      </div>
    </el-dialog>

    <!-- 分派任务对话框 -->
    <el-dialog
      title="调整任务分派"
      :visible.sync="assignDialogVisible"
      width="600px"
      @close="resetAssignForm"
    >
      <el-form
        ref="assignForm"
        :model="assignForm"
        label-width="120px"
      >
        <el-form-item label="任务内容">
          <el-input :value="currentTask?.work_content" disabled></el-input>
        </el-form-item>
        <el-form-item label="分派部门">
          <el-select
            v-model="assignForm.assigned_department"
            placeholder="请选择部门"
            filterable
            clearable
            style="width: 100%;"
            :loading="loadingDepartments"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分派操作员">
          <el-select
            v-model="assignForm.assigned_operator"
            placeholder="请选择操作员"
            filterable
            clearable
            style="width: 100%;"
            :loading="loadingUsers"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username || `${(user.first_name || '')}${(user.last_name || '')}`.trim() || user.id"
              :value="user.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input
            v-model="assignForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请输入调整原因（可选，便于追溯）"
          ></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="assignForm.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignTask" :loading="assigningTask">确定</el-button>
      </div>
    </el-dialog>

    <!-- 完成任务对话框 -->
    <el-dialog
      title="完成任务"
      :visible.sync="completeDialogVisible"
      width="600px"
      @close="resetCompleteForm"
    >
      <el-form
        ref="completeForm"
        :model="completeForm"
        label-width="120px"
      >
        <el-form-item label="状态">
          <el-tag type="success">已完成</el-tag>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            强制完成任务，状态将标记为已完成
          </div>
        </el-form-item>
        <el-form-item label="当前完成数量" v-if="currentTask">
          <el-input-number
            :value="currentTask.quantity_completed || 0"
            disabled
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="不良品数量">
          <el-input-number
            v-model="completeForm.quantity_defective"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="完成理由">
          <el-input
            v-model="completeForm.completion_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入完成理由（可选）"
          ></el-input>
        </el-form-item>
        <el-form-item label="任务备注">
          <el-input
            v-model="completeForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入任务备注（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmCompleteTask" :loading="completingTask">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { workOrderTaskAPI, departmentAPI } from '@/api/workorder'
import { getSalespersons } from '@/api/auth'

export default {
  name: 'TaskBoard',
  data() {
    return {
      loading: false,
      showListView: false,
      selectedDepartment: null,
      departmentList: [],
      taskList: [],
      filters: {
        search: ''
      },
      // 任务操作对话框
      updateDialogVisible: false,
      assignDialogVisible: false,
      completeDialogVisible: false,
      currentTask: null,
      updatingTask: false,
      assigningTask: false,
      completingTask: false,
      loadingDepartments: false,
      loadingUsers: false,
      userList: [],
      // 表单数据
      updateForm: {
        quantity_completed: 0,
        quantity_defective: 0,
        notes: ''
      },
      assignForm: {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: ''
      },
      completeForm: {
        quantity_defective: 0,
        completion_reason: '',
        notes: ''
      },
      updateRules: {
        quantity_completed: [
          { required: true, message: '请输入本次完成数量', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    tasksByStatus() {
      const tasks = {
        pending: [],
        in_progress: [],
        completed: []
      }
      this.taskList.forEach(task => {
        if (task.status === 'pending') {
          tasks.pending.push(task)
        } else if (task.status === 'in_progress') {
          tasks.in_progress.push(task)
        } else if (task.status === 'completed') {
          tasks.completed.push(task)
        }
      })
      return tasks
    }
  },
  created() {
    this.loadDepartmentList()
    this.loadData()
  },
  methods: {
    async loadDepartmentList() {
      try {
        const response = await departmentAPI.getList({ is_active: true, page_size: 1000 })
        this.departmentList = response.results || []
      } catch (error) {
        console.error('加载部门列表失败:', error)
      }
    },
    async loadData() {
      this.loading = true
      try {
        const params = {
          page_size: 1000, // 看板视图需要加载所有任务
          ordering: '-created_at'
        }
        
        if (this.selectedDepartment) {
          params.assigned_department = this.selectedDepartment
        }
        
        if (this.filters.search) {
          params.search = this.filters.search
        }
        
        const response = await workOrderTaskAPI.getList(params)
        if (Array.isArray(response)) {
          this.taskList = response
        } else if (response.results) {
          this.taskList = response.results || []
        } else {
          this.taskList = []
        }
      } catch (error) {
        console.error('加载任务列表失败:', error)
        this.$message.error('加载任务列表失败')
        this.taskList = []
      } finally {
        this.loading = false
      }
    },
    handleDepartmentChange() {
      this.loadData()
    },
    handleTaskClick(task) {
      // 跳转到施工单详情页
      if (task.work_order_process_info?.work_order?.id) {
        this.$router.push({
          name: 'WorkOrderDetail',
          params: { id: task.work_order_process_info.work_order.id }
        })
      }
    },
    getTaskProgress(task) {
      if (!task.production_quantity || task.production_quantity === 0) {
        return 0
      }
      const completed = task.quantity_completed || 0
      return Math.min(Math.round((completed / task.production_quantity) * 100), 100)
    },
    getProgressColor(percentage) {
      if (percentage < 50) {
        return '#f56c6c'
      } else if (percentage < 100) {
        return '#e6a23c'
      } else {
        return '#67c23a'
      }
    },
    getTaskTypeTagType(taskType) {
      const typeMap = {
        'plate_making': 'info',
        'cutting': 'warning',
        'printing': 'primary',
        'foiling': 'success',
        'embossing': 'success',
        'die_cutting': 'danger',
        'packaging': 'warning',
        'general': ''
      }
      return typeMap[taskType] || ''
    },
    getStatusTagType(status) {
      const statusMap = {
        'pending': 'info',
        'in_progress': 'warning',
        'completed': 'success',
        'cancelled': 'danger'
      }
      return statusMap[status] || ''
    },
    canUpdateTask(task) {
      return task.status !== 'completed' && !task.auto_calculate_quantity
    },
    canCompleteTask(task) {
      // 简化判断，实际应该检查业务条件
      return task.status !== 'completed'
    },
    showUpdateDialog(task) {
      this.currentTask = { ...task }
      this.updateForm = {
        quantity_completed: 0,
        quantity_defective: 0,
        notes: ''
      }
      this.updateDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.updateForm) {
          this.$refs.updateForm.clearValidate()
        }
      })
    },
    async handleUpdateTask() {
      this.$refs.updateForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        this.updatingTask = true
        try {
          const data = {
            quantity_increment: this.updateForm.quantity_completed,
            quantity_defective: this.updateForm.quantity_defective || 0,
            notes: this.updateForm.notes || '',
            version: this.currentTask.version
          }
          
          await workOrderTaskAPI.update_quantity(this.currentTask.id, data)
          this.$message.success('任务已更新')
          this.updateDialogVisible = false
          this.loadData()
        } catch (error) {
          if (error.response?.status === 409) {
            this.$message.warning('任务已被其他操作员更新，请刷新页面后重试')
            this.loadData()
          } else {
            const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                               (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '操作失败'
            this.$message.error(errorMessage)
          }
          console.error('更新任务失败:', error)
        } finally {
          this.updatingTask = false
        }
      })
    },
    resetUpdateForm() {
      this.currentTask = null
      this.updateForm = {
        quantity_completed: 0,
        quantity_defective: 0,
        notes: ''
      }
      this.$nextTick(() => {
        if (this.$refs.updateForm) {
          this.$refs.updateForm.clearValidate()
        }
      })
    },
    async loadDepartmentListForProcess(task) {
      // 根据任务的工序获取关联的部门列表
      if (task.work_order_process_info && task.work_order_process_info.process) {
        const processDepartments = task.work_order_process_info.process.departments || []
        if (processDepartments.length > 0) {
          // 只显示与工序关联的部门
          this.departmentList = processDepartments
        } else {
          // 如果工序没有关联部门，加载所有部门（兼容处理）
          await this.loadDepartmentList()
        }
      } else {
        // 如果没有工序信息，加载所有部门（兼容处理）
        await this.loadDepartmentList()
      }
    },
    async loadUserList() {
      this.loadingUsers = true
      try {
        const response = await getSalespersons()
        this.userList = response || []
      } catch (error) {
        console.error('加载用户列表失败:', error)
        this.userList = []
      } finally {
        this.loadingUsers = false
      }
    },
    showAssignDialog(task) {
      this.currentTask = { ...task }
      this.assignForm = {
        assigned_department: task.assigned_department || null,
        assigned_operator: task.assigned_operator || null,
        reason: '',
        notes: ''
      }
      // 根据工序过滤部门列表
      this.loadDepartmentListForProcess(task)
      this.loadUserList()
      this.assignDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.assignForm) {
          this.$refs.assignForm.clearValidate()
        }
      })
    },
    async handleAssignTask() {
      this.assigningTask = true
      try {
        const data = {
          assigned_department: this.assignForm.assigned_department,
          assigned_operator: this.assignForm.assigned_operator,
          reason: this.assignForm.reason || '',
          notes: this.assignForm.notes || ''
        }
        
        await workOrderTaskAPI.assign(this.currentTask.id, data)
        this.$message.success('任务分派已更新')
        this.assignDialogVisible = false
        this.loadData()
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                           (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '操作失败'
        this.$message.error(errorMessage)
        console.error('分派任务失败:', error)
      } finally {
        this.assigningTask = false
      }
    },
    resetAssignForm() {
      this.currentTask = null
      this.assignForm = {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: ''
      }
      this.$nextTick(() => {
        if (this.$refs.assignForm) {
          this.$refs.assignForm.clearValidate()
        }
      })
    },
    handleCompleteTask(task) {
      this.currentTask = { ...task }
      this.completeForm = {
        quantity_defective: task.quantity_defective || 0,
        completion_reason: '',
        notes: ''
      }
      this.completeDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.completeForm) {
          this.$refs.completeForm.clearValidate()
        }
      })
    },
    async handleConfirmCompleteTask() {
      this.completingTask = true
      try {
        const data = {
          completion_reason: this.completeForm.completion_reason || '',
          quantity_defective: this.completeForm.quantity_defective || 0,
          notes: this.completeForm.notes || '',
          version: this.currentTask.version
        }
        
        await workOrderTaskAPI.complete(this.currentTask.id, data)
        this.$message.success('任务已强制完成')
        this.completeDialogVisible = false
        this.loadData()
      } catch (error) {
        if (error.response?.status === 409) {
          this.$message.warning('任务已被其他操作员更新，请刷新页面后重试')
          this.loadData()
        } else {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                             (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '操作失败'
          this.$message.error(errorMessage)
        }
        console.error('完成任务失败:', error)
      } finally {
        this.completingTask = false
      }
    },
    resetCompleteForm() {
      this.currentTask = null
      this.completeForm = {
        quantity_defective: 0,
        completion_reason: '',
        notes: ''
      }
      this.$nextTick(() => {
        if (this.$refs.completeForm) {
          this.$refs.completeForm.clearValidate()
        }
      })
    },
    getPriorityTagType(priority) {
      const priorityMap = {
        'low': 'info',
        'normal': '',
        'high': 'warning',
        'urgent': 'danger'
      }
      return priorityMap[priority] || ''
    },
    getDaysUntilDeadline(task) {
      const deliveryDate = task.work_order_process_info?.work_order?.delivery_date
      if (!deliveryDate) {
        return null
      }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const deadline = new Date(deliveryDate)
      deadline.setHours(0, 0, 0, 0)
      const diffTime = deadline - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    },
    getDeadlineText(task) {
      const days = this.getDaysUntilDeadline(task)
      if (days === null) {
        return ''
      }
      if (days < 0) {
        return `已逾期 ${Math.abs(days)} 天`
      } else if (days === 0) {
        return '今天到期'
      } else if (days === 1) {
        return '明天到期'
      } else if (days <= 3) {
        return `${days} 天后到期`
      } else {
        return `还有 ${days} 天`
      }
    },
    getDeadlineClass(task) {
      const days = this.getDaysUntilDeadline(task)
      if (days === null) {
        return ''
      }
      if (days < 0) {
        return 'deadline-overdue'
      } else if (days === 0) {
        return 'deadline-today'
      } else if (days <= 3) {
        return 'deadline-urgent'
      } else {
        return 'deadline-normal'
      }
    }
  }
}
</script>

<style scoped>
.task-board {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.board-view {
  min-height: 600px;
}

.board-column {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 10px;
  min-height: 500px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  font-weight: bold;
  color: #fff;
}

.column-header.pending {
  background-color: #909399;
}

.column-header.in-progress {
  background-color: #e6a23c;
}

.column-header.completed {
  background-color: #67c23a;
}

.column-content {
  min-height: 400px;
  max-height: 800px;
  overflow-y: auto;
}

.task-card {
  background-color: #fff;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
}

.task-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.task-card.completed {
  opacity: 0.8;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.task-order-number {
  font-weight: bold;
  color: #409eff;
  font-size: 14px;
}

.task-content {
  margin-bottom: 8px;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  word-break: break-word;
}

.task-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.task-info i {
  margin-right: 4px;
}

.task-progress {
  margin: 8px 0;
}

.task-defective {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 8px;
}

.task-defective i {
  margin-right: 4px;
}

.task-deadline {
  font-size: 12px;
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.task-deadline i {
  margin-right: 4px;
}

.task-deadline.deadline-overdue {
  background-color: #fef0f0;
  color: #f56c6c;
  font-weight: bold;
}

.task-deadline.deadline-today {
  background-color: #fdf6ec;
  color: #e6a23c;
  font-weight: bold;
}

.task-deadline.deadline-urgent {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.task-deadline.deadline-normal {
  background-color: #f0f9ff;
  color: #409eff;
}

.task-actions {
  display: flex;
  gap: 5px;
  margin-top: 8px;
}

.empty-column {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 14px;
}
</style>

