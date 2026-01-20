<template>
  <div>
    <!-- 工序信息 -->
    <el-card>
      <div slot="header" class="card-header">
        <span>工序信息</span>
        <el-button
          v-if="editable"
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="handleAddProcess"
        >
          添加工序
        </el-button>
      </div>

      <!-- 工序列表 -->
      <div
        v-for="process in processes"
        :key="process.id"
        class="process-item"
        :style="{ borderLeftColor: getProcessColor(process.status) }"
      >
        <el-card>
          <div slot="header" class="process-header">
            <div class="process-title">
              <span>{{ process.sequence }}. {{ process.process_name }}</span>
              <el-tag :type="getProcessStatusType(process.status)" size="small" style="margin-left: 10px;">
                {{ process.status_display }}
              </el-tag>
            </div>
            <div class="process-stats">
              <span>进度: {{ calculateProcessProgress(process) }}%</span>
              <el-progress
                :percentage="calculateProcessProgress(process)"
                :color="getProcessColor(process.status)"
                :show-text="false"
                style="width: 100px; margin-left: 10px;"
              />
            </div>
          </div>

          <!-- 工序详情 -->
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="process-info-item">
                <label>负责部门:</label>
                <span>{{ getProcessDepartment(process) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="process-info-item">
                <label>操作员:</label>
                <span>{{ process.operator_name || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="process-info-item">
                <label>生产数量:</label>
                <span>{{ process.production_quantity || 0 }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="process-info-item">
                <label>完成数量:</label>
                <span>{{ process.quantity_completed || 0 }}</span>
              </div>
            </el-col>
          </el-row>

          <!-- 工序操作按钮 -->
          <div style="margin-top: 15px;">
            <el-button
              v-if="canCompleteProcess(process)"
              type="success"
              size="mini"
              icon="el-icon-check"
              @click="handleCompleteProcess(process)"
            >
              完成工序
            </el-button>
            <el-dropdown style="margin-left: 10px;" @command="(cmd) => handleProcessAction(cmd, process)">
              <el-button size="mini" type="text">
                更多<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item v-if="canReassignProcess(process)" command="reassign">
                  <i class="el-icon-user"></i> 重新分派
                </el-dropdown-item>
                <el-dropdown-item command="view-tasks">
                  <i class="el-icon-tickets"></i> 查看任务
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>

          <!-- 任务列表 -->
          <div v-if="process.tasks && process.tasks.length > 0" style="margin-top: 15px;">
            <task-management
              :tasks="process.tasks"
              :process="process"
              :editable="editable"
              :available-artworks="availableArtworks"
              @complete-task="handleCompleteTask"
              @update-task="handleUpdateTask"
              @assign-task="handleAssignTask"
              @split-task="handleSplitTask"
            />
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 添加工序对话框 -->
    <el-dialog
      title="添加工序"
      :visible.sync="addProcessDialogVisible"
      width="600px"
    >
      <el-form
        ref="addProcessFormRef"
        :model="addProcessForm"
        label-width="120px"
        :rules="addProcessRules"
      >
        <el-form-item label="工序" prop="process_id">
          <el-select
            v-model="addProcessForm.process_id"
            filterable
            placeholder="请选择工序"
            style="width: 100%"
          >
            <el-option
              v-for="process in availableProcesses"
              :key="process.id"
              :label="process.name"
              :value="process.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="顺序" prop="sequence">
          <el-input-number
            v-model="addProcessForm.sequence"
            :min="1"
            :step="1"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addProcessDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="addingProcess" @click="handleConfirmAddProcess">
          确定
        </el-button>
      </div>
    </el-dialog>

    <!-- 完成工序对话框 -->
    <el-dialog
      title="完成工序"
      :visible.sync="completeProcessDialogVisible"
      width="600px"
    >
      <el-alert
        v-if="incompleteTasksCount > 0"
        title="警告"
        :description="`该工序下还有 ${incompleteTasksCount} 个未完成的任务，是否强制完成？`"
        type="warning"
        :closable="false"
        style="margin-bottom: 15px;"
      />

      <el-form ref="completeProcessFormRef" :model="completeProcessForm" label-width="120px">
        <el-form-item label="完成数量">
          <el-input-number
            v-model="completeProcessForm.quantity_completed"
            :min="0"
            :max="currentProcess?.production_quantity || 999999"
            :step="1"
          />
          <span style="margin-left: 10px;">{{ currentProcess?.production_quantity || 0 }}</span>
        </el-form-item>
        <el-form-item label="不良品数量">
          <el-input-number
            v-model="completeProcessForm.quantity_defective"
            :min="0"
            :max="completeProcessForm.quantity_completed"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="强制完成">
          <el-switch v-model="completeProcessForm.force_complete" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">
            开启后可忽略未完成任务
          </span>
        </el-form-item>
        <el-form-item
          v-if="completeProcessForm.force_complete"
          label="强制完成原因"
          prop="force_reason"
        >
          <el-input
            v-model="completeProcessForm.force_reason"
            type="textarea"
            :rows="3"
            placeholder="请说明强制完成原因"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="completeProcessDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="completingProcess" @click="handleConfirmCompleteProcess">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { taskService } from '@/services'
import TaskManagement from './TaskManagement.vue'

export default {
  name: 'ProcessManagement',
  components: {
    TaskManagement
  },
  props: {
    processes: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: false
    },
    availableProcesses: {
      type: Array,
      default: () => []
    },
    availableArtworks: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      addProcessDialogVisible: false,
      completeProcessDialogVisible: false,
      addingProcess: false,
      completingProcess: false,
      currentProcess: null,
      addProcessForm: {
        process_id: null,
        sequence: 1
      },
      completeProcessForm: {
        quantity_completed: 0,
        quantity_defective: 0,
        force_complete: false,
        force_reason: ''
      },
      addProcessRules: {
        process_id: [
          { required: true, message: '请选择工序', trigger: 'change' }
        ],
        sequence: [
          { required: true, message: '请输入顺序', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    incompleteTasksCount() {
      if (!this.currentProcess || !this.currentProcess.tasks) return 0
      return this.currentProcess.tasks.filter(task => task.status !== 'completed').length
    }
  },
  methods: {
    calculateProcessProgress(process) {
      if (!process.tasks || process.tasks.length === 0) {
        return taskService.calculateProgress(process)
      }
      const completedTasks = process.tasks.filter(task => task.status === 'completed').length
      return Math.round((completedTasks / process.tasks.length) * 100)
    },
    getProcessColor(status) {
      const colorMap = {
        pending: '#909399',
        in_progress: '#409EFF',
        completed: '#67C23A',
        cancelled: '#F56C6C'
      }
      return colorMap[status] || '#909399'
    },
    getProcessStatusType(status) {
      const typeMap = {
        pending: 'info',
        in_progress: '',
        completed: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || ''
    },
    getProcessDepartment(process) {
      return process.department_name || '-'
    },
    canCompleteProcess(process) {
      if (!this.editable) return false
      return process.status !== 'completed' && process.status !== 'cancelled'
    },
    canReassignProcess(process) {
      if (!this.editable) return false
      return process.status === 'pending'
    },
    handleAddProcess() {
      this.addProcessForm = {
        process_id: null,
        sequence: this.processes.length + 1
      }
      this.addProcessDialogVisible = true
    },
    handleConfirmAddProcess() {
      this.$refs.addProcessFormRef.validate((valid) => {
        if (valid) {
          this.$emit('add-process', { ...this.addProcessForm })
          this.addProcessDialogVisible = false
        }
      })
    },
    handleCompleteProcess(process) {
      this.currentProcess = process
      this.completeProcessForm = {
        quantity_completed: process.quantity_completed || 0,
        quantity_defective: process.quantity_defective || 0,
        force_complete: false,
        force_reason: ''
      }
      this.completeProcessDialogVisible = true
    },
    handleConfirmCompleteProcess() {
      this.$emit('complete-process', {
        processId: this.currentProcess.id,
        data: { ...this.completeProcessForm }
      })
      this.completeProcessDialogVisible = false
    },
    handleProcessAction(command, process) {
      if (command === 'reassign') {
        this.$emit('reassign-process', process)
      }
    },
    handleCompleteTask(payload) {
      this.$emit('complete-task', payload)
    },
    handleUpdateTask(payload) {
      this.$emit('update-task', payload)
    },
    handleAssignTask(payload) {
      this.$emit('assign-task', payload)
    },
    handleSplitTask(payload) {
      this.$emit('split-task', payload)
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.process-item {
  border-left: 4px solid #909399;
  padding-left: 15px;
  margin-bottom: 15px;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.process-title {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.process-stats {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.process-info-item {
  margin-bottom: 10px;
}

.process-info-item label {
  font-weight: bold;
  margin-right: 8px;
  color: #606266;
}

.process-info-item span {
  color: #909399;
}
</style>
