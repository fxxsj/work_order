// Fixed: Force webpack to recompile - Purchase API
import service from './index'

/**
 * 获取物料列表（用于采购单创建）
 * Fixed: async function to properly handle Promise
 */
export async function getMaterialList(params) {
  const result = await service({
    url: '/materials/',
    method: 'get',
    params
  })
  return result
}

// ==================== 供应商管理 ====================

/**
 * 获取供应商列表
 */
export function getSupplierList(params) {
  return service({
    url: '/suppliers/',
    method: 'get',
    params
  })
}

/**
 * 获取供应商详情
 */
export function getSupplierDetail(id) {
  return service({
    url: `/suppliers/${id}/`,
    method: 'get'
  })
}

/**
 * 创建供应商
 */
export function createSupplier(data) {
  return service({
    url: '/suppliers/',
    method: 'post',
    data
  })
}

/**
 * 更新供应商
 */
export function updateSupplier(id, data) {
  return service({
    url: `/suppliers/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除供应商
 */
export function deleteSupplier(id) {
  return service({
    url: `/suppliers/${id}/`,
    method: 'delete'
  })
}

// ==================== 物料供应商关联 ====================

/**
 * 获取物料供应商关联列表
 */
export function getMaterialSupplierList(params) {
  return service({
    url: '/material-suppliers/',
    method: 'get',
    params
  })
}

/**
 * 创建物料供应商关联
 */
export function createMaterialSupplier(data) {
  return service({
    url: '/material-suppliers/',
    method: 'post',
    data
  })
}

/**
 * 更新物料供应商关联
 */
export function updateMaterialSupplier(id, data) {
  return service({
    url: `/material-suppliers/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除物料供应商关联
 */
export function deleteMaterialSupplier(id) {
  return service({
    url: `/material-suppliers/${id}/`,
    method: 'delete'
  })
}

// ==================== 采购单管理 ====================

/**
 * 获取采购单列表
 */
export function getPurchaseOrderList(params) {
  return service({
    url: '/purchase-orders/',
    method: 'get',
    params
  })
}

/**
 * 获取采购单详情
 */
export function getPurchaseOrderDetail(id) {
  return service({
    url: `/purchase-orders/${id}/`,
    method: 'get'
  })
}

/**
 * 创建采购单
 */
export function createPurchaseOrder(data) {
  return service({
    url: '/purchase-orders/',
    method: 'post',
    data
  })
}

/**
 * 更新采购单
 */
export function updatePurchaseOrder(id, data) {
  return service({
    url: `/purchase-orders/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除采购单
 */
export function deletePurchaseOrder(id) {
  return service({
    url: `/purchase-orders/${id}/`,
    method: 'delete'
  })
}

/**
 * 提交采购单
 */
export function submitPurchaseOrder(id) {
  return service({
    url: `/purchase-orders/${id}/submit/`,
    method: 'post'
  })
}

/**
 * 批准采购单
 */
export function approvePurchaseOrder(id) {
  return service({
    url: `/purchase-orders/${id}/approve/`,
    method: 'post'
  })
}

/**
 * 拒绝采购单
 */
export function rejectPurchaseOrder(id, data) {
  return service({
    url: `/purchase-orders/${id}/reject/`,
    method: 'post',
    data
  })
}

/**
 * 确认下单
 */
export function placePurchaseOrder(id, data) {
  return service({
    url: `/purchase-orders/${id}/place_order/`,
    method: 'post',
    data
  })
}

/**
 * 收货
 */
export function receivePurchaseOrder(id, data) {
  return service({
    url: `/purchase-orders/${id}/receive/`,
    method: 'post',
    data
  })
}

/**
 * 取消采购单
 */
export function cancelPurchaseOrder(id) {
  return service({
    url: `/purchase-orders/${id}/cancel/`,
    method: 'post'
  })
}

/**
 * 获取库存不足的物料列表
 */
export function getLowStockMaterials() {
  return service({
    url: '/purchase-orders/low_stock_materials/',
    method: 'get'
  })
}

// ==================== 采购单明细 ====================

/**
 * 获取采购单明细列表
 */
export function getPurchaseOrderItemList(params) {
  return service({
    url: '/purchase-order-items/',
    method: 'get',
    params
  })
}

/**
 * 创建采购单明细
 */
export function createPurchaseOrderItem(data) {
  return service({
    url: '/purchase-order-items/',
    method: 'post',
    data
  })
}

/**
 * 更新采购单明细
 */
export function updatePurchaseOrderItem(id, data) {
  return service({
    url: `/purchase-order-items/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除采购单明细
 */
export function deletePurchaseOrderItem(id) {
  return service({
    url: `/purchase-order-items/${id}/`,
    method: 'delete'
  })
}

/**
 * 单独收货某个明细
 */
export function receivePurchaseOrderItem(id, data) {
  return service({
    url: `/purchase-order-items/${id}/receive/`,
    method: 'post',
    data
  })
}
