/**
 * 工序管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class ProcessAPI extends BaseAPI {
  constructor() {
    super('/processes/', request)
  }
}

export const processAPI = new ProcessAPI()
export default processAPI
