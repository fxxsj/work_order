/**
 * CRUD 操作 Mixin
 * 在 listPageMixin 基础上增加创建、更新、删除等操作
 *
 * 使用方式：
 * import crudMixin from '@/mixins/crudMixin'
 *
 * export default {
 *   mixins: [crudMixin],
 *   data() {
 *     return {
 *       apiService: customerAPI,  // 必须提供 API 服务
 *       permissionPrefix: 'customer'  // 可选，用于权限检查前缀
 *     }
 *   }
 * }
 */
import { MessageBox } from 'element-ui'
import listPageMixin from './listPageMixin'
import ErrorHandler from '@/utils/errorHandler'

export default {
  mixins: [listPageMixin],

  data() {
    return {
      // API 服务（必须由组件提供）
      apiService: null,

      // 权限前缀（可选，用于权限检查）
      permissionPrefix: '',

      // 表单对话框状态
      dialogVisible: false,
      dialogType: 'create', // 'create' | 'edit'
      formData: {},
      formLoading: false,

      // 当前操作的行
      currentRow: null
    }
  },

  methods: {
    /**
     * 打开创建对话框
     */
    handleCreate() {
      this.dialogType = 'create'
      this.formData = {}
      this.currentRow = null
      this.dialogVisible = true
    },

    /**
     * 打开编辑对话框
     * @param {Object} row - 当前行数据
     */
    handleEdit(row) {
      this.dialogType = 'edit'
      this.currentRow = row
      this.formData = { ...row }
      this.dialogVisible = true
    },

    /**
     * 处理删除
     * @param {Object} row - 当前行数据
     */
    async handleDelete(row) {
      try {
        await MessageBox.confirm(
          `确定要删除"${this._getRowName(row)}"吗？此操作不可撤销。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await this.apiService.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '删除')
        }
      }
    },

    /**
     * 批量删除
     * @param {Array} rows - 选中的行数据
     */
    async handleBatchDelete(rows) {
      if (!rows || rows.length === 0) {
        ErrorHandler.showWarning('请先选择要删除的数据')
        return
      }

      try {
        await MessageBox.confirm(
          `确定要删除选中的 ${rows.length} 条数据吗？此操作不可撤销。`,
          '确认批量删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const ids = rows.map(row => row.id)
        await this.apiService.batchDelete(ids)
        ErrorHandler.showSuccess(`成功删除 ${ids.length} 条数据`)
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '批量删除')
        }
      }
    },

    /**
     * 批量操作
     * @param {string} action - 操作类型
     * @param {Array} rows - 选中的行数据
     */
    async handleBatchAction(action, rows) {
      if (!rows || rows.length === 0) {
        ErrorHandler.showWarning('请先选择要操作的数据')
        return
      }

      try {
        const ids = rows.map(row => row.id)
        await this.apiService.batchAction({
          action,
          ids
        })
        ErrorHandler.showSuccess(`操作成功，共 ${ids.length} 条数据`)
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '批量操作')
      }
    },

    /**
     * 导出数据
     */
    async handleExport() {
      try {
        await MessageBox.confirm(
          '确定要导出当前数据吗？',
          '确认导出',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }
        )

        // 子组件可以重写此方法实现自定义导出逻辑
        const params = {
          page: this.currentPage,
          page_size: this.pageSize,
          search: this.searchText,
          ...this.filters
        }

        await this.apiService.customAction(
          `${this.apiService.baseUrl}export/`,
          'post',
          params
        )

        ErrorHandler.showSuccess('导出成功')
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '导出')
        }
      }
    },

    /**
     * 处理表单提交
     * @param {Object} formData - 表单数据
     */
    async handleFormSubmit(formData) {
      this.formLoading = true
      try {
        if (this.dialogType === 'create') {
          await this.apiService.create(formData)
          ErrorHandler.showSuccess('创建成功')
        } else {
          await this.apiService.update(this.currentRow.id, formData)
          ErrorHandler.showSuccess('更新成功')
        }

        this.dialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, this.dialogType === 'create' ? '创建' : '更新')
      } finally {
        this.formLoading = false
      }
    },

    /**
     * 获取行名称（用于删除确认）
     * @param {Object} row - 行数据
     * @returns {string} 行名称
     */
    _getRowName(row) {
      // 尝试常见的名称字段
      return row.name || row.title || row.code || row.id || '该数据'
    },

    /**
     * 获取权限标识
     * @param {string} action - 操作类型（view, create, edit, delete, export）
     * @returns {string} 权限标识
     */
    _getPermission(action) {
      const prefix = this.permissionPrefix || ''
      return `${prefix}.${action}`
    }
  },

  computed: {
    /**
     * 表单标题
     */
    formTitle() {
      return this.dialogType === 'create' ? '新建' : '编辑'
    }
  }
}
