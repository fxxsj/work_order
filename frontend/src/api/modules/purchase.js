/**
 * Purchase Order API Module
 * 采购单管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class PurchaseOrderAPI extends BaseAPI {
  constructor() {
    super('/purchase-orders/', request)
  }

  /**
   * 提交采购单
   */
  submit(id) {
    return this.request({
      url: `${this.baseURL}${id}/submit/`,
      method: 'post'
    })
  }

  /**
   * 批准采购单
   */
  approve(id) {
    return this.request({
      url: `${this.baseURL}${id}/approve/`,
      method: 'post'
    })
  }

  /**
   * 拒绝采购单
   */
  reject(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/reject/`,
      method: 'post',
      data
    })
  }

  /**
   * 确认下单
   */
  placeOrder(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/place_order/`,
      method: 'post',
      data
    })
  }

  /**
   * 收货
   */
  receive(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/receive/`,
      method: 'post',
      data
    })
  }

  /**
   * 取消采购单
   */
  cancel(id) {
    return this.request({
      url: `${this.baseURL}${id}/cancel/`,
      method: 'post'
    })
  }

  /**
   * 获取库存不足的物料列表
   */
  getLowStockMaterials() {
    return this.request({
      url: `${this.baseURL}low_stock_materials/`,
      method: 'get'
    })
  }
}

export const purchaseOrderAPI = new PurchaseOrderAPI()
export default purchaseOrderAPI
