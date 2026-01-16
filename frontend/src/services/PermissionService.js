/**
 * 权限检查服务
 *
 * 提供统一的权限检查逻辑，避免在各个组件中重复编写权限代码
 */

/**
 * 权限服务类
 */
class PermissionService {
  constructor() {
    this.userPermissions = new Set()
    this.userRoles = new Set()
    this.currentUser = null
  }

  /**
   * 初始化用户权限信息
   * @param {Object} user - 用户对象
   */
  initUser(user) {
    this.currentUser = user

    // 加载用户角色
    if (user.groups && Array.isArray(user.groups)) {
      this.userRoles = new Set(user.groups.map(g => g.name))
    }

    // 加载用户权限
    if (user.permissions && Array.isArray(user.permissions)) {
      this.userPermissions = new Set(user.permissions)
    }
  }

  /**
   * 检查用户是否具有指定角色
   * @param {string|Array} roles - 角色名或角色数组
   * @returns {boolean} 是否具有角色
   */
  hasRole(roles) {
    if (!this.currentUser) {
      return false
    }

    if (this.currentUser.is_superuser) {
      return true
    }

    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.some(role => this.userRoles.has(role))
  }

  /**
   * 检查用户是否具有指定权限
   * @param {string|Array} permissions - 权限名或权限数组
   * @returns {boolean} 是否具有权限
   */
  hasPermission(permissions) {
    if (!this.currentUser) {
      return false
    }

    if (this.currentUser.is_superuser) {
      return true
    }

    const permArray = Array.isArray(permissions) ? permissions : [permissions]
    return permArray.some(perm => this.userPermissions.has(perm))
  }

  /**
   * 检查是否可以查看施工单
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可以查看
   */
  canViewWorkOrder(workOrder) {
    if (!this.currentUser) {
      return false
    }

    // 超级管理员可以查看所有
    if (this.currentUser.is_superuser) {
      return true
    }

    // 业务员可以查看自己的客户或自己创建的施工单
    if (this.hasRole('业务员')) {
      return workOrder.customer?.salesperson?.id === this.currentUser.id ||
             workOrder.created_by?.id === this.currentUser.id
    }

    // 生产主管可以查看本部门相关的施工单
    if (this.hasRole('生产主管') && this.hasPermission('workorder.view')) {
      return this.canViewDepartmentWorkOrder(workOrder)
    }

    // 普通用户只能查看自己创建的
    return workOrder.created_by?.id === this.currentUser.id
  }

  /**
   * 检查是否可以查看部门相关的施工单
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可以查看
   */
  canViewDepartmentWorkOrder(workOrder) {
    if (!this.currentUser.profile) {
      return false
    }

    const userDepartments = this.currentUser.profile.departments || []

    // 检查施工单是否有任务分派到用户的部门
    return workOrder.order_processes?.some(process => {
      return process.tasks?.some(task => {
        return userDepartments.some(dept =>
          dept.id === task.assigned_department?.id
        )
      })
    })
  }

  /**
   * 检查是否可以编辑施工单
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可以编辑
   */
  canEditWorkOrder(workOrder) {
    if (!this.canViewWorkOrder(workOrder)) {
      return false
    }

    // 已审核通过的施工单有保护字段
    if (workOrder.approval_status === 'approved') {
      return this.hasPermission('workorder.change_approved')
    }

    return this.hasPermission('workorder.change')
  }

  /**
   * 检查是否可以删除施工单
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可以删除
   */
  canDeleteWorkOrder(workOrder) {
    // 只能删除未开始生产的施工单
    if (workOrder.status !== 'pending') {
      return false
    }

    // 已审核通过的施工单不能删除
    if (workOrder.approval_status === 'approved') {
      return false
    }

    return this.hasPermission('workorder.delete')
  }

  /**
   * 检查是否可以审核施工单
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可以审核
   */
  canApproveWorkOrder(workOrder) {
    // 超级用户可以直接审核
    if (this.currentUser?.is_superuser) {
      return true
    }

    if (!this.hasPermission('workorder.approve')) {
      return false
    }

    // 业务员只能审核自己的客户
    if (this.hasRole('业务员')) {
      return workOrder.customer?.salesperson?.id === this.currentUser.id
    }

    // 有审核权限的用户可以审核
    return true
  }

  /**
   * 检查是否可以操作任务
   * @param {Object} task - 任务对象
   * @param {string} action - 操作类型 'view' | 'update' | 'complete' | 'assign'
   * @returns {boolean} 是否可以操作
   */
  canOperateTask(task, action = 'view') {
    if (!this.currentUser) {
      return false
    }

    // 超级管理员可以操作所有
    if (this.currentUser.is_superuser) {
      return true
    }

    // 查看权限
    if (action === 'view') {
      // 可以查看自己分派的任务或本部门的任务
      if (task.assigned_operator?.id === this.currentUser.id) {
        return true
      }

      if (this.hasRole('生产主管') && task.assigned_department) {
        const userDepartments = this.currentUser.profile?.departments || []
        return userDepartments.some(dept =>
          dept.id === task.assigned_department.id
        )
      }

      // 可以查看自己创建的施工单的任务
      if (task.work_order_process?.work_order?.created_by?.id === this.currentUser.id) {
        return true
      }

      return false
    }

    // 更新/完成权限
    if (action === 'update' || action === 'complete') {
      // 只能操作自己分派的任务
      if (task.assigned_operator?.id === this.currentUser.id) {
        return true
      }

      // 生产主管可以操作本部门的任务
      if (this.hasRole('生产主管') && this.hasPermission('workorder.change_workorder')) {
        if (task.assigned_department) {
          const userDepartments = this.currentUser.profile?.departments || []
          return userDepartments.some(dept =>
            dept.id === task.assigned_department.id
          )
        }
      }

      // 施工单创建人可以操作
      if (task.work_order_process?.work_order?.created_by?.id === this.currentUser.id) {
        return true
      }

      return false
    }

    // 分派权限
    if (action === 'assign') {
      return this.hasPermission('workorder.assign_task')
    }

    return false
  }

