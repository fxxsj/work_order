/**
 * 施工单服务
 *
 * 处理施工单相关的所有业务逻辑
 */

import BaseService from './base/BaseService'
import workOrderApi from '@/api/workorder'
import formValidationService from './FormValidationService'

/**
 * 施工单状态枚举
 */
const WorkOrderStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

/**
 * 审核状态枚举
 */
const ApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

/**
 * 优先级枚举
 */
const Priority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
}

/**
 * 施工单服务类
 */
class WorkOrderService extends BaseService {
  constructor() {
    super(workOrderApi)
    this.validationService = formValidationService
  }

  /**
   * 获取施工单列表
   * @param {Object} params - 查询参数
   * @returns {Promise} 施工单列表
   */
  async getWorkOrders(params = {}) {
    const defaultParams = {
      page: 1,
      page_size: 20,
      ordering: '-created_at'
    }

    return this.execute(
      () => this.apiClient.list({ ...defaultParams, ...params }),
      { showLoading: true }
    )
  }

  /**
   * 获取施工单详情
   * @param {number} id - 施工单ID
   * @returns {Promise} 施工单详情
   */
  async getWorkOrderDetail(id) {
    return this.execute(
      () => this.apiClient.getDetail(id),
      { showLoading: true }
    )
  }

  /**
   * 创建施工单
   * @param {Object} formData - 表单数据
   * @returns {Promise} 创建结果
   */
  async createWorkOrder(formData) {
    // 验证表单
    const validation = this.validationService.validateWorkOrderForm(formData)
    if (!validation.valid) {
      return {
        success: false,
        error: '表单验证失败',
        errors: validation.errors
      }
    }

    // 准备提交数据
    const submitData = this._prepareSubmitData(formData)

    return this.execute(
      () => this.apiClient.create(submitData),
      {
        showLoading: true,
        successMessage: '施工单创建成功'
      }
    )
  }

  /**
   * 更新施工单
   * @param {number} id - 施工单ID
   * @param {Object} formData - 表单数据
   * @returns {Promise} 更新结果
   */
  async updateWorkOrder(id, formData) {
    // 验证表单
    const validation = this.validationService.validateWorkOrderForm(formData)
    if (!validation.valid) {
      return {
        success: false,
        error: '表单验证失败',
        errors: validation.errors
      }
    }

    // 准备提交数据
    const submitData = this._prepareSubmitData(formData)

    return this.execute(
      () => this.apiClient.update(id, submitData),
      {
        showLoading: true,
        successMessage: '施工单更新成功'
      }
    )
  }

  /**
   * 删除施工单
   * @param {number} id - 施工单ID
   * @returns {Promise} 删除结果
   */
  async deleteWorkOrder(id) {
    return this.execute(
      () => this.apiClient.delete(id),
      {
        showLoading: true,
        successMessage: '施工单删除成功'
      }
    )
  }

  /**
   * 提交审核
   * @param {number} id - 施工单ID
   * @returns {Promise} 提交结果
   */
  async submitForApproval(id) {
    return this.execute(
      () => this.apiClient.submitForApproval(id),
      {
        showLoading: true,
        successMessage: '已提交审核'
      }
    )
  }

  /**
   * 审核施工单
   * @param {number} id - 施工单ID
   * @param {string} action - 审核动作 (approve/reject)
   * @param {string} comment - 审核意见
   * @returns {Promise} 审核结果
   */
  async reviewWorkOrder(id, action, comment = '') {
    return this.execute(
      () => this.apiClient.review(id, { action, comment }),
      {
        showLoading: true,
        successMessage: action === 'approve' ? '已通过审核' : '已拒绝审核'
      }
    )
  }

  /**
   * 开始施工单
   * @param {number} id - 施工单ID
   * @returns {Promise} 开始结果
   */
  async startWorkOrder(id) {
    return this.execute(
      () => this.apiClient.start(id),
      {
        showLoading: true,
        successMessage: '施工单已开始'
      }
    )
  }

  /**
   * 完成施工单
   * @param {number} id - 施工单ID
   * @returns {Promise} 完成结果
   */
  async completeWorkOrder(id) {
    return this.execute(
      () => this.apiClient.complete(id),
      {
        showLoading: true,
        successMessage: '施工单已完成'
      }
    )
  }

  /**
   * 取消施工单
   * @param {number} id - 施工单ID
   * @param {string} reason - 取消原因
   * @returns {Promise} 取消结果
   */
  async cancelWorkOrder(id, reason = '') {
    return this.execute(
      () => this.apiClient.cancel(id, { reason }),
      {
        showLoading: true,
        successMessage: '施工单已取消'
      }
    )
  }

