/**
 * 施工单物料管理 API
 * 复杂模块：包含 CRUD + 批量操作
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class WorkOrderMaterialAPI extends BaseAPI {
  constructor() {
    super('/workorder-materials/', request)
  }

  // 使用 patch 而非 put 进行更新
  update(id, data) {
    return this.patch(id, data)
  }

  // 批量出库
  batchCheckout(data) {
    return this.batchAction({
      action: 'checkout',
      ...data
    })
  }

  // 批量入库
  batchCheckin(data) {
    return this.batchAction({
      action: 'checkin',
      ...data
    })
  }
}

export const workOrderMaterialAPI = new WorkOrderMaterialAPI()
export default workOrderMaterialAPI
