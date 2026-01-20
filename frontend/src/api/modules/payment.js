/**
 * Payment API Module
 * 收款管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class PaymentAPI extends BaseAPI {
  constructor() {
    super('/payments/', request)
  }

  /**
   * 获取收款汇总
   * @returns {Promise} 收款汇总数据
   */
  getSummary() {
    return this.request({
      url: `${this.baseURL}summary/`,
      method: 'get'
    })
  }
}

export const paymentAPI = new PaymentAPI()
export default paymentAPI
