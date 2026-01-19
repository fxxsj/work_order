/**
 * CRUD 权限 Mixin
 * 提供统一的 UI 级权限检查方法
 * 在 permissionMixin 基础上提供更便捷的 CRUD 权限方法
 *
 * 使用方式：
 * import crudPermissionMixin from '@/mixins/crudPermissionMixin'
 *
 * export default {
 *   mixins: [crudPermissionMixin],
 *   data() {
 *     return {
 *       permissionPrefix: 'customer'  // 必须提供权限前缀
 *     }
 *   }
 * }
 *
 * 在模板中使用：
 * <el-button v-if="canCreate" @click="handleCreate">新建</el-button>
 * <el-button v-if="canEdit(row)" @click="handleEdit(row)">编辑</el-button>
 * <el-button v-if="canDelete" @click="handleDelete(row)">删除</el-button>
 */
import permissionMixin from './permissionMixin'

export default {
  mixins: [permissionMixin],

  data() {
    return {
      // 权限前缀（如 'customer' -> 'customer.view', 'customer.create' 等）
      permissionPrefix: ''
    }
  },

  methods: {
    /**
     * 检查是否可以查看
     * @returns {boolean}
     */
    canView() {
      if (!this.permissionPrefix) return true
      return this.hasPermission(`${this.permissionPrefix}.view`)
    },

    /**
     * 检查是否可以创建
     * @returns {boolean}
     */
    canCreate() {
      if (!this.permissionPrefix) return true
      return this.hasPermission(`${this.permissionPrefix}.create`)
    },

    /**
     * 检查是否可以编辑
     * @param {Object} row - 行数据（可选，用于检查特定行的权限）
     * @returns {boolean}
     */
    canEdit(row) {
      if (!this.permissionPrefix) return true
      const hasEditPermission = this.hasPermission(`${this.permissionPrefix}.edit`)
      if (!hasEditPermission) return false

      // 可以扩展特定行的权限检查逻辑
      // 例如：只能编辑自己创建的数据
      if (row && this._checkRowEditPermission) {
        return this._checkRowEditPermission(row)
      }

      return true
    },

    /**
     * 检查是否可以删除
     * @param {Object} row - 行数据（可选，用于检查特定行的权限）
     * @returns {boolean}
     */
    canDelete(row) {
      if (!this.permissionPrefix) return true
      const hasDeletePermission = this.hasPermission(`${this.permissionPrefix}.delete`)
      if (!hasDeletePermission) return false

      // 可以扩展特定行的权限检查逻辑
      if (row && this._checkRowDeletePermission) {
        return this._checkRowDeletePermission(row)
      }

      return true
    },

    /**
     * 检查是否可以导出
     * @returns {boolean}
     */
    canExport() {
      if (!this.permissionPrefix) return true
      return this.hasPermission(`${this.permissionPrefix}.export`)
    },

    /**
     * 检查是否可以审批
     * @returns {boolean}
     */
    canApprove() {
      if (!this.permissionPrefix) return true
      return this.hasPermission(`${this.permissionPrefix}.approve`)
    },

    /**
     * 检查是否可以更改状态
     * @returns {boolean}
     */
    canChangeStatus() {
      if (!this.permissionPrefix) return true
      return this.hasPermission(`${this.permissionPrefix}.change_status`)
    },

    /**
     * 检查是否可以分配
     * @returns {boolean}
     */
    canAssign() {
      if (!this.permissionPrefix) return true
      return this.hasPermission(`${this.permissionPrefix}.assign`)
    },

    /**
     * 检查是否可以完成
     * @returns {boolean}
     */
    canComplete() {
      if (!this.permissionPrefix) return true
      return this.hasPermission(`${this.permissionPrefix}.complete`)
    },

    /**
     * 检查是否具有任意指定权限
     * @param {...string} permissions - 权限列表
     * @returns {boolean}
     */
    hasAnyOf(...permissions) {
      return this.hasAnyPermission(permissions)
    },

    /**
     * 检查是否具有所有指定权限
     * @param {...string} permissions - 权限列表
     * @returns {boolean}
     */
    hasAllOf(...permissions) {
      return this.hasAllPermissions(permissions)
    }
  }
}
