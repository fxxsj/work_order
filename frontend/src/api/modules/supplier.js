/**
 * Supplier API Module
 * 供应商管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class SupplierAPI extends BaseAPI {
  constructor() {
    super('/suppliers/', request)
  }
}

export const supplierAPI = new SupplierAPI()
export default supplierAPI
