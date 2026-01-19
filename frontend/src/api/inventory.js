import service from './index'

// ==================== 成品库存 ====================

/**
 * 获取成品库存列表
 */
export function getProductStocks(params) {
  return service({
    url: '/product-stocks/',
    method: 'get',
    params
  })
}

/**
 * 获取库存详情
 */
export function getProductStockDetail(id) {
  return service({
    url: `/product-stocks/${id}/`,
    method: 'get'
  })
}

/**
 * 更新库存
 */
export function updateProductStock(id, data) {
  return service({
    url: `/product-stocks/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 获取低库存预警
 */
export function getLowStock(params) {
  return service({
    url: '/product-stocks/low_stock/',
    method: 'get',
    params
  })
}

/**
 * 获取已过期库存
 */
export function getExpiredStock(params) {
  return service({
    url: '/product-stocks/expired/',
    method: 'get',
    params
  })
}

/**
 * 获取即将过期库存
 */
export function getExpiringSoonStock(params) {
  return service({
    url: '/product-stocks/expiring_soon/',
    method: 'get',
    params
  })
}

/**
 * 获取库存汇总
 */
export function getStockSummary() {
  return service({
    url: '/product-stocks/summary/',
    method: 'get'
  })
}

// ==================== 入库管理 ====================

/**
 * 获取入库单列表
 */
export function getStockIns(params) {
  return service({
    url: '/stock-ins/',
    method: 'get',
    params
  })
}

/**
 * 获取入库单详情
 */
export function getStockInDetail(id) {
  return service({
    url: `/stock-ins/${id}/`,
    method: 'get'
  })
}

/**
 * 创建入库单
 */
export function createStockIn(data) {
  return service({
    url: '/stock-ins/',
    method: 'post',
    data
  })
}

/**
 * 提交入库单
 */
export function submitStockIn(id) {
  return service({
    url: `/stock-ins/${id}/submit/`,
    method: 'post'
  })
}

/**
 * 审核入库单
 */
export function approveStockIn(id) {
  return service({
    url: `/stock-ins/${id}/approve/`,
    method: 'post'
  })
}

// ==================== 出库管理 ====================

/**
 * 获取出库单列表
 */
export function getStockOuts(params) {
  return service({
    url: '/stock-outs/',
    method: 'get',
    params
  })
}

/**
 * 获取出库单详情
 */
export function getStockOutDetail(id) {
  return service({
    url: `/stock-outs/${id}/`,
    method: 'get'
  })
}

// ==================== 发货管理 ====================

/**
 * 获取发货单列表
 */
export function getDeliveryOrders(params) {
  return service({
    url: '/delivery-orders/',
    method: 'get',
    params
  })
}

/**
 * 获取发货单详情
 */
export function getDeliveryOrderDetail(id) {
  return service({
    url: `/delivery-orders/${id}/`,
    method: 'get'
  })
}

/**
 * 创建发货单
 */
export function createDeliveryOrder(data) {
  return service({
    url: '/delivery-orders/',
    method: 'post',
    data
  })
}

/**
 * 更新发货单
 */
export function updateDeliveryOrder(id, data) {
  return service({
    url: `/delivery-orders/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除发货单
 */
export function deleteDeliveryOrder(id) {
  return service({
    url: `/delivery-orders/${id}/`,
    method: 'delete'
  })
}

/**
 * 发货
 */
export function shipDeliveryOrder(id, data) {
  return service({
    url: `/delivery-orders/${id}/ship/`,
    method: 'post',
    data
  })
}

/**
 * 签收
 */
export function receiveDeliveryOrder(id, data) {
  return service({
    url: `/delivery-orders/${id}/receive/`,
    method: 'post',
    data
  })
}

/**
 * 获取发货汇总
 */
export function getDeliverySummary() {
  return service({
    url: '/delivery-orders/summary/',
    method: 'get'
  })
}

/**
 * 获取发货明细列表
 */
export function getDeliveryItems(params) {
  return service({
    url: '/delivery-items/',
    method: 'get',
    params
  })
}

// ==================== 质量检验 ====================

/**
 * 获取质检单列表
 */
export function getQualityInspections(params) {
  return service({
    url: '/quality-inspections/',
    method: 'get',
    params
  })
}

/**
 * 获取质检单详情
 */
export function getQualityInspectionDetail(id) {
  return service({
    url: `/quality-inspections/${id}/`,
    method: 'get'
  })
}

/**
 * 创建质检单
 */
export function createQualityInspection(data) {
  return service({
    url: '/quality-inspections/',
    method: 'post',
    data
  })
}

/**
 * 更新质检单
 */
export function updateQualityInspection(id, data) {
  return service({
    url: `/quality-inspections/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 完成检验
 */
export function completeQualityInspection(id, data) {
  return service({
    url: `/quality-inspections/${id}/complete/`,
    method: 'post',
    data
  })
}

/**
 * 获取质检汇总
 */
export function getQualityInspectionSummary() {
  return service({
    url: '/quality-inspections/summary/',
    method: 'get'
  })
}
