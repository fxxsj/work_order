/**
 * 产品组管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class ProductGroupAPI extends BaseAPI {
  constructor() {
    super('/product-groups/', request)
  }
}

export const productGroupAPI = new ProductGroupAPI()
export default productGroupAPI
