/**
 * PermissionService 单元测试
 */

import permissionService from '@/services/PermissionService'

describe('PermissionService', () => {
  beforeEach(() => {
    // 每个测试前重置状态
    permissionService.currentUser = null
    permissionService.userRoles = new Set()
    permissionService.userPermissions = new Set()
  })

  describe('initUser', () => {
    test('应该初始化用户信息和角色', () => {
      const user = {
        id: 1,
        username: 'testuser',
        is_superuser: false,
        groups: [
          { id: 1, name: '业务员' },
          { id: 2, name: '生产主管' }
        ],
        permissions: ['workorder.view', 'workorder.change']
      }

      permissionService.initUser(user)

      expect(permissionService.currentUser).toEqual(user)
      expect(permissionService.userRoles.has('业务员')).toBe(true)
      expect(permissionService.userRoles.has('生产主管')).toBe(true)
      expect(permissionService.userPermissions.has('workorder.view')).toBe(true)
    })

    test('应该初始化超级用户', () => {
      const user = {
        id: 1,
        username: 'admin',
        is_superuser: true,
        groups: [],
        permissions: []
      }

      permissionService.initUser(user)

      expect(permissionService.currentUser).toEqual(user)
      expect(permissionService.userRoles.size).toBe(0)
      expect(permissionService.userPermissions.size).toBe(0)
    })

    test('应该处理空的用户组', () => {
      const user = {
        id: 1,
        username: 'testuser',
        is_superuser: false,
        groups: null,
        permissions: []
      }

      permissionService.initUser(user)

      expect(permissionService.currentUser).toEqual(user)
      expect(permissionService.userRoles.size).toBe(0)
    })

    test('应该处理空的权限列表', () => {
      const user = {
        id: 1,
        username: 'testuser',
        is_superuser: false,
        groups: [{ id: 1, name: '业务员' }],
        permissions: null
      }

      permissionService.initUser(user)

      expect(permissionService.currentUser).toEqual(user)
      expect(permissionService.userPermissions.size).toBe(0)
    })
  })

  describe('hasRole', () => {
    beforeEach(() => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        groups: [
          { id: 1, name: '业务员' },
          { id: 2, name: '生产主管' }
        ]
      })
    })

    test('应该检查单个角色', () => {
      expect(permissionService.hasRole('业务员')).toBe(true)
      expect(permissionService.hasRole('管理员')).toBe(false)
    })

    test('应该检查多个角色（OR）', () => {
      expect(permissionService.hasRole(['业务员', '管理员'])).toBe(true)
      expect(permissionService.hasRole(['管理员', '经理'])).toBe(false)
    })

    test('超级用户应该拥有所有角色', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: true,
        groups: []
      })

      expect(permissionService.hasRole('任意角色')).toBe(true)
    })

    test('没有用户时应该返回false', () => {
      permissionService.currentUser = null
      expect(permissionService.hasRole('业务员')).toBe(false)
    })
  })

  describe('hasPermission', () => {
    beforeEach(() => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        groups: [],
        permissions: ['workorder.view', 'workorder.change', 'task.view']
      })
    })

    test('应该检查单个权限', () => {
      expect(permissionService.hasPermission('workorder.view')).toBe(true)
      expect(permissionService.hasPermission('workorder.delete')).toBe(false)
    })

    test('应该检查多个权限（OR）', () => {
      expect(permissionService.hasPermission(['workorder.view', 'workorder.delete'])).toBe(true)
      expect(permissionService.hasPermission(['workorder.delete', 'workorder.approve'])).toBe(false)
    })

    test('超级用户应该拥有所有权限', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: true,
        permissions: []
      })

      expect(permissionService.hasPermission('任意权限')).toBe(true)
    })

    test('没有用户时应该返回false', () => {
      permissionService.currentUser = null
      expect(permissionService.hasPermission('workorder.view')).toBe(false)
    })
  })

  describe('canViewWorkOrder', () => {
    const salespersonUser = {
      id: 1,
      is_superuser: false,
      groups: [{ name: '业务员' }]
    }

    const supervisorUser = {
      id: 2,
      is_superuser: false,
      groups: [{ name: '生产主管' }]
    }

    const workOrder = {
      id: 1,
      customer: { id: 1, salesperson: { id: 1 } },
      created_by: { id: 3 }
    }

    test('业务员应该能查看自己客户的施工单', () => {
      permissionService.initUser(salespersonUser)
      expect(permissionService.canViewWorkOrder(workOrder)).toBe(true)
    })

    test('业务员不能查看其他客户的施工单', () => {
      permissionService.initUser(salespersonUser)
      const otherWorkOrder = {
        ...workOrder,
        customer: { id: 2, salesperson: { id: 2 } }
      }
      expect(permissionService.canViewWorkOrder(otherWorkOrder)).toBe(false)
    })

    test('超级用户应该能查看所有施工单', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: true,
        groups: []
      })
      expect(permissionService.canViewWorkOrder(workOrder)).toBe(true)
    })

    test('制单人应该能查看自己创建的施工单', () => {
      permissionService.initUser({
        id: 3,
        is_superuser: false,
        groups: []
      })
      expect(permissionService.canViewWorkOrder(workOrder)).toBe(true)
    })
  })

  describe('canEditWorkOrder', () => {
    test('已审核通过的施工单需要特殊权限才能编辑', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        groups: [{ name: '业务员' }],
        permissions: ['workorder.change']
      })

      const approvedWorkOrder = {
        id: 1,
        approval_status: 'approved',
        customer: { salesperson: { id: 1 } }
      }

      // 业务员没有编辑已审核订单的权限
      expect(permissionService.canEditWorkOrder(approvedWorkOrder)).toBe(false)
    })

    test('有待审核状态的施工单可以编辑', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        groups: [{ name: '业务员' }],
        permissions: ['workorder.change']
      })

      const pendingWorkOrder = {
        id: 1,
        approval_status: 'pending',
        customer: { salesperson: { id: 1 } }
      }

      expect(permissionService.canEditWorkOrder(pendingWorkOrder)).toBe(true)
    })

    test('超级用户可以编辑所有施工单', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: true,
        groups: []
      })

      const workOrder = {
        id: 1,
        approval_status: 'approved'
      }

      expect(permissionService.canEditWorkOrder(workOrder)).toBe(true)
    })
  })

  describe('canDeleteWorkOrder', () => {
    test('只有待开始且未提交审核的可以删除', () => {
      const workOrder = {
        id: 1,
        status: 'pending',
        approval_status: 'pending'
      }

      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['workorder.delete']
      })

      expect(permissionService.canDeleteWorkOrder(workOrder)).toBe(true)
    })

    test('进行中的施工单不能删除', () => {
      const workOrder = {
        id: 1,
        status: 'in_progress',
        approval_status: 'pending'
      }

      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['workorder.delete']
      })

      expect(permissionService.canDeleteWorkOrder(workOrder)).toBe(false)
    })

    test('已审核的施工单不能删除', () => {
      const workOrder = {
        id: 1,
        status: 'pending',
        approval_status: 'approved'
      }

      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['workorder.delete']
      })

      expect(permissionService.canDeleteWorkOrder(workOrder)).toBe(false)
    })
  })

  describe('canApproveWorkOrder', () => {
    test('有审核权限的用户应该能审核', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['workorder.approve']
      })

      const workOrder = { id: 1, approval_status: 'pending' }

      expect(permissionService.canApproveWorkOrder(workOrder)).toBe(true)
    })

    test('没有审核权限的用户不能审核', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['workorder.view']
      })

      const workOrder = { id: 1, approval_status: 'pending' }

      expect(permissionService.canApproveWorkOrder(workOrder)).toBe(false)
    })

    test('超级用户应该能审核', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: true,
        permissions: []
      })

      const workOrder = { id: 1, approval_status: 'pending' }

      expect(permissionService.canApproveWorkOrder(workOrder)).toBe(true)
    })
  })

  describe('canOperateTask', () => {
    test('应该检查任务操作权限', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['task.complete']
      })

      const task = { id: 1, assigned_operator: { id: 1 } }

      expect(permissionService.canOperateTask(task, 'complete')).toBe(true)
      expect(permissionService.canOperateTask(task, 'delete')).toBe(false)
    })

    test('任务分派给当前用户应该可以操作', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['task.update']
      })

      const task = { id: 1, assigned_operator: { id: 1 } }

      expect(permissionService.canOperateTask(task, 'update')).toBe(true)
    })
  })

  describe('filterWorkOrders', () => {
    test('超级用户应该能看到所有施工单', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: true,
        groups: []
      })

      const workOrders = [
        { id: 1, customer: { salesperson: { id: 1 } } },
        { id: 2, customer: { salesperson: { id: 2 } } }
      ]

      const filtered = permissionService.filterWorkOrders(workOrders)
      expect(filtered.length).toBe(2)
    })

    test('业务员应该只能看到自己客户的施工单', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        groups: [{ name: '业务员' }]
      })

      const workOrders = [
        { id: 1, customer: { salesperson: { id: 1 } } },
        { id: 2, customer: { salesperson: { id: 2 } } },
        { id: 3, created_by: { id: 1 } }
      ]

      const filtered = permissionService.filterWorkOrders(workOrders)
      expect(filtered.length).toBe(2)
      expect(filtered.every(wo => wo.customer?.salesperson?.id === 1 || wo.created_by?.id === 1)).toBe(true)
    })

    test('没有用户时应该返回空数组', () => {
      permissionService.currentUser = null

      const workOrders = [{ id: 1 }, { id: 2 }]
      const filtered = permissionService.filterWorkOrders(workOrders)
      expect(filtered).toEqual([])
    })
  })

  describe('canAccessMenu', () => {
    test('有权限的用户应该能访问菜单', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['workorder.view']
      })

      expect(permissionService.canAccessMenu('/workorders')).toBe(true)
    })

    test('没有权限的用户不能访问菜单', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: []
      })

      expect(permissionService.canAccessMenu('/workorders')).toBe(false)
    })

    test('超级用户应该能访问所有菜单', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: true,
        permissions: []
      })

      expect(permissionService.canAccessMenu('/any-menu')).toBe(true)
    })
  })

  describe('canExport', () => {
    test('有导出权限的用户应该能导出', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['workorder.view']
      })

      expect(permissionService.canExport()).toBe(true)
    })

    test('没有导出权限的用户不能导出', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: []
      })

      expect(permissionService.canExport()).toBe(false)
    })

    test('超级用户应该能导出', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: true,
        permissions: []
      })

      expect(permissionService.canExport()).toBe(true)
    })
  })

  describe('getEditableFields', () => {
    test('已审核通过的字段应该受限', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['workorder.change']
      })

      const workOrder = {
        id: 1,
        approval_status: 'approved',
        status: 'pending'
      }

      const editableFields = permissionService.getEditableFields(workOrder)
      expect(editableFields).not.toContain('status')
      expect(editableFields).not.toContain('production_quantity')
    })

    test('待审核的字段应该全部可编辑', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['workorder.change']
      })

      const workOrder = {
        id: 1,
        approval_status: 'pending'
      }

      const editableFields = permissionService.getEditableFields(workOrder)
      expect(editableFields.length).toBeGreaterThan(0)
    })
  })

  describe('isFieldEditable', () => {
    test('应该检查字段是否可编辑', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: false,
        permissions: ['workorder.change']
      })

      const workOrder = {
        id: 1,
        approval_status: 'approved',
        status: 'pending'
      }

      // 已审核的订单，状态字段不可编辑
      expect(permissionService.isFieldEditable(workOrder, 'status')).toBe(false)
      expect(permissionService.isFieldEditable(workOrder, 'notes')).toBe(true)
    })

    test('超级用户应该能编辑所有字段', () => {
      permissionService.initUser({
        id: 1,
        is_superuser: true,
        permissions: []
      })

      const workOrder = {
        id: 1,
        approval_status: 'approved'
      }

      expect(permissionService.isFieldEditable(workOrder, 'status')).toBe(true)
      expect(permissionService.isFieldEditable(workOrder, 'any_field')).toBe(true)
    })
  })
})
