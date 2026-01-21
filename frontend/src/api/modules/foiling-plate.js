/**
 * 烫金版管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class FoilingPlateAPI extends BaseAPI {
  constructor() {
    super('/foiling-plates/', request)
  }

  /**
   * 确认烫金版
   * @param {number} id - 烫金版 ID
   * @returns {Promise} API 响应
   */
  confirm(id) {
    return this.request({
      url: `${this.baseURL}${id}/confirm/`,
      method: 'post'
    })
  }
}

export const foilingPlateAPI = new FoilingPlateAPI()
export default foilingPlateAPI