  /**
   * 计算施工单完成进度
   * @param {Object} workOrder - 施工单对象
   * @returns {number} 进度百分比 (0-100)
   */
  calculateProgress(workOrder) {
    if (!workOrder.progress_percentage) {
      // 如果没有预计算的进度，根据任务状态计算
      if (!workOrder.tasks || workOrder.tasks.length === 0) {
        return 0
      }

      const totalTasks = workOrder.tasks.length
      const completedTasks = workOrder.tasks.filter(
        task => task.status === WorkOrderStatus.COMPLETED
      ).length

      return Math.round((completedTasks / totalTasks) * 100)
    }

    return Math.min(Math.max(workOrder.progress_percentage, 0), 100)
  }

  /**
   * 获取施工单状态文本
   * @param {string} status - 状态代码
   * @returns {string} 状态文本
   */
  getStatusText(status) {
    const statusMap = {
      [WorkOrderStatus.PENDING]: '待开始',
      [WorkOrderStatus.IN_PROGRESS]: '进行中',
      [WorkOrderStatus.COMPLETED]: '已完成',
      [WorkOrderStatus.CANCELLED]: '已取消'
    }
    return statusMap[status] || '未知'
  }

  /**
   * 获取审核状态文本
   * @param {string} status - 审核状态代码
   * @returns {string} 审核状态文本
   */
  getApprovalStatusText(status) {
    const statusMap = {
      [ApprovalStatus.PENDING]: '待审核',
      [ApprovalStatus.APPROVED]: '已审核',
      [ApprovalStatus.REJECTED]: '已拒绝'
    }
    return statusMap[status] || '未知'
  }

  /**
   * 获取优先级文本
   * @param {string} priority - 优先级代码
   * @returns {string} 优先级文本
   */
  getPriorityText(priority) {
    const priorityMap = {
      [Priority.LOW]: '低',
      [Priority.NORMAL]: '普通',
      [Priority.HIGH]: '高',
      [Priority.URGENT]: '紧急'
    }
    return priorityMap[priority] || '普通'
  }

  /**
   * 获取优先级对应的颜色类型
   * @param {string} priority - 优先级代码
   * @returns {string} Element UI 标签类型
   */
  getPriorityType(priority) {
    const typeMap = {
      [Priority.LOW]: 'info',
      [Priority.NORMAL]: '',
      [Priority.HIGH]: 'warning',
      [Priority.URGENT]: 'danger'
    }
    return typeMap[priority] || ''
  }

  /**
   * 检查施工单是否可以编辑
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可编辑
   */
  canEdit(workOrder) {
    // 已取消的施工单不能编辑
    if (workOrder.status === WorkOrderStatus.CANCELLED) {
      return false
    }

    // 已完成的施工单不能编辑
    if (workOrder.status === WorkOrderStatus.COMPLETED) {
      return false
    }

    // 已审核通过的施工单需要特殊权限
    if (workOrder.approval_status === ApprovalStatus.APPROVED) {
      // 这里应该结合权限服务检查
      return false
    }

    return true
  }

  /**
   * 检查施工单是否可以删除
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可删除
   */
  canDelete(workOrder) {
    // 只有待开始且未提交审核的可以删除
    return (
      workOrder.status === WorkOrderStatus.PENDING &&
      workOrder.approval_status === ApprovalStatus.PENDING
    )
  }

  /**
   * 检查施工单是否可以提交审核
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可提交审核
   */
  canSubmitForApproval(workOrder) {
    // 只有待开始且未审核的可以提交
    return (
      workOrder.status === WorkOrderStatus.PENDING &&
      workOrder.approval_status === ApprovalStatus.PENDING
    )
  }

  /**
   * 检查施工单是否可以开始
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可以开始
   */
  canStart(workOrder) {
    // 已审核通过且待开始的可以开始
    return (
      workOrder.approval_status === ApprovalStatus.APPROVED &&
      workOrder.status === WorkOrderStatus.PENDING
    )
  }

  /**
   * 检查施工单是否已完成
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否已完成
   */
  isCompleted(workOrder) {
    return workOrder.status === WorkOrderStatus.COMPLETED
  }

