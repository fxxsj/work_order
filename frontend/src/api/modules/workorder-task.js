/**
 * 施工单任务管理 API
 * 复杂模块：包含 CRUD + 完成任务、分派、更新数量等自定义操作
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'
import ErrorHandler from '@/utils/errorHandler'

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

  // 分配任务给指定操作员（主管分配）
  assignToOperator(id, data) {
    return this.customAction(`${this.baseUrl}${id}/assign/`, 'post', {
      operator_id: data.operator_id,
      notes: data.notes || ''
    })
  }

  // 获取部门操作员列表
  getDepartmentOperators(departmentId) {
    return this.request({
      url: `${this.baseUrl}department-operators/`,
      method: 'get',
      params: { department_id: departmentId }
    })
  }

  // 操作员认领任务
  claimTask(id, data) {
    return this.customAction(`${this.baseUrl}${id}/claim/`, 'post', {
      notes: data.notes || ''
    })
  }

  // 获取当前用户可认领的任务列表
  getClaimableTasks(params) {
    return this.request({
      url: `${this.baseUrl}claimable/`,
      method: 'get',
      params
    })
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

  // 获取协作统计数据
  getCollaborationStats(params) {
    return this.request({
      url: `${this.baseUrl}collaboration_stats/`,
      method: 'get',
      params
    })
  }

  // 获取分派历史记录
  getAssignmentHistory(params) {
    return this.request({
      url: `${this.baseUrl}assignment_history/`,
      method: 'get',
      params
    })
  }

  // 导出任务列表
  export(params) {
    return this.request({
      url: `${this.baseUrl}export/`,
      method: 'get',
      params,
      responseType: 'blob'
    })
  }

  // 批量更新草稿任务
  bulkUpdate(data) {
    return this.request({
      url: `${this.baseUrl}bulk_update/`,
      method: 'post',
      data: {
        task_ids: data.task_ids,
        production_quantity: data.production_quantity,
        priority: data.priority,
        production_requirements: data.production_requirements
      }
    })
  }

  // 批量删除草稿任务
  bulkDelete(taskIds) {
    return this.request({
      url: `${this.baseUrl}bulk_delete/`,
      method: 'post',
      data: { task_ids: taskIds }
    })
  }

  // 带错误处理的任务认领
  async claimTaskWithErrorHandling(id, data) {
    try {
      const response = await this.claimTask(id, data)
      ErrorHandler.showSuccess('任务认领成功')
      return response
    } catch (error) {
      const handled = ErrorHandler.handleTaskError(error, {
        onConflict: (conflictData) => {
          // 自定义冲突处理
          ErrorHandler.showConflictMessage(conflictData)
        }
      })
      throw handled // 重新抛出以便调用者处理
    }
  }

  // 带错误处理的任务分配
  async assignToOperatorWithErrorHandling(id, data) {
    try {
      const response = await this.assignToOperator(id, data)
      ErrorHandler.showSuccess('任务分配成功')
      return response
    } catch (error) {
      const handled = ErrorHandler.handleTaskError(error, {
        onConflict: (conflictData) => {
          ErrorHandler.showConflictMessage(conflictData)
        }
      })
      throw handled
    }
  }
}

export const workOrderTaskAPI = new WorkOrderTaskAPI()
export default workOrderTaskAPI
