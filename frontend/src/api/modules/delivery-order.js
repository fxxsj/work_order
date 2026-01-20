/**
 * Delivery Order API Module
 * 发货管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class DeliveryOrderAPI extends BaseAPI {
  constructor() {
    super('/delivery-orders/', request)
  }

  /**
   * 发货
   * @param {number} id - 发货单ID
   * @param {Object} data - 发货信息
   * @returns {Promise} 发货结果
   */
  ship(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/ship/`,
      method: 'post',
      data
    })
  }

  /**
   * 签收
   * @param {number} id - 发货单ID
   * @param {Object} data - 签收信息
   * @returns {Promise} 签收结果
   */
  receive(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/receive/`,
      method: 'post',
      data
    })
  }

  /**
   * 获取发货汇总
   * @returns {Promise} 发货汇总数据
   */
  getSummary() {
    return this.request({
      url: `${this.baseURL}summary/`,
      method: 'get'
    })
  }
}

export const deliveryOrderAPI = new DeliveryOrderAPI()
export default deliveryOrderAPI
