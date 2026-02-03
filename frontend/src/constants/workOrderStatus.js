/**
 * 施工单状态常量
 */

export const WorkOrderStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const WorkOrderStatusChoices = [
  { value: 'pending', label: '待开始', color: '#909399' },
  { value: 'in_progress', label: '进行中', color: '#409EFF' },
  { value: 'paused', label: '已暂停', color: '#E6A23C' },
  { value: 'completed', label: '已完成', color: '#67C23A' },
  { value: 'cancelled', label: '已取消', color: '#F56C6C' }
]

/**
 * 根据状态值获取标签
 * @param {string} status - 状态值
 * @returns {string} 状态标签
 */
export function getWorkOrderStatusLabel(status) {
  const choice = WorkOrderStatusChoices.find(item => item.value === status)
  return choice ? choice.label : status
}

/**
 * 根据状态值获取颜色
 * @param {string} status - 状态值
 * @returns {string} 颜色值
 */
export function getWorkOrderStatusColor(status) {
  const choice = WorkOrderStatusChoices.find(item => item.value === status)
  return choice ? choice.color : '#909399'
}
