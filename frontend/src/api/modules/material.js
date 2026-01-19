/**
 * 物料管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class MaterialAPI extends BaseAPI {
  constructor() {
    super('/materials/', request)
  }
}

export const materialAPI = new MaterialAPI()
export default materialAPI
