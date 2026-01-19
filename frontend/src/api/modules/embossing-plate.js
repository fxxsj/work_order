/**
 * 烫银板管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class EmbossingPlateAPI extends BaseAPI {
  constructor() {
    super('/embossing-plates/', request)
  }
}

export const embossingPlateAPI = new EmbossingPlateAPI()
export default embossingPlateAPI
