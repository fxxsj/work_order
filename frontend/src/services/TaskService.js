/**
 * 任务业务逻辑服务
 *
 * 处理任务相关的业务逻辑，将业务逻辑从 Vue 组件中分离
 */

import BaseService from './base/BaseService'
import api from '@/api'

/**
 * 任务业务状态枚举
 */
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

/**
 * 任务类型枚举
 */
export const TaskType = {
  GENERAL: 'general',
  PLATE_MAKING: 'plate_making',
  CUTTING: 'cutting',
  PRINTING: 'printing',
  POST_PROCESSING: 'post_processing'
}

/**
 * 任务服务类
 */
class TaskService extends BaseService {
  constructor() {
    super(api)
  }

  /**
   * 获取任务列表
   * @param {Object} params - 查询参数
   * @returns {Promise} 任务列表
   */
  async getTasks(params = {}) {
    return this.execute(
      () => this.apiClient.list(params),
      { showLoading: true }
    )
  }

  /**
   * 获取任务详情
   * @param {number} taskId - 任务 ID
   * @returns {Promise} 任务详情
   */
  async getTaskDetail(taskId) {
    return this.execute(
      () => this.apiClient.getDetail(taskId),
      { showLoading: true }
    )
  }

  /**
   * 更新任务数量
   * @param {number} taskId - 任务 ID
   * @param {number} increment - 增量值
   * @param {number} version - 版本号（乐观锁）
   * @returns {Promise} 更新结果
   */
  async updateTaskQuantity(taskId, increment, version) {
    return this.execute(
      () => this.apiClient.updateQuantity(taskId, {
        quantity_increment: increment,
        version
      }),
      {
        showLoading: true,
        errorMessage: (error) => {
          if (error.response?.status === 409) {
            return '任务已被其他操作员更新，请刷新后重试'
          }
          return null // 使用默认错误处理
        }
      }
    )
  }

  /**
   * 完成任务
   * @param {number} taskId - 任务 ID
   * @param {Object} options - 完成选项
   * @returns {Promise} 完成结果
   */
  async completeTask(taskId, options = {}) {
    const {
      completionReason = '',
      notes = '',
      artworkIds = [],
      dieIds = [],
      quantityDefective = 0,
      version = null
    } = options

    return this.execute(
      () => this.apiClient.complete(taskId, {
        completion_reason: completionReason,
        notes,
        artwork_ids: artworkIds,
        die_ids: dieIds,
        quantity_defective: quantityDefective,
        version
      }),
      { showLoading: true }
    )
  }

  /**
   * 分派任务
   * @param {number} taskId - 任务 ID
   * @param {number} departmentId - 部门 ID
   * @param {number} operatorId - 操作员 ID
   * @returns {Promise} 分派结果
   */
  async assignTask(taskId, departmentId, operatorId = null) {
    return this.execute(
      () => this.apiClient.assign(taskId, {
        assigned_department: departmentId,
        assigned_operator: operatorId
      }),
      { showLoading: true }
    )
  }

  /**
   * 拆分任务
   * @param {number} taskId - 任务 ID
   * @param {Array} splits - 拆分方案
   * @returns {Promise} 拆分结果
   */
  async splitTask(taskId, splits) {
    return this.execute(
      () => this.apiClient.split(taskId, { splits }),
      { showLoading: true }
    )
  }

  /**
   * 计算任务完成进度
   * @param {Object} task - 任务对象
   * @returns {number} 完成进度百分比
   */
  calculateProgress(task) {
    if (!task.production_quantity || task.production_quantity === 0) {
      return 0
    }

    const progress = (task.quantity_completed / task.production_quantity) * 100
    return Math.min(Math.round(progress), 100)
  }

  /**
   * 判断任务是否可以完成
   * @param {Object} task - 任务对象
   * @returns {boolean} 是否可以完成
   */
  canComplete(task) {
    // 检查任务状态
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      return false
    }

    // 制版任务需要确认图稿和刀模
    if (task.task_type === TaskType.PLATE_MAKING) {
      if (task.artwork && !task.artwork.confirmed) {
        return false
      }
      if (task.die && !task.die.confirmed) {
        return false
      }
      if (task.foiling_plate && !task.foiling_plate.confirmed) {
        return false
      }
      if (task.embossing_plate && !task.embossing_plate.confirmed) {
        return false
      }
    }

