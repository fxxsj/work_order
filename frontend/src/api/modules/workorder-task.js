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

  /**
   * 获取任务列表（带高级筛选）
   * @param {Object} params - 筛选参数
   * @param {number} params.page - 页码
   * @param {number} params.page_size - 每页数量
   * @param {string} params.search - 搜索关键词（任务内容、生产要求、施工单号）
   * @param {string} params.status - 任务状态（draft/pending/in_progress/completed/cancelled）
   * @param {string} params.task_type - 任务类型（plate_making/cutting/printing/foiling/embossing/die_cutting/packaging/general）
   * @param {number} params.assigned_department - 分派部门ID
   * @param {number} params.assigned_operator - 分派操作员ID
   * @param {number} params.work_order_process - 工序ID
   * @param {string} params.work_order_number - 施工单号（模糊搜索）
   * @param {string} params.work_content - 任务内容（模糊搜索）
   * @param {string} params.department_name - 部门名称（模糊搜索）
   * @param {string} params.operator_name - 操作员姓名（模糊搜索）
   * @param {string} params.is_draft - 是否草稿任务（true/false）
   * @param {string} params.ordering - 排序字段（created_at/-created_at/updated_at/-updated_at等）
   * @returns {Promise} API响应
   */
  getList(params) {
    return super.getList(params)
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

  // 获取操作员任务中心数据（我的任务 + 可认领任务）
  getOperatorCenterData(params) {
    return this.request({
      url: `${this.baseUrl}operator_center/`,
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

  // 导出任务列表（旧方法，保留兼容性）
  export(params) {
    return this.request({
      url: `${this.baseUrl}export/`,
      method: 'get',
      params,
      responseType: 'blob'
    })
  }

  /**
   * 导出任务列表到Excel（新方法，支持批量导出和筛选）
   * @param {Object} options
   * @param {Array<number>} options.task_ids - 指定导出的任务ID列表（可选）
   * @param {Object} options.filters - 筛选条件（可选）
   * @param {Array<string>} options.columns - 指定导出的列（可选）
   * @returns {Promise} Blob响应
   */
  exportExcel(options = {}) {
    return this.request({
      url: `${this.baseUrl}export/`,
      method: 'post',
      data: {
        task_ids: options.task_ids || [],
        filters: options.filters || {},
        columns: options.columns || [
          'id', 'work_order_number', 'process_name', 'task_type',
          'work_content', 'assigned_department', 'assigned_operator',
          'production_quantity', 'quantity_completed', 'progress',
          'priority', 'status', 'created_at', 'updated_at'
        ]
      },
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

  /**
   * 批量分派任务
   * @param {Object} data
   * @param {Array<number>} data.task_ids - 任务ID列表
   * @param {number} data.assigned_department - 分派部门ID
   * @param {number} data.assigned_operator - 分派操作员ID（可选）
   * @param {string} data.reason - 调整原因（可选）
   * @param {string} data.notes - 备注（可选）
   * @returns {Promise}
   */
  batchAssign(data) {
    return this.request({
      url: `${this.baseUrl}batch_assign/`,
      method: 'post',
      data: {
        task_ids: data.task_ids,
        assigned_department: data.assigned_department,
        assigned_operator: data.assigned_operator,
        reason: data.reason,
        notes: data.notes
      }
    })
  }

  /**
   * 批量完成任务
   * @param {Object} data
   * @param {Array<number>} data.task_ids - 任务ID列表
   * @param {string} data.completion_reason - 完成理由（可选）
   * @param {string} data.notes - 备注（可选）
   * @returns {Promise}
   */
  batchComplete(data) {
    return this.request({
      url: `${this.baseUrl}batch_complete/`,
      method: 'post',
      data: {
        task_ids: data.task_ids,
        completion_reason: data.completion_reason || '',
        notes: data.notes || ''
      }
    })
  }

  /**
   * 批量取消任务
   * @param {Object} data
   * @param {Array<number>} data.task_ids - 任务ID列表
   * @param {string} data.cancellation_reason - 取消原因（必填）
   * @param {string} data.notes - 备注（可选）
   * @returns {Promise}
   */
  batchCancel(data) {
    return this.request({
      url: `${this.baseUrl}batch_cancel/`,
      method: 'post',
      data: {
        task_ids: data.task_ids,
        cancellation_reason: data.cancellation_reason,
        notes: data.notes || ''
      }
    })
  }

  /**
   * 批量删除任务（仅草稿任务）
   * @param {Object} data
   * @param {Array<number>} data.task_ids - 任务ID列表
   * @param {string} data.reason - 删除原因（可选）
   * @returns {Promise}
   */
  batchDelete(data) {
    return this.request({
      url: `${this.baseUrl}batch-delete/`,
      method: 'post',
      data: {
        task_ids: data.task_ids,
        reason: data.reason || '批量删除'
      }
    })
  }
}

export const workOrderTaskAPI = new WorkOrderTaskAPI()
export default workOrderTaskAPI