  /**
   * 检查施工单是否逾期
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否逾期
   */
  isOverdue(workOrder) {
    if (!workOrder.delivery_date) {
      return false
    }

    // 已完成的不算逾期
    if (workOrder.status === WorkOrderStatus.COMPLETED) {
      return false
    }

    const deliveryDate = new Date(workOrder.delivery_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return deliveryDate < today
  }

  /**
   * 获取剩余天数
   * @param {Object} workOrder - 施工单对象
   * @returns {number} 剩余天数（负数表示逾期）
   */
  getRemainingDays(workOrder) {
    if (!workOrder.delivery_date) {
      return null
    }

    const deliveryDate = new Date(workOrder.delivery_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diffTime = deliveryDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  /**
   * 检查施工单是否可以添加产品
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可以添加产品
   */
  canAddProduct(workOrder) {
    // 只有待开始和未审核的可以添加产品
    return (
      workOrder.status === WorkOrderStatus.PENDING &&
      workOrder.approval_status === ApprovalStatus.PENDING
    )
  }

  /**
   * 检查施工单是否可以添加工序
   * @param {Object} workOrder - 施工单对象
   * @returns {boolean} 是否可以添加工序
   */
  canAddProcess(workOrder) {
    // 只有待开始和未审核的可以添加工序
    return (
      workOrder.status === WorkOrderStatus.PENDING &&
      workOrder.approval_status === ApprovalStatus.PENDING
    )
  }

  /**
   * 准备提交数据
   * @param {Object} formData - 表单数据
   * @returns {Object} 提交数据
   * @private
   */
  _prepareSubmitData(formData) {
    const data = {
      customer: formData.customer,
      production_quantity: formData.production_quantity,
      delivery_date: formData.delivery_date,
      notes: formData.notes || '',
      priority: formData.priority || Priority.NORMAL
    }

    // 处理产品数据
    if (formData.products && formData.products.length > 0) {
      data.products_data = formData.products.map(product => ({
        product: product.product_id,
        quantity: product.quantity,
        unit: product.unit || '件'
      }))
    }

    // 处理工序数据
    if (formData.processes && formData.processes.length > 0) {
      data.processes = formData.processes.map(process => process.id || process)
    }

    return data
  }

  /**
   * 格式化施工单数据用于显示
   * @param {Object} workOrder - 施工单对象
   * @returns {Object} 格式化后的数据
   */
  formatWorkOrderForDisplay(workOrder) {
    return {
      ...workOrder,
      status_text: this.getStatusText(workOrder.status),
      approval_status_text: this.getApprovalStatusText(workOrder.approval_status),
      priority_text: this.getPriorityText(workOrder.priority),
      priority_type: this.getPriorityType(workOrder.priority),
      progress_percentage: this.calculateProgress(workOrder),
      is_overdue: this.isOverdue(workOrder),
      remaining_days: this.getRemainingDays(workOrder),
      can_edit: this.canEdit(workOrder),
      can_delete: this.canDelete(workOrder),
      can_submit: this.canSubmitForApproval(workOrder),
      can_start: this.canStart(workOrder),
      is_completed: this.isCompleted(workOrder)
    }
  }

  /**
   * 批量格式化施工单数据
   * @param {Array} workOrders - 施工单数组
   * @returns {Array} 格式化后的数组
   */
  formatWorkOrderList(workOrders) {
    return workOrders.map(wo => this.formatWorkOrderForDisplay(wo))
  }

  /**
   * 获取施工单统计信息
   * @param {Array} workOrders - 施工单数组
   * @returns {Object} 统计信息
   */
  getStatistics(workOrders) {
    const stats = {
      total: workOrders.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
      pending_approval: 0,
      approved: 0,
      rejected: 0
    }

    workOrders.forEach(wo => {
      // 状态统计
      if (wo.status === WorkOrderStatus.PENDING) stats.pending++
      else if (wo.status === WorkOrderStatus.IN_PROGRESS) stats.in_progress++
      else if (wo.status === WorkOrderStatus.COMPLETED) stats.completed++
      else if (wo.status === WorkOrderStatus.CANCELLED) stats.cancelled++

      // 审核状态统计
      if (wo.approval_status === ApprovalStatus.PENDING) stats.pending_approval++
      else if (wo.approval_status === ApprovalStatus.APPROVED) stats.approved++
      else if (wo.approval_status === ApprovalStatus.REJECTED) stats.rejected++

      // 逾期统计
      if (this.isOverdue(wo)) stats.overdue++
    })

    return stats
  }

  /**
   * 获取施工单工序列表
   * @param {number} workOrderId - 施工单ID
   * @returns {Promise} 工序列表
   */
  async getWorkOrderProcesses(workOrderId) {
    return this.execute(
      () => this.apiClient.getProcesses(workOrderId),
      { showLoading: true }
    )
  }

  /**
   * 获取施工单任务列表
   * @param {number} workOrderId - 施工单ID
   * @returns {Promise} 任务列表
   */
  async getWorkOrderTasks(workOrderId) {
    return this.execute(
      () => this.apiClient.getTasks(workOrderId),
      { showLoading: true }
    )
  }

  /**
   * 获取施工单日志
   * @param {number} workOrderId - 施工单ID
   * @returns {Promise} 日志列表
   */
  async getWorkOrderLogs(workOrderId) {
    return this.execute(
      () => this.apiClient.getLogs(workOrderId),
      { showLoading: false }
    )
  }
}

// 导出枚举
WorkOrderService.WorkOrderStatus = WorkOrderStatus
WorkOrderService.ApprovalStatus = ApprovalStatus
WorkOrderService.Priority = Priority

// 创建单例实例
const workOrderService = new WorkOrderService()

export default workOrderService
