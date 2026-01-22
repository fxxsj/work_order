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
      url: `${this.baseUrl}${id}/submit/`,
      method: 'post'
    })
  }

  /**
   * 批准采购单
   */
  approve(id) {
    return this.request({
      url: `${this.baseUrl}${id}/approve/`,
      method: 'post'
    })
  }

  /**
   * 拒绝采购单
   */
  reject(id, data) {
    return this.request({
      url: `${this.baseUrl}${id}/reject/`,
      method: 'post',
      data
    })
  }

  /**
   * 确认下单
   */
  placeOrder(id, data) {
    return this.request({
      url: `${this.baseUrl}${id}/place_order/`,
      method: 'post',
      data
    })
  }

  /**
   * 分批收货（改进版）
   * @param {number} id - 采购单ID
   * @param {object} data - 收货数据
   * @param {array} data.items - 收货明细列表 [{item_id, received_quantity, delivery_note_number, notes}]
   * @param {string} data.received_date - 收货日期（可选）
   */
  receive(id, data) {
    return this.request({
      url: `${this.baseUrl}${id}/receive/`,
      method: 'post',
      data
    })
  }

  /**
   * 获取采购单的所有收货记录
   */
  getReceiveRecords(id) {
    return this.request({
      url: `${this.baseUrl}${id}/receive_records/`,
      method: 'get'
    })
  }

  /**
   * 获取待质检的收货记录
   */
  getPendingInspections(id) {
    return this.request({
      url: `${this.baseUrl}${id}/pending_inspections/`,
      method: 'get'
    })
  }

  /**
   * 取消采购单
   */
  cancel(id) {
    return this.request({
      url: `${this.baseUrl}${id}/cancel/`,
      method: 'post'
    })
  }

  /**
   * 获取库存不足的物料列表
   */
  getLowStockMaterials() {
    return this.request({
      url: `${this.baseUrl}low_stock_materials/`,
      method: 'get'
    })
  }
}

/**
 * 采购收货记录 API
 */
class PurchaseReceiveRecordAPI extends BaseAPI {
  constructor() {
    super('/purchase-receive-records/', request)
  }

  /**
   * 确认质检结果
   * @param {number} id - 收货记录ID
   * @param {object} data - 质检数据
   * @param {number} data.qualified_quantity - 合格数量
   * @param {number} data.unqualified_quantity - 不合格数量
   * @param {string} data.unqualified_reason - 不合格原因
   */
  confirmInspection(id, data) {
    return this.request({
      url: `${this.baseUrl}${id}/confirm_inspection/`,
      method: 'post',
      data
    })
  }

  /**
   * 合格物料入库
   */
  stockIn(id) {
    return this.request({
      url: `${this.baseUrl}${id}/stock_in/`,
      method: 'post'
    })
  }

  /**
   * 处理退货
   * @param {number} id - 收货记录ID
   * @param {object} data - 退货数据
   * @param {number} data.return_quantity - 退货数量
   * @param {string} data.return_note - 退货备注
   */
  processReturn(id, data) {
    return this.request({
      url: `${this.baseUrl}${id}/process_return/`,
      method: 'post',
      data
    })
  }

  /**
   * 获取所有待质检的收货记录
   */
  getPendingList(params) {
    return this.request({
      url: `${this.baseUrl}pending_list/`,
      method: 'get',
      params
    })
  }

  /**
   * 获取待入库的收货记录
   */
  getPendingStockIn(params) {
    return this.request({
      url: `${this.baseUrl}pending_stock_in/`,
      method: 'get',
      params
    })
  }

  /**
   * 获取待退货的收货记录
   */
  getPendingReturn(params) {
    return this.request({
      url: `${this.baseUrl}pending_return/`,
      method: 'get',
      params
    })
  }
}

export const purchaseOrderAPI = new PurchaseOrderAPI()
export const purchaseReceiveRecordAPI = new PurchaseReceiveRecordAPI()
export default purchaseOrderAPI
