/**
 * Stock In API Module
 * 入库单管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class StockInAPI extends BaseAPI {
  constructor() {
    super('/stock-ins/', request)
  }

  /**
   * 提交入库单
   * @param {number} id - 入库单ID
   * @returns {Promise} 提交结果
   */
  submit(id) {
    return this.request({
      url: `${this.baseURL}${id}/submit/`,
      method: 'post'
    })
  }

  /**
   * 审核入库单
   * @param {number} id - 入库单ID
   * @returns {Promise} 审核结果
   */
  approve(id) {
    return this.request({
      url: `${this.baseURL}${id}/approve/`,
      method: 'post'
    })
  }
}

export const stockInAPI = new StockInAPI()
export default stockInAPI
