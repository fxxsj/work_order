<template>
  <div class="task-management">
    <!-- 任务列表 -->
    <el-table
      :data="tasks"
      border
      style="width: 100%; margin-top: 10px;"
      size="small"
    >
      <el-table-column
        prop="id"
        label="任务ID"
        width="80"
        align="center"
      />
      <el-table-column prop="task_name" label="任务名称" min-width="150" />
      <el-table-column prop="operator_name" label="操作员" width="100" />
      <el-table-column label="状态" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="getTaskStatusType(scope.row.status)" size="small">
            {{ scope.row.status_display }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="进度" width="120" align="center">
        <template slot-scope="scope">
          <el-progress
            :percentage="calculateTaskProgress(scope.row)"
            :color="getProgressColor(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column
        prop="quantity_completed"
        label="完成数量"
        width="100"
        align="right"
      >
        <template slot-scope="scope">
          {{ scope.row.quantity_completed || 0 }} / {{ scope.row.production_quantity || 0 }}
        </template>
      </el-table-column>
      <el-table-column prop="deadline" label="截止日期" width="110">
        <template slot-scope="scope">
          <span :class="{ 'text-danger': isTaskOverdue(scope.row) }">
            {{ formatDate(scope.row.deadline) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template slot-scope="scope">
          <el-button
            v-if="canCompleteTask(scope.row)"
            type="success"
            size="mini"
            icon="el-icon-check"
            :disabled="!isTaskActionable(scope.row)"
            @click="handleComplete(scope.row)"
          >
            完成
          </el-button>
          <el-button
            v-if="canUpdateTask(scope.row)"
            type="primary"
            size="mini"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
          >
            更新
          </el-button>
          <el-dropdown style="margin-left: 10px;" @command="(cmd) => handleTaskAction(cmd, scope.row)">
            <el-button size="mini" type="text">
              更多<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item v-if="canAssignTask(scope.row)" command="assign">
                <i class="el-icon-user"></i> 分派
              </el-dropdown-item>
              <el-dropdown-item v-if="canSplitTask(scope.row)" command="split">
                <i class="el-icon-s-grid"></i> 拆分
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 完成任务对话框 -->
    <el-dialog
      title="完成任务"
      :visible.sync="completeDialogVisible"
      width="600px"
      :before-close="handleCloseCompleteDialog"
    >
      <el-form
        ref="completeFormRef"
        :model="completeForm"
        label-width="120px"
        :rules="completeRules"
      >
        <el-form-item label="生产数量" prop="quantity_completed">
          <el-input-number
            v-model="completeForm.quantity_completed"
            :min="0"
            :max="currentTask?.production_quantity || 999999"
            :step="1"
          />
          <span style="margin-left: 10px;">{{ currentTask?.production_quantity || 0 }}</span>
        </el-form-item>
        <el-form-item label="不良品数量" prop="quantity_defective">
          <el-input-number
            v-model="completeForm.quantity_defective"
            :min="0"
            :max="completeForm.quantity_completed"
            :step="1"
          />
        </el-form-item>
        <el-form-item
          v-if="isPlateMakingTask"
          label="选择图稿"
          prop="artwork_ids"
        >
          <el-select
            v-model="completeForm.artwork_ids"
            multiple
            placeholder="请选择要使用的图稿"
            style="width: 100%"
          >
            <el-option
              v-for="artwork in availableArtworks"
              :key="artwork.id"
              :label="`${artwork.artwork_number} - ${artwork.version}`"
              :value="artwork.id"
            >
              <span>{{ artwork.artwork_number }}</span>
              <span style="float: right; color: #8492a6; font-size: 12px">
                {{ artwork.version }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="完成说明">
          <el-input
            v-model="completeForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入完成说明（可选）"
          />
        </el-form-item>
        <el-alert
          v-if="taskBlockReason"
          :title="taskBlockReason"
          type="error"
          :closable="false"
          style="margin-bottom: 15px;"
        />
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
  </div>
</template>

<script>
import { taskService, permissionService } from '@/services'

export default {
  name: 'TaskManagement',
  props: {
    tasks: {
      type: Array,
      default: () => []
    },
    process: {
      type: Object,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    },
    availableArtworks: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      completeDialogVisible: false,
      updateDialogVisible: false,
      currentTask: null,
      completing: false,
      updating: false,
      completeForm: {
        quantity_completed: 0,
        quantity_defective: 0,
        artwork_ids: [],
        notes: ''
      },
      updateForm: {
        quantity_completed: 0,
        notes: ''
      },
      completeRules: {
        quantity_completed: [
          { required: true, message: '请输入完成数量', trigger: 'blur' }
        ]
      },
      updateRules: {
        quantity_completed: [
          { required: true, message: '请输入完成数量', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    isPlateMakingTask() {
      return this.currentTask?.task_type === 'plate_making'
    },
    taskBlockReason() {
      if (!this.currentTask) return null
      const reason = taskService.getCannotCompleteReason(this.currentTask)
      return reason || null
    }
  },
  methods: {
    calculateTaskProgress(task) {
      return taskService.calculateProgress(task)
    },
    getProgressColor(task) {
      const progress = this.calculateTaskProgress(task)
      return progress === 100 ? '#67C23A' : '#409EFF'
    },
    getTaskStatusType(status) {
      return taskService.getStatusType(status)
    },
    isTaskOverdue(task) {
      return taskService.isOverdue(task)
    },
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN')
    },
    canCompleteTask(task) {
      if (!this.editable) return false
      return taskService.canComplete(task)
    },
    canUpdateTask(task) {
      if (!this.editable) return false
      return task.status !== 'completed' && task.status !== 'cancelled'
    },
    canAssignTask(task) {
      if (!this.editable) return false
      return permissionService.canOperateTask(task, 'assign')
    },
    canSplitTask(task) {
      if (!this.editable) return false
      return task.status === 'pending' && (task.production_quantity || 0) > 1
    },
    isTaskActionable(task) {
      return this.canCompleteTask(task)
    },
    handleComplete(task) {
      this.currentTask = task
      this.completeForm = {
        quantity_completed: task.quantity_completed || 0,
        quantity_defective: task.quantity_defective || 0,
        artwork_ids: task.artwork_ids || [],
        notes: task.notes || ''
      }
      this.completeDialogVisible = true
    },
    handleUpdate(task) {
      this.currentTask = task
      this.updateForm = {
        quantity_completed: task.quantity_completed || 0,
        notes: task.notes || ''
      }
      this.updateDialogVisible = true
    },
    handleTaskAction(command, task) {
      if (command === 'assign') {
        this.$emit('assign-task', task)
      } else if (command === 'split') {
        this.$emit('split-task', task)
      }
    },
    handleConfirmComplete() {
      this.$refs.completeFormRef.validate((valid) => {
        if (valid) {
          this.$emit('complete-task', {
            taskId: this.currentTask.id,
            data: { ...this.completeForm }
          })
          this.completeDialogVisible = false
        }
      })
    },
    handleConfirmUpdate() {
      this.$refs.updateFormRef.validate((valid) => {
        if (valid) {
          this.$emit('update-task', {
            taskId: this.currentTask.id,
            data: { ...this.updateForm }
          })
          this.updateDialogVisible = false
        }
      })
    },
    handleCloseCompleteDialog() {
      this.completeDialogVisible = false
      this.currentTask = null
    }
  }
}
</script>

<style scoped>
.task-management {
  margin-top: 10px;
}
.text-danger {
  color: #F56C6C;
}
</style>
