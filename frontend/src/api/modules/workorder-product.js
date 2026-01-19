/**
 * 施工单产品管理 API
 * 复杂模块：包含 CRUD 操作
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class WorkOrderProductAPI extends BaseAPI {
  constructor() {
    super('/workorder-products/', request)
  }
}

export const workOrderProductAPI = new WorkOrderProductAPI()
export default workOrderProductAPI
