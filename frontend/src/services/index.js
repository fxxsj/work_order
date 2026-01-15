/**
 * 服务层统一导出
 *
 * 集中导出所有服务模块，方便组件引用
 */

import baseService from './base/BaseService'
import taskService from './TaskService'
import workOrderService from './WorkOrderService'
import formValidationService from './FormValidationService'
import permissionService from './PermissionService'
import exportService from './ExportService'

export {
  // 基础服务
  baseService,

  // 业务服务
  taskService,
  workOrderService,

  // 功能服务
  formValidationService,
  permissionService,
  exportService
}

export default {
  baseService,
  taskService,
  workOrderService,
  formValidationService,
  permissionService,
  exportService
}
