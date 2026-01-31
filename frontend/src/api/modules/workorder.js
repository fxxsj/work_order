/**
 * 施工单管理 API
 * 复杂模块：包含 CRUD + 审批、状态更改、统计等自定义操作
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class WorkOrderAPI extends BaseAPI {
  constructor() {
    super('/workorders/', request)
  }

  // 添加工序到施工单
  addProcess(id, data) {
    return this.customAction(`${this.baseUrl}${id}/add_process/`, 'post', data)
  }

  // 添加物料到施工单
  addMaterial(id, data) {
    return this.customAction(`${this.baseUrl}${id}/add_material/`, 'post', data)
  }

  // 业务员审核施工单
  approve(id, data) {
    return this.customAction(`${this.baseUrl}${id}/approve/`, 'post', data)
  }

  // 重新提交审核（审核拒绝后使用）
  resubmitForApproval(id) {
    return this.customAction(`${this.baseUrl}${id}/resubmit_for_approval/`, 'post')
  }

  // 请求重新审核（审核通过后发现错误需要修改）
  requestReapproval(id, data) {
    return this.customAction(`${this.baseUrl}${id}/request_reapproval/`, 'post', data)
  }

  // 更新状态
  updateStatus(id, status) {
    return this.customAction(`${this.baseUrl}${id}/update_status/`, 'post', { status })
  }

  // 获取统计数据
  getStatistics(params) {
    return this.customAction(`${this.baseUrl}statistics/`, 'get', null, params)
  }

  // 导出施工单列表
  export(params) {
    return this.request({
      url: `${this.baseUrl}export/`,
      method: 'get',
      params,
      responseType: 'blob'
    })
  }

  // 检查是否需要同步任务
  checkSyncNeeded(id, processIds) {
    const params = processIds && processIds.length > 0
      ? { process_ids: processIds.join(',') }
      : {}
    return this.customAction(`${this.baseUrl}${id}/check_sync_needed/`, 'get', null, params)
  }

  // 预览任务同步变更
  syncTasksPreview(id, processIds) {
    return this.customAction(`${this.baseUrl}${id}/sync_tasks_preview/`, 'post', {
      process_ids: processIds
    })
  }

  // 执行任务同步
  syncTasksExecute(id, processIds) {
    return this.customAction(`${this.baseUrl}${id}/sync_tasks_execute/`, 'post', {
      process_ids: processIds,
      confirmed: true
    })
  }
}

export const workOrderAPI = new WorkOrderAPI()
export default workOrderAPI
