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
      url: `${this.baseUrl}${id}/ship/`,
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
      url: `${this.baseUrl}${id}/receive/`,
      method: 'post',
      data
    })
  }

  /**
   * 拒收
   * @param {number} id - 发货单ID
   * @param {Object} data - 拒收信息（包含 reject_reason）
   * @returns {Promise} 拒收结果
   */
  reject(id, data) {
    return this.request({
      url: `${this.baseUrl}${id}/reject/`,
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
      url: `${this.baseUrl}summary/`,
      method: 'get'
    })
  }
}

export const deliveryOrderAPI = new DeliveryOrderAPI()
export default deliveryOrderAPI
