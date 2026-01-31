<template>
  <el-dialog
    :visible.sync="dialogVisible"
    :title="dialogTitle"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <!-- Task info display -->
      <el-form-item label="任务内容">
        <div class="task-info">
          {{ task.work_content }}
        </div>
      </el-form-item>

      <!-- Current progress -->
      <el-form-item label="当前进度">
        <el-progress
          :percentage="currentProgress"
          :color="progressColor"
        />
        <div class="progress-text">
          {{ task.quantity_completed || 0 }} / {{ task.production_quantity || 0 }}
        </div>
      </el-form-item>

      <!-- Update mode toggle -->
      <el-radio-group v-model="updateMode" style="margin-bottom: 20px;">
        <el-radio-button label="increment">
          增量更新
        </el-radio-button>
        <el-radio-button label="complete">
          直接完成
        </el-radio-button>
      </el-radio-group>

      <!-- Increment mode -->
      <template v-if="updateMode === 'increment'">
        <el-form-item label="本次完成数量" prop="quantity_increment">
          <el-input-number
            v-model="form.quantity_increment"
            :min="0"
            :max="maxIncrement"
            :step="1"
            controls-position="right"
            style="width: 100%;"
          />
          <div class="hint">
            更新后进度: {{ projectedCompleted }} / {{ task.production_quantity }}
          </div>
        </el-form-item>

        <el-form-item label="不良品数量" prop="quantity_defective">
          <el-input-number
            v-model="form.quantity_defective"
            :min="0"
            :step="1"
            controls-position="right"
            style="width: 100%;"
          />
        </el-form-item>
      </template>

      <!-- Complete mode -->
      <template v-if="updateMode === 'complete'">
        <el-form-item label="完成理由">
          <el-input
            v-model="form.completion_reason"
            type="textarea"
            :rows="2"
            placeholder="请输入完成理由（可选）"
          />
        </el-form-item>

        <el-form-item label="不良品数量">
          <el-input-number
            v-model="form.quantity_defective"
            :min="0"
            :max="task.production_quantity"
            :step="1"
            controls-position="right"
            style="width: 100%;"
          />
        </el-form-item>
      </template>

      <!-- Notes (both modes) -->
      <el-form-item label="备注">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          placeholder="请输入备注（可选）"
        />
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ updateMode === 'complete' ? '确认完成' : '确认更新' }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { workOrderTaskAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'OperatorTaskUpdateDialog',
  props: {
    visible: Boolean,
    task: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      updateMode: 'increment',  // 'increment' or 'complete'
      submitting: false,
      form: {
        quantity_increment: 0,
        quantity_defective: 0,
        completion_reason: '',
        notes: ''
      },
      rules: {
        quantity_increment: [
          { required: true, message: '请输入完成数量', trigger: 'blur' },
          { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogVisible: {
      get() { return this.visible },
      set(val) { this.$emit('update:visible', val) }
    },
    dialogTitle() {
      return this.updateMode === 'complete' ? '完成任务' : '更新进度'
    },
    currentProgress() {
      if (!this.task.production_quantity) return 0
      return Math.round((this.task.quantity_completed / this.task.production_quantity) * 100)
    },
    progressColor() {
      const p = this.currentProgress
      if (p >= 100) return '#67C23A'
      if (p >= 50) return '#409EFF'
      return '#E6A23C'
    },
    maxIncrement() {
      return (this.task.production_quantity || 0) - (this.task.quantity_completed || 0)
    },
    projectedCompleted() {
      return (this.task.quantity_completed || 0) + (this.form.quantity_increment || 0)
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.resetForm()
      }
    }
  },
  methods: {
    resetForm() {
      this.updateMode = 'increment'
      this.form = {
        quantity_increment: 1,
        quantity_defective: 0,
        completion_reason: '',
        notes: ''
      }
      this.$nextTick(() => {
        this.$refs.form?.clearValidate()
      })
    },
    async handleSubmit() {
      const valid = await this.$refs.form.validate().catch(() => false)
      if (!valid) return

      this.submitting = true
      try {
        if (this.updateMode === 'complete') {
          await workOrderTaskAPI.complete(this.task.id, {
            ...this.form,
            version: this.task.version
          })
          ErrorHandler.showSuccess('任务已完成')
        } else {
          await workOrderTaskAPI.updateQuantity(this.task.id, {
            ...this.form,
            version: this.task.version
          })
          ErrorHandler.showSuccess('进度已更新')
        }
        this.$emit('success')
        this.handleClose()
      } catch (error) {
        if (error.response?.status === 409) {
          ErrorHandler.showError('任务已被其他操作员更新，请刷新后重试')
        } else {
          ErrorHandler.showMessage(error, this.updateMode === 'complete' ? '完成任务' : '更新进度')
        }
      } finally {
        this.submitting = false
      }
    },
    handleClose() {
      this.dialogVisible = false
    }
  }
}
</script>

<style scoped>
.task-info {
  background-color: #F5F7FA;
  padding: 12px;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.progress-text {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
