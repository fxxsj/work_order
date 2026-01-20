/**
 * Statement API Module
 * 对账单管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class StatementAPI extends BaseAPI {
  constructor() {
    super('/statements/', request)
  }

  /**
   * 确认对账单
   * @param {number} id - 对账单ID
   * @param {Object} data - 确认信息
   * @returns {Promise} 确认结果
   */
  confirm(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/confirm/`,
      method: 'post',
      data
    })
  }

  /**
   * 生成对账单
   * @param {Object} params - 生成参数
   * @returns {Promise} 生成结果
   */
  generate(params) {
    return this.request({
      url: `${this.baseURL}generate/`,
      method: 'get',
      params
    })
  }
}

export const statementAPI = new StatementAPI()
export default statementAPI
