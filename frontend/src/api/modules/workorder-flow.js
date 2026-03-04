/**
 * WorkOrder Flow API Module
 * 施工单流程（从销售订单创建/提交/审核等）
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class WorkOrderFlowAPI extends BaseAPI {
  constructor() {
    super('/workorders-flow/', request)
  }

  /**
   * 从销售订单创建施工单
   * @param {Object} data - { sales_order_id, production_quantity?, delivery_date?, priority?, notes? }
   * @returns {Promise} 创建结果
   */
  createFromSalesOrder(data) {
    return this.customAction(`${this.baseUrl}create_from_sales_order/`, 'post', data)
  }
}

export const workOrderFlowAPI = new WorkOrderFlowAPI()
export default workOrderFlowAPI
