/**
 * 模具管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class DieAPI extends BaseAPI {
  constructor() {
    super('/dies/', request)
  }
}

export const dieAPI = new DieAPI()
export default dieAPI
