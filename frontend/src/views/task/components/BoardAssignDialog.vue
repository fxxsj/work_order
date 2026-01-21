<template>
  <el-dialog
    title="分派任务"
    :visible.sync="dialogVisible"
    width="500px"
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
      <el-form-item label="操作员" prop="operator_id">
        <el-select
          v-model="form.operator_id"
          filterable
          placeholder="请选择操作员"
          style="width: 100%"
        >
          <el-option
            v-for="user in users"
            :key="user.id"
            :label="user.username"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="分派说明">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入分派说明（可选）"
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
  operator_id: null,
  notes: ''
}

export default {
  name: 'BoardAssignDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    task: {
      type: Object,
      default: null
    },
    users: {
      type: Array,
      default: () => []
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
        operator_id: [
          { required: true, message: '请选择操作员', trigger: 'change' }
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
        operator_id: this.task?.assigned_operator?.id || null,
        notes: ''
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
