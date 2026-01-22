/**
 * Product Stock API Module
 * 成品库存管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class ProductStockAPI extends BaseAPI {
  constructor() {
    super('/product-stocks/', request)
  }

  /**
   * 获取低库存预警
   * @param {Object} params - 查询参数
   * @returns {Promise} 低库存列表
   */
  getLowStock(params) {
    return this.request({
      url: `${this.baseUrl}low_stock/`,
      method: 'get',
      params
    })
  }

  /**
   * 获取已过期库存
   * @param {Object} params - 查询参数
   * @returns {Promise} 已过期库存列表
   */
  getExpired(params) {
    return this.request({
      url: `${this.baseUrl}expired/`,
      method: 'get',
      params
    })
  }

  /**
   * 获取即将过期库存
   * @param {Object} params - 查询参数
   * @returns {Promise} 即将过期库存列表
   */
  getExpiringSoon(params) {
    return this.request({
      url: `${this.baseUrl}expiring_soon/`,
      method: 'get',
      params
    })
  }

  /**
   * 获取库存汇总
   * @returns {Promise} 库存汇总数据
   */
  getSummary() {
    return this.request({
      url: `${this.baseUrl}summary/`,
      method: 'get'
    })
  }

  /**
   * 库存调整
   * @param {number} id - 库存ID
   * @param {Object} data - 调整数据 { adjust_type, quantity, reason }
   * @returns {Promise} 调整结果
   */
  adjust(id, data) {
    return this.request({
      url: `${this.baseUrl}${id}/adjust/`,
      method: 'post',
      data
    })
  }
}

export const productStockAPI = new ProductStockAPI()
export default productStockAPI
