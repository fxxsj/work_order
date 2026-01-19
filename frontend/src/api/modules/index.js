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
export { product-groupAPI } from './product-group'
export { artworkAPI } from './artwork'
export { dieAPI } from './die'
export { foilingPlateAPI } from './foiling-plate'
export { embossingPlateAPI } from './embossing-plate'
export { productMaterialAPI } from './product-material'

// Complex API Modules (包含自定义操作)
export { workOrderAPI } from './workorder'
export { workOrderTaskAPI } from './workorder-task'
export { workOrderProcessAPI } from './workorder-process'
export { workOrderMaterialAPI } from './workorder-material'
export { workOrderProductAPI } from './workorder-product'

// Notification API (包含自定义操作)
export { notificationAPI } from './notification'
