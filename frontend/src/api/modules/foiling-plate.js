/**
 * 烫金板管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class FoilingPlateAPI extends BaseAPI {
  constructor() {
    super('/foiling-plates/', request)
  }
}

export const foilingPlateAPI = new FoilingPlateAPI()
export default foilingPlateAPI
