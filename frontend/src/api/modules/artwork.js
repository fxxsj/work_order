/**
 * 图稿管理 API
 *
 * 提供图稿的完整 CRUD 操作，以及确认和版本管理功能。
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class ArtworkAPI extends BaseAPI {
  constructor() {
    super('/artworks/', request)
  }

  /**
   * 确认图稿
   * @param {number} id - 图稿 ID
   * @returns {Promise} API 响应
   */
  confirm(id) {
    return this.request({
      url: `${this.baseURL}${id}/confirm/`,
      method: 'post'
    })
  }

  /**
   * 基于现有图稿创建新版本
   * @param {number} id - 源图稿 ID
   * @returns {Promise} API 响应
   */
  createVersion(id) {
    return this.request({
      url: `${this.baseURL}${id}/create_version/`,
      method: 'post'
    })
  }
}

export const artworkAPI = new ArtworkAPI()
export default artworkAPI
