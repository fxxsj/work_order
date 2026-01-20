/**
 * Invoice API Module
 * 发票管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class InvoiceAPI extends BaseAPI {
  constructor() {
    super('/invoices/', request)
  }

  /**
   * 提交发票
   * @param {number} id - 发票ID
   * @returns {Promise} 提交结果
   */
  submit(id) {
    return this.request({
      url: `${this.baseURL}${id}/submit/`,
      method: 'post'
    })
  }

  /**
   * 审核发票
   * @param {number} id - 发票ID
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
   * 获取发票汇总
   * @returns {Promise} 发票汇总数据
   */
  getSummary() {
    return this.request({
      url: `${this.baseURL}summary/`,
      method: 'get'
    })
  }
}

export const invoiceAPI = new InvoiceAPI()
export default invoiceAPI
