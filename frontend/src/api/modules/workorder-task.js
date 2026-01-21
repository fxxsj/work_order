/**
 * 施工单任务管理 API
 * 复杂模块：包含 CRUD + 完成任务、分派、更新数量等自定义操作
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class WorkOrderTaskAPI extends BaseAPI {
  constructor() {
    super('/workorder-tasks/', request)
  }

  // 完成任务（支持设计图稿任务时选择图稿）
  complete(id, data) {
    return this.customAction(`${this.baseUrl}${id}/complete/`, 'post', data)
  }

  // 更新任务数量
  updateQuantity(id, data) {
    return this.customAction(`${this.baseUrl}${id}/update_quantity/`, 'post', data)
  }

  // 分派任务（调整分派）
  assign(id, data) {
    return this.customAction(`${this.baseUrl}${id}/assign/`, 'post', data)
  }

  // 分割任务
  split(id, data) {
    return this.customAction(`${this.baseUrl}${id}/split/`, 'post', data)
  }

  // 获取任务统计数据
  getStats(params) {
    return this.request({
      url: `${this.baseUrl}stats/`,
      method: 'get',
      params
    })
  }
}

export const workOrderTaskAPI = new WorkOrderTaskAPI()
export default workOrderTaskAPI
