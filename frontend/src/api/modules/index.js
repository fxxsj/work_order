/**
 * API Modules Barrel Export
 * 统一导出所有 API 模块，简化导入路径
 *
 * 使用方式：
 * import { customerAPI, workOrderAPI } from '@/api/modules'
 *
 * 或单独导入：
 * import { customerAPI } from '@/api/modules/customer'
 */

// Simple API Modules (纯 CRUD)
export { customerAPI } from './customer'
export { departmentAPI } from './department'
export { processAPI } from './process'
export { productAPI } from './product'
export { materialAPI } from './material'
export { productGroupAPI } from './product-group'
export { artworkAPI } from './artwork'
export { dieAPI } from './die'
export { foilingPlateAPI } from './foiling-plate'
export { embossingPlateAPI } from './embossing-plate'
export { productMaterialAPI } from './product-material'
export { supplierAPI } from './supplier'

// Authentication API (认证和授权)
export { authAPI } from './auth'

// Finance API (财务管理)
export { invoiceAPI } from './invoice'
export { productionCostAPI } from './production-cost'
export { paymentAPI } from './payment'
export { statementAPI } from './statement'

// Inventory API (库存管理)
export { productStockAPI } from './product-stock'
export { deliveryOrderAPI } from './delivery-order'
export { qualityInspectionAPI } from './quality-inspection'
export { stockInAPI } from './stock-in'
export { stockOutAPI } from './stock-out'

// Sales API (销售管理)
export { salesOrderAPI } from './sales-order'

// Complex API Modules (包含自定义操作)
export { workOrderAPI } from './workorder'
export { workOrderTaskAPI } from './workorder-task'
export { workOrderProcessAPI } from './workorder-process'
export { workOrderMaterialAPI } from './workorder-material'
export { workOrderProductAPI } from './workorder-product'
export { purchaseOrderAPI } from './purchase'

// Notification API (包含自定义操作)
export { notificationAPI } from './notification'

// System API (系统管理)
export { taskAssignmentRuleAPI } from './task-assignment-rule'