    return true
  }

  /**
   * 获取任务不可完成的原因
   * @param {Object} task - 任务对象
   * @returns {string|null} 不可完成的原因
   */
  getCannotCompleteReason(task) {
    if (task.status === TaskStatus.COMPLETED) {
      return '任务已完成'
    }

    if (task.status === TaskStatus.CANCELLED) {
      return '任务已取消'
    }

    if (task.task_type === TaskType.PLATE_MAKING) {
      if (task.artwork && !task.artwork.confirmed) {
        return '需要确认图稿'
      }
      if (task.die && !task.die.confirmed) {
        return '需要确认刀模'
      }
      if (task.foiling_plate && !task.foiling_plate.confirmed) {
        return '烫金版未确认'
      }
      if (task.embossing_plate && !task.embossing_plate.confirmed) {
        return '压凸版未确认'
      }
    }

    return ''
  }

  /**
   * 计算任务是否逾期
   * @param {Object} task - 任务对象
   * @returns {boolean} 是否逾期
   */
  isOverdue(task) {
    if (!task.deadline || task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      return false
    }

    return new Date(task.deadline) < new Date()
  }

  /**
   * 计算任务剩余天数
   * @param {Object} task - 任务对象
   * @returns {number|null} 剩余天数，null 表示无截止日期
   */
  getRemainingDays(task) {
    if (!task.deadline || task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      return null
    }

    const deadline = new Date(task.deadline)
    const now = new Date()
    const diffTime = deadline - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  /**
   * 获取任务状态文本
   * @param {string} status - 状态码
   * @returns {string} 状态文本
   */
  getStatusText(status) {
    const statusMap = {
      [TaskStatus.PENDING]: '待开始',
      [TaskStatus.IN_PROGRESS]: '进行中',
      [TaskStatus.COMPLETED]: '已完成',
      [TaskStatus.CANCELLED]: '已取消'
    }

    return statusMap[status] || status
  }

  /**
   * 获取任务类型文本
   * @param {string} type - 类型码
   * @returns {string} 类型文本
   */
  getTypeText(type) {
    const typeMap = {
      [TaskType.GENERAL]: '通用任务',
      [TaskType.PLATE_MAKING]: '制版任务',
      [TaskType.CUTTING]: '开料任务',
      [TaskType.PRINTING]: '印刷任务',
      [TaskType.POST_PROCESSING]: '后道任务'
    }

    return typeMap[type] || type
  }

  /**
   * 获取任务状态颜色
   * @param {string} status - 状态码
   * @returns {string} 颜色类名
   */
  getStatusColor(status) {
    const colorMap = {
      [TaskStatus.PENDING]: 'info',
      [TaskStatus.IN_PROGRESS]: 'warning',
      [TaskStatus.COMPLETED]: 'success',
      [TaskStatus.CANCELLED]: 'danger'
    }

    return colorMap[status] || 'default'
  }

  /**
   * 获取任务状态 Element UI Tag 类型
   * @param {string} status - 状态码
   * @returns {string} Tag 类型
   */
  getStatusType(status) {
    const typeMap = {
      [TaskStatus.PENDING]: 'info',
      [TaskStatus.IN_PROGRESS]: 'warning',
      [TaskStatus.COMPLETED]: 'success',
      [TaskStatus.CANCELLED]: 'danger'
    }

    return typeMap[status] || 'info'
  }

  /**
   * 格式化日期时间
   * @param {string|null|undefined} dateTime - 日期时间字符串
   * @returns {string} 格式化后的日期时间
   */
  formatDateTime(dateTime) {
    if (!dateTime) {
      return ''
    }

    try {
      const date = new Date(dateTime)
      if (isNaN(date.getTime())) {
        return ''
      }

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch (e) {
      return ''
    }
  }

  /**
   * 获取任务状态选项
   * @returns {Array} 状态选项列表
   */
  getStatusOptions() {
    return [
      { value: TaskStatus.PENDING, label: '待开始' },
      { value: TaskStatus.IN_PROGRESS, label: '进行中' },
      { value: TaskStatus.COMPLETED, label: '已完成' },
      { value: TaskStatus.CANCELLED, label: '已取消' }
    ]
  }

  /**
   * 获取任务类型选项
   * @returns {Array} 类型选项列表
   */
  getTaskTypeOptions() {
    return [
      { value: TaskType.GENERAL, label: '通用任务' },
      { value: TaskType.PLATE_MAKING, label: '制版任务' },
      { value: TaskType.CUTTING, label: '开料任务' },
      { value: TaskType.PRINTING, label: '印刷任务' },
      { value: TaskType.POST_PROCESSING, label: '后道任务' }
    ]
  }

  /**
   * 验证任务拆分数据
   * @param {Object} task - 原任务
   * @param {Array} splits - 拆分方案
   * @returns {Object} 验证结果 { valid: boolean, errors: Array }
   */
  validateSplit(task, splits) {
    const errors = []

    // 验证拆分数量
    if (!splits || splits.length < 2) {
      errors.push('至少需要拆分为 2 个子任务')
    }

    // 验证总数量
    const totalQuantity = splits.reduce((sum, split) => {
      return sum + (split.production_quantity || 0)
    }, 0)

    if (totalQuantity !== task.production_quantity) {
      errors.push(`拆分后的总数量(${totalQuantity})必须等于原任务数量(${task.production_quantity})`)
    }

    // 验证每个拆分的数量
    splits.forEach((split, index) => {
      if (!split.production_quantity || split.production_quantity <= 0) {
        errors.push(`第 ${index + 1} 个子任务的数量必须大于 0`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 导出任务列表
   * @param {Object} filters - 筛选条件
   * @returns {Promise} 导出结果
   */
  async exportTasks(filters = {}) {
    return this.execute(
      () => this.apiClient.export(filters),
      { showLoading: true }
    )
  }
}

// 创建单例实例
const taskService = new TaskService()

export default taskService
