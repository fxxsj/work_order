/**
 * 刀模管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class DieAPI extends BaseAPI {
  constructor() {
    super('/dies/', request)
  }

  /**
   * 确认刀模
   * @param {number} id - 刀模ID
   * @returns {Promise} 确认后的刀模数据
   */
  confirm(id) {
    return this.request({
      url: `${this.baseURL}${id}/confirm/`,
      method: 'post'
    })
  }
}

export const dieAPI = new DieAPI()
export default dieAPI
