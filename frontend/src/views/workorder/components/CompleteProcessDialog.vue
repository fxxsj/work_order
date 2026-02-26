<template>
  <el-dialog
    title="完成工序"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="form"
      label-width="120px"
      :rules="rules"
    >
      <el-form-item label="工序名称">
        <el-input :value="process ? process.process_name : ''" disabled />
      </el-form-item>
      <el-form-item label="任务完成情况">
        <div v-if="process && process.tasks">
          <div style="margin-bottom: 10px;">
            <span>总任务数：{{ process.tasks.length }}</span>
            <span style="margin-left: 20px;">已完成：{{ completedCount }}</span>
            <span v-if="incompleteCount > 0" style="margin-left: 20px; color: #E6A23C;">
              未完成：{{ incompleteCount }}
            </span>
          </div>
          <el-alert
            v-if="incompleteCount > 0"
            type="warning"
            :closable="false"
            style="margin-bottom: 10px;"
          >
            <div slot="title">
              <p>该工序还有 {{ incompleteCount }} 个任务未完成。</p>
              <p style="margin-top: 5px;">
                建议：先完成所有任务，工序会自动完成。如需强制完成，请勾选下方选项并填写原因。
              </p>
            </div>
          </el-alert>
        </div>
      </el-form-item>
      <el-form-item label="完成数量">
        <el-input-number
          v-model="form.quantity_completed"
          :min="0"
          style="width: 100%;"
        />
      </el-form-item>
      <el-form-item label="不良品数量">
        <el-input-number
          v-model="form.quantity_defective"
          :min="0"
          style="width: 100%;"
        />
      </el-form-item>
      <el-form-item v-if="incompleteCount > 0">
        <el-checkbox v-model="form.force_complete">
          强制完成（即使任务未完成）
        </el-checkbox>
        <div style="color: #909399; font-size: 12px; margin-top: 5px;">
          强制完成会将所有未完成的任务标记为已完成，请谨慎使用
        </div>
      </el-form-item>
      <el-form-item
        v-if="form.force_complete"
        label="强制完成原因"
        prop="force_reason"
      >
        <el-input
          v-model="form.force_reason"
          type="textarea"
          :rows="3"
          placeholder="请说明为什么需要强制完成工序（必填）"
        />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'CompleteProcessDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    process: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        quantity_completed: 0,
        quantity_defective: 0,
        force_complete: false,
        force_reason: ''
      },
      rules: {
        force_reason: [
          { required: true, message: '请填写强制完成原因', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    completedCount() {
      if (!this.process || !this.process.tasks) return 0
      return this.process.tasks.filter(t => t.status === 'completed').length
    },
    incompleteCount() {
      if (!this.process || !this.process.tasks) return 0
      return this.process.tasks.filter(t => t.status !== 'completed').length
    }
  },
  watch: {
    visible(val) {
      if (val && this.process) {
        this.form = {
          quantity_completed: this.process.quantity_completed || 0,
          quantity_defective: this.process.quantity_defective || 0,
          force_complete: false,
          force_reason: ''
        }
      }
    }
  },
  methods: {
    handleClose() {
      this.$refs.form && this.$refs.form.clearValidate()
      this.form = {
        quantity_completed: 0,
        quantity_defective: 0,
        force_complete: false,
        force_reason: ''
      }
    },
    handleCancel() {
      this.dialogVisible = false
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return

        const data = {
          quantity_completed: this.form.quantity_completed,
          quantity_defective: this.form.quantity_defective
        }

        if (this.form.force_complete) {
          data.force_complete = true
          data.force_reason = this.form.force_reason
        }

        this.$emit('submit', { processId: this.process.id, data })
      })
    }
  }
}
</script>