  /**
   * 获取施工单的可编辑字段
   * @param {Object} workOrder - 施工单对象
   * @returns {Array} 可编辑字段列表
   */
  getEditableFields(workOrder) {
    // 如果已审核通过，只能编辑部分字段
    if (workOrder.approval_status === 'approved') {
      if (this.hasPermission('workorder.change_approved')) {
        // 有特殊权限的用户可以编辑更多字段
        return []
      }

      // 普通用户只能编辑备注和交货日期
      return ['notes', 'delivery_date', 'actual_delivery_date']
    }

    // 待审核或未提交的施工单，有编辑权限的用户可以编辑所有字段
    if (this.hasPermission('workorder.change')) {
      // 返回所有可编辑的字段列表
      return [
        'customer',
        'production_quantity',
        'order_date',
        'delivery_date',
        'priority',
        'notes',
        'products_data',
        'processes'
      ]
    }

    return []
  }

  /**
   * 检查字段是否可编辑
   * @param {Object} workOrder - 施工单对象
   * @param {string} field - 字段名
   * @returns {boolean} 是否可编辑
   */
  isFieldEditable(workOrder, field) {
    const editableFields = this.getEditableFields(workOrder)

    // 如果 editableFields 为空，表示所有字段都可编辑
    if (editableFields.length === 0) {
      return true
    }

    return editableFields.includes(field)
  }

  /**
   * 过滤施工单列表（数据权限）
   * @param {Array} workOrders - 施工单列表
   * @returns {Array} 过滤后的施工单列表
   */
  filterWorkOrders(workOrders) {
    if (!this.currentUser) {
      return []
    }

    // 超级管理员可以看到所有
    if (this.currentUser.is_superuser) {
      return workOrders
    }

    return workOrders.filter(wo => this.canViewWorkOrder(wo))
  }

  /**
   * 过滤任务列表（数据权限）
   * @param {Array} tasks - 任务列表
   * @returns {Array} 过滤后的任务列表
   */
  filterTasks(tasks) {
    if (!this.currentUser) {
      return []
    }

    // 超级管理员可以看到所有
    if (this.currentUser.is_superuser) {
      return tasks
    }

    return tasks.filter(task => this.canOperateTask(task, 'view'))
  }

  /**
   * 检查是否可以访问菜单
   * @param {Object} menu - 菜单对象
   * @returns {boolean} 是否可以访问
   */
  canAccessMenu(menu) {
    if (!menu) {
      return false
    }

    // 超级用户可以访问所有菜单
    if (this.currentUser?.is_superuser) {
      return true
    }

    // 如果是字符串，转换为菜单对象
    let menuObj = menu
    if (typeof menu === 'string') {
      // 菜单路径到权限的映射
      const menuPermissionMap = {
        '/workorders': 'workorder.view',
        '/tasks': 'task.view',
        '/customers': 'customer.view',
        '/products': 'product.view',
        '/materials': 'material.view',
        '/artworks': 'artwork.view',
        '/reports': 'report.view',
        '/settings': 'setting.view',
        '/admin': 'admin.access'
      }

      menuObj = {
        path: menu,
        permission: menuPermissionMap[menu]
      }
    }

    // 检查角色权限
    if (menuObj.roles && menuObj.roles.length > 0) {
      if (!this.hasRole(menuObj.roles)) {
        return false
      }
    }

    // 检查具体权限
    if (menuObj.permission) {
      if (!this.hasPermission(menuObj.permission)) {
        return false
      }
    }

    return true
  }

  /**
   * 检查是否可以导出数据
   * @param {string} dataType - 数据类型 'workorder' | 'task' | 'customer'
   * @returns {boolean} 是否可以导出
   */
  canExport(dataType) {
    // 超级用户可以导出所有数据
    if (this.currentUser?.is_superuser) {
      return true
    }

    const exportPermissionMap = {
      workorder: 'workorder.export_workorder',
      task: 'workorder.export_task',
      customer: 'workorder.export_customer'
    }

    // 如果有具体的导出权限，允许导出
    if (exportPermissionMap[dataType] && this.hasPermission(exportPermissionMap[dataType])) {
      return true
    }

    // 如果有查看权限，也允许导出
    const viewPermissionMap = {
      workorder: 'workorder.view',
      task: 'workorder.view',
      customer: 'workorder.view'
    }

    return this.hasPermission(viewPermissionMap[dataType] || 'workorder.view')
  }

  /**
   * 获取用户信息摘要
   * @returns {Object} 用户信息摘要
   */
  getUserSummary() {
    if (!this.currentUser) {
      return {
        isAuthenticated: false,
        roles: [],
        permissions: []
      }
    }

    return {
      isAuthenticated: true,
      id: this.currentUser.id,
      username: this.currentUser.username,
      email: this.currentUser.email,
      isSuperuser: this.currentUser.is_superuser,
      roles: Array.from(this.userRoles),
      permissions: Array.from(this.userPermissions)
    }
  }

  /**
   * 重置权限信息
   */
  reset() {
    this.userPermissions.clear()
    this.userRoles.clear()
    this.currentUser = null
  }
}

// 创建单例实例
const permissionService = new PermissionService()

// 注意: PermissionService 不再自动初始化
// 应该在 Vuex Store 的 user 模块中通过 initUser() 方法初始化
// 或者在用户登录成功后手动调用 permissionService.initUser(user)

export default permissionService
