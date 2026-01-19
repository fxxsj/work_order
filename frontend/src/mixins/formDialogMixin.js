/**
 * 表单对话框 Mixin
 * 提供统一的表单对话框逻辑，包括验证、提交、重置等
 *
 * 使用方式：
 * import formDialogMixin from '@/mixins/formDialogMixin'
 *
 * export default {
 *   mixins: [formDialogMixin],
 *   data() {
 *     return {
 *       form: { name: '', age: 0 },
 *       rules: {
 *         name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
 *       }
 *     }
 *   }
 * }
 */
export default {
  data() {
    return {
      // 对话框状态
      dialogVisible: false,
      dialogTitle: '',
      dialogType: 'create', // 'create' | 'edit' | 'view'
      dialogLoading: false,

      // 表单数据（子组件必须提供）
      form: {},
      rules: {},

      // 表单验证
      formErrors: []
    }
  },

  methods: {
    /**
     * 显示创建对话框
     */
    showCreateDialog() {
      this.dialogType = 'create'
      this.dialogTitle = '新建'
      this.resetForm()
      this.dialogVisible = true
    },

    /**
     * 显示编辑对话框
     * @param {Object} row - 当前行数据
     */
    showEditDialog(row) {
      this.dialogType = 'edit'
      this.dialogTitle = '编辑'
      this.form = { ...row }
      this.dialogVisible = true
    },

    /**
     * 显示查看对话框
     * @param {Object} row - 当前行数据
     */
    showViewDialog(row) {
      this.dialogType = 'view'
      this.dialogTitle = '详情'
      this.form = { ...row }
      this.dialogVisible = true
    },

    /**
     * 关闭对话框
     */
    closeDialog() {
      this.dialogVisible = false
      this.resetForm()
    },

    /**
     * 重置表单
     */
    resetForm() {
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
      this.formErrors = []

      // 调用子组件的自定义重置方法（如果存在）
      if (typeof this.customResetForm === 'function') {
        this.customResetForm()
      }
    },

    /**
     * 验证表单
     * @returns {Promise<boolean>} 验证结果
     */
    async validateForm() {
      if (!this.$refs.form) {
        return true
      }

      try {
        await this.$refs.form.validate()
        return true
      } catch (error) {
        this.$message.warning('请检查表单填写是否正确')
        return false
      }
    },

    /**
     * 提交表单
     */
    async submitForm() {
      // 验证表单
      const valid = await this.validateForm()
      if (!valid) return

      this.dialogLoading = true
      try {
        // 调用子组件的提交方法
        if (typeof this.handleFormSubmit === 'function') {
          await this.handleFormSubmit(this.form)
        } else {
          throw new Error('请在组件中实现 handleFormSubmit 方法')
        }

        this.closeDialog()
      } catch (error) {
        console.error('表单提交失败:', error)
        this.formErrors = error.response?.data || []
      } finally {
        this.dialogLoading = false
      }
    },

    /**
     * 处理对话框关闭前
     */
    handleDialogClose(done) {
      if (this.dialogLoading) {
        this.$message.warning('正在提交，请稍候...')
        return
      }

      this.resetForm()
      done()
    }
  },

  computed: {
    /**
     * 是否为查看模式
     */
    isViewMode() {
      return this.dialogType === 'view'
    },

    /**
     * 是否为编辑模式
     */
    isEditMode() {
      return this.dialogType === 'edit'
    },

    /**
     * 是否为创建模式
     */
    isCreateMode() {
      return this.dialogType === 'create'
    }
  }
}
