/**
 * 施工单工序管理 API
 * 复杂模块：包含 CRUD + 开始工序、完成工序、批量重新分派等自定义操作
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class WorkOrderProcessAPI extends BaseAPI {
  constructor() {
    super('/workorder-processes/', request)
  }

  // 开始工序（生成任务）
  start(id, data = {}) {
    return this.customAction(`${this.baseUrl}${id}/start/`, 'post', data)
  }

  // 完成工序
  complete(id, data) {
    return this.customAction(`${this.baseUrl}${id}/complete/`, 'post', data)
  }

  // 添加日志
  addLog(id, content) {
    return this.customAction(`${this.baseUrl}${id}/add_log/`, 'post', { content })
  }

  // 批量重新分派工序的所有任务
  reassignTasks(id, data) {
    return this.customAction(`${this.baseUrl}${id}/reassign_tasks/`, 'post', data)
  }

  // 使用 patch 而非 put 进行更新
  update(id, data) {
    return this.patch(id, data)
  }
}

export const workOrderProcessAPI = new WorkOrderProcessAPI()
export default workOrderProcessAPI
