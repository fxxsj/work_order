/**
 * 产品管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class ProductAPI extends BaseAPI {
  constructor() {
    super('/products/', request)
  }
}

export const productAPI = new ProductAPI()
export default productAPI
