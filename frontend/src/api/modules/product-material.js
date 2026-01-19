/**
 * 产品物料管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class ProductMaterialAPI extends BaseAPI {
  constructor() {
    super('/product-materials/', request)
  }
}

export const productMaterialAPI = new ProductMaterialAPI()
export default productMaterialAPI
