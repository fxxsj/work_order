import service from './index'

// ==================== 销售订单管理 ====================

/**
 * 获取销售订单列表
 */
export function getSalesOrderList(params) {
  return service({
    url: '/sales-orders/',
    method: 'get',
    params
  })
}

/**
 * 获取销售订单详情
 */
export function getSalesOrderDetail(id) {
  return service({
    url: `/sales-orders/${id}/`,
    method: 'get'
  })
}

/**
 * 创建销售订单
 */
export function createSalesOrder(data) {
  return service({
    url: '/sales-orders/',
    method: 'post',
    data
  })
}

/**
 * 更新销售订单
 */
export function updateSalesOrder(id, data) {
  return service({
    url: `/sales-orders/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除销售订单
 */
export function deleteSalesOrder(id) {
  return service({
    url: `/sales-orders/${id}/`,
    method: 'delete'
  })
}

/**
 * 提交销售订单
 */
export function submitSalesOrder(id) {
  return service({
    url: `/sales-orders/${id}/submit/`,
    method: 'post'
  })
}

/**
 * 审核通过销售订单
 */
export function approveSalesOrder(id, data) {
  return service({
    url: `/sales-orders/${id}/approve/`,
    method: 'post',
    data
  })
}

/**
 * 拒绝销售订单
 */
export function rejectSalesOrder(id, data) {
  return service({
    url: `/sales-orders/${id}/reject/`,
    method: 'post',
    data
  })
}

/**
 * 开始生产
 */
export function startProduction(id) {
  return service({
    url: `/sales-orders/${id}/start_production/`,
    method: 'post'
  })
}

/**
 * 完成订单
 */
export function completeSalesOrder(id) {
  return service({
    url: `/sales-orders/${id}/complete/`,
    method: 'post'
  })
}

/**
 * 取消订单
 */
export function cancelSalesOrder(id, data) {
  return service({
    url: `/sales-orders/${id}/cancel/`,
    method: 'post',
    data
  })
}

/**
 * 更新付款信息
 */
export function updatePayment(id, data) {
  return service({
    url: `/sales-orders/${id}/update_payment/`,
    method: 'post',
    data
  })
}

// ==================== 销售订单明细 ====================

/**
 * 获取销售订单明细列表
 */
export function getSalesOrderItemList(params) {
  return service({
    url: '/sales-order-items/',
    method: 'get',
    params
  })
}

/**
 * 创建销售订单明细
 */
export function createSalesOrderItem(data) {
  return service({
    url: '/sales-order-items/',
    method: 'post',
    data
  })
}

/**
 * 更新销售订单明细
 */
export function updateSalesOrderItem(id, data) {
  return service({
    url: `/sales-order-items/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除销售订单明细
 */
export function deleteSalesOrderItem(id) {
  return service({
    url: `/sales-order-items/${id}/`,
    method: 'delete'
  })
}
