/**
 * 图稿管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class ArtworkAPI extends BaseAPI {
  constructor() {
    super('/artworks/', request)
  }
}

export const artworkAPI = new ArtworkAPI()
export default artworkAPI
