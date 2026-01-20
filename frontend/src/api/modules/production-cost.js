/**
 * Production Cost API Module
 * 生产成本管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class ProductionCostAPI extends BaseAPI {
  constructor() {
    super('/production-costs/', request)
  }

  /**
   * 计算材料成本
   * @param {number} id - 成本ID
   * @returns {Promise} 计算结果
   */
  calculateMaterial(id) {
    return this.request({
      url: `${this.baseURL}${id}/calculate_material/`,
      method: 'post'
    })
  }

  /**
   * 计算总成本
   * @param {number} id - 成本ID
   * @returns {Promise} 计算结果
   */
  calculateTotal(id) {
    return this.request({
      url: `${this.baseURL}${id}/calculate_total/`,
      method: 'post'
    })
  }

  /**
   * 获取成本统计
   * @param {Object} params - 查询参数
   * @returns {Promise} 统计数据
   */
  getStats(params) {
    return this.request({
      url: `${this.baseURL}stats/`,
      method: 'get',
      params
    })
  }
}

export const productionCostAPI = new ProductionCostAPI()
export default productionCostAPI
