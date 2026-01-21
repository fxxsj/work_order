/**
 * 压凸版管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class EmbossingPlateAPI extends BaseAPI {
  constructor() {
    super('/embossing-plates/', request)
  }

  /**
   * 确认压凸版
   * @param {number} id - 压凸版 ID
   * @returns {Promise} API 响应
   */
  confirm(id) {
    return this.request({
      url: `${this.baseURL}${id}/confirm/`,
      method: 'post'
    })
  }
}

export const embossingPlateAPI = new EmbossingPlateAPI()
export default embossingPlateAPI
