# Service Layer 快速参考指南

本文档提供了 Service 层的快速参考，帮助开发人员快速查找和使用各种服务。

## 目录

1. [导入服务](#导入服务)
2. [TaskService](#taskservice-任务服务)
3. [WorkOrderService](#workorderservice-施工单服务)
4. [FormValidationService](#formvalidationservice-表单验证服务)
5. [PermissionService](#permissionservice-权限服务)
6. [ExportService](#exportservice-导出服务)
7. [常见使用场景](#常见使用场景)

---

## 导入服务

### 方式 1: 单独导入

```javascript
import taskService from '@/services/TaskService'
import workOrderService from '@/services/WorkOrderService'
import formValidationService from '@/services/FormValidationService'
import permissionService from '@/services/PermissionService'
import exportService from '@/services/ExportService'
```

### 方式 2: 批量导入

```javascript
import {
  taskService,
  workOrderService,
  formValidationService,
  permissionService,
  exportService
} from '@/services'
```

---

## TaskService (任务服务)

### 基础 CRUD

```javascript
// 获取任务列表
const result = await taskService.getTasks({
  page: 1,
  page_size: 20,
  status: 'pending',
  task_type: 'plate_making'
})
if (result.success) {
  const tasks = result.data.results
  const total = result.data.count
}

// 获取任务详情
const result = await taskService.getTaskDetail(taskId)

// 创建任务
const result = await taskService.createTask(formData)

// 更新任务
const result = await taskService.updateTask(taskId, formData)

// 删除任务
const result = await taskService.deleteTask(taskId)
```

### 业务操作

```javascript
// 更新任务数量
const result = await taskService.updateTaskQuantity(
  taskId,
  10,              // 增量
  version          // 版本号（乐观锁）
)

// 完成任务
const result = await taskService.completeTask(taskId, {
  completion_reason: '已完成',
  quantity_defective: 0,
  artwork_ids: [1, 2],
  die_ids: [3],
  notes: '备注'
})

// 分派任务
const result = await taskService.assignTask(taskId, {
  assigned_department: deptId,
  assigned_operator: userId,
  reason: '原因',
  notes: '备注'
})

// 拆分任务
const result = await taskService.splitTask(taskId, {
  splits: [
    {
      production_quantity: 50,
      assigned_department: deptId,
      assigned_operator: userId,
      work_content: '子任务1'
    },
    {
      production_quantity: 50,
      assigned_department: deptId2,
      assigned_operator: userId2,
      work_content: '子任务2'
    }
  ]
})
```

### 业务规则检查

```javascript
// 检查任务是否可以完成
if (taskService.canComplete(task)) {
  await taskService.completeTask(taskId, data)
} else {
  const reason = taskService.getCannotCompleteReason(task)
  console.log('不能完成的原因:', reason)
}

// 计算任务进度
const progress = taskService.calculateProgress(task)  // 返回 0-100

// 检查任务是否逾期
if (taskService.isOverdue(task)) {
  console.log('任务已逾期')
}

// 获取剩余天数
const days = taskService.getRemainingDays(task)  // 负数表示逾期

// 验证任务拆分
const validation = taskService.validateSplit(task, splits)
if (!validation.valid) {
  console.log(validation.errors)
}
```

### 辅助方法

```javascript
// 获取状态选项
const statusOptions = taskService.getStatusOptions()
// [
//   { value: 'pending', label: '待开始' },
//   { value: 'in_progress', label: '进行中' },
//   ...
// ]

// 获取任务类型选项
const typeOptions = taskService.getTaskTypeOptions()

// 获取状态文本
const statusText = taskService.getStatusText('pending')  // '待开始'

// 获取状态类型（用于 Element UI Tag）
const statusType = taskService.getStatusType('completed')  // 'success'

// 格式化日期时间
const formatted = taskService.formatDateTime('2026-01-15T10:30:00')
// '2026-01-15 10:30:00'
```

---

## WorkOrderService (施工单服务)

### 基础 CRUD

```javascript
// 获取施工单列表
const result = await workOrderService.getWorkOrders({
  page: 1,
  page_size: 20,
  status: 'pending',
  ordering: '-created_at'
})

// 获取施工单详情
const result = await workOrderService.getWorkOrderDetail(orderId)

// 创建施工单
const result = await workOrderService.createWorkOrder({
  customer: customerId,
  production_quantity: 100,
  delivery_date: '2026-12-31',
  products_data: [...],
  processes: [processId1, processId2]
})

// 更新施工单
const result = await workOrderService.updateWorkOrder(orderId, formData)

// 删除施工单
const result = await workOrderService.deleteWorkOrder(orderId)
```

### 审核流程

```javascript
// 提交审核
const result = await workOrderService.submitForApproval(orderId)

// 审核通过
const result = await workOrderService.reviewWorkOrder(
  orderId,
  'approve',  // 或 'reject'
  '审核意见'
)
```

### 状态管理

```javascript
// 开始施工单
const result = await workOrderService.startWorkOrder(orderId)

// 完成施工单
const result = await workOrderService.completeWorkOrder(orderId)

// 取消施工单
const result = await workOrderService.cancelWorkOrder(orderId, '取消原因')
```

### 业务规则检查

```javascript
// 检查是否可编辑
if (workOrderService.canEdit(workOrder)) {
  // 显示编辑按钮
}

// 检查是否可删除
if (workOrderService.canDelete(workOrder)) {
  // 显示删除按钮
}

// 检查是否可提交审核
if (workOrderService.canSubmitForApproval(workOrder)) {
  // 显示提交审核按钮
}

// 检查是否可开始
if (workOrderService.canStart(workOrder)) {
  // 显示开始按钮
}

// 检查是否已完成
if (workOrderService.isCompleted(workOrder)) {
  console.log('已完成')
}

// 检查是否逾期
if (workOrderService.isOverdue(workOrder)) {
  console.log('已逾期')
}

// 获取剩余天数
const days = workOrderService.getRemainingDays(workOrder)
```

### 计算和格式化

```javascript
// 计算完成进度
const progress = workOrderService.calculateProgress(workOrder)  // 0-100

// 获取状态文本
const statusText = workOrderService.getStatusText('pending')  // '待开始'

// 获取审核状态文本
const approvalText = workOrderService.getApprovalStatusText('approved')  // '已审核'

// 获取优先级文本
const priorityText = workOrderService.getPriorityText('high')  // '高'

// 获取优先级类型（用于 Element UI Tag）
const priorityType = workOrderService.getPriorityType('urgent')  // 'danger'
```

### 数据处理

```javascript
// 格式化单个施工单用于显示
const formatted = workOrderService.formatWorkOrderForDisplay(workOrder)
// {
//   ...workOrder,
//   status_text: '待开始',
//   priority_type: 'warning',
//   progress_percentage: 50,
//   is_overdue: false,
//   can_edit: true,
//   ...
// }

// 批量格式化
const formattedList = workOrderService.formatWorkOrderList(workOrders)

// 获取统计信息
const stats = workOrderService.getStatistics(workOrders)
// {
//   total: 100,
//   pending: 20,
//   in_progress: 50,
//   completed: 25,
//   cancelled: 5,
//   overdue: 10,
//   ...
// }
```

### 关联数据

```javascript
// 获取工序列表
const result = await workOrderService.getWorkOrderProcesses(orderId)

// 获取任务列表
const result = await workOrderService.getWorkOrderTasks(orderId)

// 获取操作日志
const result = await workOrderService.getWorkOrderLogs(orderId)
```

---

## FormValidationService (表单验证服务)

### 基础验证

```javascript
// 必填验证
const result = formValidationService.required(value, '客户名称')
if (!result.valid) {
  console.log(result.message)  // '客户名称不能为空'
}

// 数字范围验证
const result = formValidationService.numberRange(value, {
  min: 1,
  max: 1000,
  minInclusive: true,
  maxInclusive: true
})

// 字符串长度验证
const result = formValidationService.stringLength(value, {
  min: 2,
  max: 50
})

// 日期范围验证
const result = formValidationService.dateRange(dateValue, {
  min: new Date('2026-01-01'),
  max: new Date('2026-12-31')
})

// 邮箱验证
const result = formValidationService.email(value)

// 手机号验证
const result = formValidationService.phone(value)
```

### 表单验证

```javascript
// 验证施工单表单
const result = formValidationService.validateWorkOrderForm(formData)
if (!result.valid) {
  console.log(result.errors)
  // {
  //   customer: '客户不能为空',
  //   production_quantity: '生产数量不能小于1',
  //   delivery_date: '交货日期不能早于今天'
  // }
}

// 验证任务完成表单
const result = formValidationService.validateTaskCompleteForm(formData)

// 验证任务拆分表单
const result = formValidationService.validateTaskSplitForm(formData)

// 验证客户表单
const result = formValidationService.validateCustomerForm(formData)

// 验证产品表单
const result = formValidationService.validateProductForm(formData)
```

### 批量验证

```javascript
// 批量验证多个字段
const fields = {
  customer: (value) => formValidationService.required(value, '客户'),
  quantity: (value) => formValidationService.numberRange(value, { min: 1 }),
  email: (value) => formValidationService.email(value)
}

const result = formValidationService.validateBatch(fields, formData)
if (!result.valid) {
  console.log(result.errors)
}
```

### 错误管理

```javascript
// 清除所有错误
formValidationService.clearErrors()

// 检查是否有错误
if (formValidationService.hasErrors()) {
  console.log('存在验证错误')
}

// 获取第一个错误
const firstError = formValidationService.getFirstError()
```

---

## PermissionService (权限服务)

### 初始化

```javascript
// 在应用启动时初始化用户权限
const userInfo = store.getters.currentUser
permissionService.initUser(userInfo)
```

### 角色和权限检查

```javascript
// 检查角色（支持单个或多个）
if (permissionService.hasRole('业务员')) {
  console.log('是业务员')
}

if (permissionService.hasRole(['业务员', '生产主管'])) {
  console.log('是业务员或生产主管')
}

// 检查权限
if (permissionService.hasPermission('workorder.change')) {
  console.log('有修改权限')
}
```

### 施工单权限

```javascript
// 检查是否可查看施工单
if (permissionService.canViewWorkOrder(workOrder)) {
  // 显示详情
}

// 检查是否可编辑施工单
if (permissionService.canEditWorkOrder(workOrder)) {
  // 显示编辑按钮
}

// 检查是否可删除施工单
if (permissionService.canDeleteWorkOrder(workOrder)) {
  // 显示删除按钮
}

// 检查是否可审核施工单
if (permissionService.canApproveWorkOrder(workOrder)) {
  // 显示审核按钮
}

// 获取可编辑字段
const editableFields = permissionService.getEditableFields(workOrder)
// ['customer', 'production_quantity', 'notes']

// 检查字段是否可编辑
if (permissionService.isFieldEditable(workOrder, 'customer')) {
  // 显示客户编辑控件
}
```

### 任务权限

```javascript
// 检查是否可操作任务
if (permissionService.canOperateTask(task, 'complete')) {
  // 显示完成按钮
}
```

### 数据过滤

```javascript
// 过滤可访问的施工单
const accessibleOrders = permissionService.filterWorkOrders(allOrders)

// 过滤可访问的任务
const accessibleTasks = permissionService.filterTasks(allTasks)
```

### 功能权限

```javascript
// 检查菜单访问权限
if (permissionService.canAccessMenu('/workorders')) {
  // 显示菜单项
}

// 检查导出权限
if (permissionService.canExport()) {
  // 显示导出按钮
}
```

---

## ExportService (导出服务)

### 通用导出

```javascript
// 导出到 Excel
const result = await exportService.exportToExcel(data, {
  filename: '导出文件',
  sheetName: 'Sheet1',
  columns: [
    { field: 'id', label: 'ID' },
    { field: 'name', label: '名称' },
    { field: 'date', label: '日期', formatter: (value) => formatDate(value) }
  ],
  title: '数据报表',
  author: '系统名称'
})

// 导出到 CSV
const result = await exportService.exportToCSV(data, {
  filename: '导出文件',
  columns: [
    { field: 'id', label: 'ID' },
    { field: 'name', label: '名称' }
  ],
  separator: ','
})
```

### 专项导出

```javascript
// 导出任务列表
const result = await exportService.exportTasks(tasks, {
  status: 'pending',
  task_type: 'plate_making'
})

// 导出施工单列表
const result = await exportService.exportWorkOrders(workOrders, {
  status: 'in_progress'
})
```

### 打印功能

```javascript
// 准备打印数据
const printData = exportService.preparePrintData(data, {
  title: '任务列表',
  columns: [
    { field: 'id', label: 'ID' },
    { field: 'name', label: '名称' }
  ],
  pageSize: 'A4',
  orientation: 'portrait'
})

// 生成打印 HTML
const html = exportService.generatePrintHTML(printData)

// 直接打印
exportService.print(printData)
```

---

## 常见使用场景

### 场景 1: 任务列表页面

```javascript
import { taskService, permissionService, exportService } from '@/services'

export default {
  data() {
    return {
      taskService,
      permissionService,
      exportService,
      loading: false,
      taskList: []
    }
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const result = await this.taskService.getTasks({
          page: 1,
          page_size: 20
        })

        if (result.success) {
          this.taskList = result.data.results
        } else {
          this.$message.error(result.error)
        }
      } finally {
        this.loading = false
      }
    },

    async handleComplete(task) {
      const result = await this.taskService.completeTask(task.id, {
        notes: '已完成'
      })

      if (result.success) {
        this.$message.success('任务已完成')
        await this.loadData()
      } else {
        this.$message.error(result.error)
      }
    },

    async handleExport() {
      const result = await this.exportService.exportTasks(this.taskList)

      if (result.success) {
        this.$message.success(result.message)
      } else {
        this.$message.error(result.error)
      }
    }
  }
}
```

### 场景 2: 施工单表单页面

```javascript
import { workOrderService, formValidationService } from '@/services'

export default {
  methods: {
    async handleSubmit() {
      // 验证表单
      const validation = this.formValidationService.validateWorkOrderForm(this.formData)
      if (!validation.valid) {
        this.$message.error('请检查表单填写')
        this.errors = validation.errors
        return
      }

      // 提交数据
      const result = await this.workOrderService.createWorkOrder(this.formData)
      if (result.success) {
        this.$message.success('创建成功')
        this.$router.back()
      } else {
        this.$message.error(result.error)
      }
    }
  }
}
```

### 场景 3: 权限控制

```javascript
import { permissionService } from '@/services'

export default {
  computed: {
    canEdit() {
      return this.permissionService.canEditWorkOrder(this.workOrder)
    },
    canDelete() {
      return this.permissionService.canDeleteWorkOrder(this.workOrder)
    },
    canApprove() {
      return this.permissionService.canApproveWorkOrder(this.workOrder)
    },
    editableFields() {
      return this.permissionService.getEditableFields(this.workOrder)
    }
  }
}
```

### 场景 4: 数据展示

```javascript
import { workOrderService } from '@/services'

export default {
  methods: {
    formatWorkOrder(workOrder) {
      return this.workOrderService.formatWorkOrderForDisplay(workOrder)
    },
    getStatusText(status) {
      return this.workOrderService.getStatusText(status)
    },
    getPriorityType(priority) {
      return this.workOrderService.getPriorityType(priority)
    }
  }
}
```

---

## 最佳实践

### 1. 错误处理

```javascript
// ✅ 推荐：使用 Service 层的错误处理
const result = await this.taskService.completeTask(taskId, data)
if (!result.success) {
  this.$message.error(result.error)
}

// ❌ 不推荐：自己处理错误
try {
  await api.complete(taskId, data)
} catch (error) {
  if (error.response?.status === 409) {
    this.$message.error('冲突')
  }
  // ...
}
```

### 2. 业务逻辑

```javascript
// ✅ 推荐：使用 Service 层的业务规则
if (this.taskService.canComplete(task)) {
  await this.taskService.completeTask(task.id, data)
}

// ❌ 不推荐：在组件中写业务逻辑
if (task.status !== 'completed' && task.task_type !== 'plate_making') {
  await api.complete(task.id, data)
}
```

### 3. 数据格式化

```javascript
// ✅ 推荐：使用 Service 层的格式化方法
const statusText = this.taskService.getStatusText(task.status)
const progress = this.taskService.calculateProgress(task)

// ❌ 不推荐：在组件中写格式化逻辑
const statusText = { pending: '待开始', in_progress: '进行中' }[task.status]
const progress = Math.round((task.quantity_completed / task.production_quantity) * 100)
```

---

## 相关文档

- [前端业务逻辑重构文档](./FRONTEND_REFACTORING.md) - 详细的重构说明和指南
- [深度代码分析报告](./CODE_ANALYSIS_REPORT.md) - 系统问题分析
- [API 文档](../README.md) - 后端 API 说明

---

**版本**: v1.0
**更新日期**: 2026-01-15
