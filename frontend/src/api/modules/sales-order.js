/**
 * Sales Order API Module
 * 销售订单管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class SalesOrderAPI extends BaseAPI {
  constructor() {
    super('/sales-orders/', request)
  }

  /**
   * 提交销售订单
   * @param {number} id - 订单ID
   * @returns {Promise} 提交结果
   */
  submit(id) {
    return this.request({
      url: `${this.baseURL}${id}/submit/`,
      method: 'post'
    })
  }

  /**
   * 审核通过销售订单
   * @param {number} id - 订单ID
   * @param {Object} data - 审核信息
   * @returns {Promise} 审核结果
   */
  approve(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/approve/`,
      method: 'post',
      data
    })
  }

  /**
   * 拒绝销售订单
   * @param {number} id - 订单ID
   * @param {Object} data - 拒绝原因
   * @returns {Promise} 拒绝结果
   */
  reject(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/reject/`,
      method: 'post',
      data
    })
  }

  /**
   * 开始生产
   * @param {number} id - 订单ID
   * @returns {Promise} 开始生产结果
   */
  startProduction(id) {
    return this.request({
      url: `${this.baseURL}${id}/start_production/`,
      method: 'post'
    })
  }

  /**
   * 完成订单
   * @param {number} id - 订单ID
   * @returns {Promise} 完成结果
   */
  complete(id) {
    return this.request({
      url: `${this.baseURL}${id}/complete/`,
      method: 'post'
    })
  }

  /**
   * 取消订单
   * @param {number} id - 订单ID
   * @param {Object} data - 取消原因
   * @returns {Promise} 取消结果
   */
  cancel(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/cancel/`,
      method: 'post',
      data
    })
  }

  /**
   * 更新付款信息
   * @param {number} id - 订单ID
   * @param {Object} data - 付款信息
   * @returns {Promise} 更新结果
   */
  updatePayment(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/update_payment/`,
      method: 'post',
      data
    })
  }
}

export const salesOrderAPI = new SalesOrderAPI()
export default salesOrderAPI
