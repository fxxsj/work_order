<template>
  <el-dialog
    :visible.sync="dialogVisible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      :label-position="labelPosition"
    >
      <slot></slot>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button :disabled="loading" @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ submitText }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'FormDialog',
  props: {
    // 对话框标题
    title: {
      type: String,
      required: true
    },
    // 对话框宽度
    width: {
      type: String,
      default: '600px'
    },
    // 表单数据
    formData: {
      type: Object,
      default: () => ({})
    },
    // 验证规则
    rules: {
      type: Object,
      default: () => ({})
    },
    // 提交按钮文本
    submitText: {
      type: String,
      default: '确定'
    },
    // 标签宽度
    labelWidth: {
      type: String,
      default: '100px'
    },
    // 标签位置
    labelPosition: {
      type: String,
      default: 'right'
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      dialogVisible: false
    }
  },
  methods: {
    // 打开对话框
    open() {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$emit('open')
      })
    },
    // 关闭对话框
    close() {
      this.dialogVisible = false
      this.$emit('close')
    },
    // 处理关闭
    handleClose() {
      this.dialogVisible = false
      this.$emit('cancel')
    },
    // 提交表单
    handleSubmit() {
      this.$emit('submit')
    },
    // 验证表单
    validate(callback) {
      this.$refs.formRef.validate((valid) => {
        if (callback) {
          callback(valid)
        }
      })
    },
    // 清除验证
    clearValidate() {
      this.$refs.formRef?.clearValidate()
    },
    // 重置表单
    resetFields() {
      this.$refs.formRef?.resetFields()
    }
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
