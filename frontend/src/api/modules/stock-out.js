/**
 * Stock Out API Module
 * 出库单管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class StockOutAPI extends BaseAPI {
  constructor() {
    super('/stock-outs/', request)
  }
}

export const stockOutAPI = new StockOutAPI()
export default stockOutAPI
