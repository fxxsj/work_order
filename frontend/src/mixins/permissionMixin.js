/**
 * 权限检查 Mixin
 * 提供统一的权限检查方法，避免代码重复
 */
export default {
  methods: {
    /**
     * 检查用户是否具有指定权限
     * @param {string} permission - 权限标识
     * @returns {boolean} 是否有权限
     */
    hasPermission(permission) {
      const userInfo = this.$store.getters['user/currentUser']
      if (!userInfo) return false
      if (userInfo.is_superuser) return true
      const permissions = userInfo.permissions || []
      if (permissions.includes('*')) return true
      return permissions.includes(permission)
    },

    /**
     * 检查用户是否具有任一权限
     * @param {string[]} permissions - 权限标识数组
     * @returns {boolean} 是否有任一权限
     */
    hasAnyPermission(permissions) {
      if (!permissions || permissions.length === 0) return false
      return permissions.some(permission => this.hasPermission(permission))
    },

    /**
     * 检查用户是否具有所有权限
     * @param {string[]} permissions - 权限标识数组
     * @returns {boolean} 是否有所有权限
     */
    hasAllPermissions(permissions) {
      if (!permissions || permissions.length === 0) return true
      return permissions.every(permission => this.hasPermission(permission))
    }
  }
}
