<template>
  <el-dialog
    title="更新任务"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      label-width="120px"
      :rules="rules"
    >
      <el-form-item label="任务内容">
        <el-input :value="task?.work_content" disabled />
      </el-form-item>
      <el-form-item label="生产数量">
        <el-input :value="task?.production_quantity" disabled />
      </el-form-item>
      <el-form-item label="完成数量" prop="quantity_completed">
        <el-input-number
          v-model="form.quantity_completed"
          :min="0"
          :max="task?.production_quantity || 999999"
          :step="1"
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="更新说明">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入更新说明（可选）"
        />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        确定
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
// 表单初始值
const FORM_INITIAL = {
  quantity_completed: 0,
  notes: ''
}

export default {
  name: 'BoardUpdateDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    task: {
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
      form: { ...FORM_INITIAL },
      rules: {
        quantity_completed: [
          { required: true, message: '请输入完成数量', trigger: 'blur' }
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
    }
  },
  watch: {
    visible(val) {
      if (val && this.task) {
        this.initForm()
      }
    }
  },
  methods: {
    initForm() {
      this.form = {
        quantity_completed: this.task?.quantity_completed || 0,
        notes: this.task?.notes || ''
      }
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate()
      })
    },
    resetForm() {
      this.form = { ...FORM_INITIAL }
      this.$refs.formRef?.resetFields()
    },
    handleConfirm() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          this.$emit('confirm', { ...this.form })
        }
      })
    },
    handleClose() {
      this.resetForm()
      this.dialogVisible = false
    }
  }
}
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style>
