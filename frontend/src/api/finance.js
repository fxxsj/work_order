import service from './index'

// ==================== 成本核算 ====================

/**
 * 获取成本中心列表
 */
export function getCostCenters(params) {
  return service({
    url: '/cost-centers/',
    method: 'get',
    params
  })
}

/**
 * 获取成本项目列表
 */
export function getCostItems(params) {
  return service({
    url: '/cost-items/',
    method: 'get',
    params
  })
}

/**
 * 获取生产成本列表
 */
export function getProductionCosts(params) {
  return service({
    url: '/production-costs/',
    method: 'get',
    params
  })
}

/**
 * 获取生产成本详情
 */
export function getProductionCost(id) {
  return service({
    url: `/production-costs/${id}/`,
    method: 'get'
  })
}

/**
 * 更新生产成本
 */
export function updateProductionCost(id, data) {
  return service({
    url: `/production-costs/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 计算材料成本
 */
export function calculateMaterialCost(id) {
  return service({
    url: `/production-costs/${id}/calculate_material/`,
    method: 'post'
  })
}

/**
 * 计算总成本
 */
export function calculateTotalCost(id) {
  return service({
    url: `/production-costs/${id}/calculate_total/`,
    method: 'post'
  })
}

/**
 * 获取成本统计
 */
export function getCostStats(params) {
  return service({
    url: '/production-costs/stats/',
    method: 'get',
    params
  })
}

// ==================== 发票管理 ====================

/**
 * 获取发票列表
 */
export function getInvoices(params) {
  return service({
    url: '/invoices/',
    method: 'get',
    params
  })
}

/**
 * 获取发票详情
 */
export function getInvoiceDetail(id) {
  return service({
    url: `/invoices/${id}/`,
    method: 'get'
  })
}

/**
 * 创建发票
 */
export function createInvoice(data) {
  return service({
    url: '/invoices/',
    method: 'post',
    data
  })
}

/**
 * 更新发票
 */
export function updateInvoice(id, data) {
  return service({
    url: `/invoices/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除发票
 */
export function deleteInvoice(id) {
  return service({
    url: `/invoices/${id}/`,
    method: 'delete'
  })
}

/**
 * 提交发票
 */
export function submitInvoice(id) {
  return service({
    url: `/invoices/${id}/submit/`,
    method: 'post'
  })
}

/**
 * 审核发票
 */
export function approveInvoice(id, data) {
  return service({
    url: `/invoices/${id}/approve/`,
    method: 'post',
    data
  })
}

/**
 * 获取发票汇总
 */
export function getInvoiceSummary() {
  return service({
    url: '/invoices/summary/',
    method: 'get'
  })
}

// ==================== 收款管理 ====================

/**
 * 获取收款记录列表
 */
export function getPayments(params) {
  return service({
    url: '/payments/',
    method: 'get',
    params
  })
}

/**
 * 获取收款详情
 */
export function getPaymentDetail(id) {
  return service({
    url: `/payments/${id}/`,
    method: 'get'
  })
}

/**
 * 创建收款记录
 */
export function createPayment(data) {
  return service({
    url: '/payments/',
    method: 'post',
    data
  })
}

/**
 * 更新收款记录
 */
export function updatePayment(id, data) {
  return service({
    url: `/payments/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除收款记录
 */
export function deletePayment(id) {
  return service({
    url: `/payments/${id}/`,
    method: 'delete'
  })
}

/**
 * 获取收款汇总
 */
export function getPaymentSummary() {
  return service({
    url: '/payments/summary/',
    method: 'get'
  })
}

// ==================== 收款计划 ====================

/**
 * 获取收款计划列表
 */
export function getPaymentPlans(params) {
  return service({
    url: '/payment-plans/',
    method: 'get',
    params
  })
}

/**
 * 更新收款计划状态
 */
export function updatePaymentPlanStatus(id) {
  return service({
    url: `/payment-plans/${id}/update_status/`,
    method: 'post'
  })
}

// ==================== 对账管理 ====================

/**
 * 获取对账单列表
 */
export function getStatements(params) {
  return service({
    url: '/statements/',
    method: 'get',
    params
  })
}

/**
 * 获取对账单详情
 */
export function getStatementDetail(id) {
  return service({
    url: `/statements/${id}/`,
    method: 'get'
  })
}

/**
 * 创建对账单
 */
export function createStatement(data) {
  return service({
    url: '/statements/',
    method: 'post',
    data
  })
}

/**
 * 更新对账单
 */
export function updateStatement(id, data) {
  return service({
    url: `/statements/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除对账单
 */
export function deleteStatement(id) {
  return service({
    url: `/statements/${id}/`,
    method: 'delete'
  })
}

/**
 * 确认对账单
 */
export function confirmStatement(id, data) {
  return service({
    url: `/statements/${id}/confirm/`,
    method: 'post',
    data
  })
}

/**
 * 生成对账单
 */
export function generateStatement(params) {
  return service({
    url: '/statements/generate/',
    method: 'get',
    params
  })
}
