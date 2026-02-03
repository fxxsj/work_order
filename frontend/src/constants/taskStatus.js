/**
 * 任务状态常量
 */

export const TaskStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled'
}

export const TaskStatusChoices = [
  { value: 'draft', label: '草稿', color: '#909399' },
  { value: 'pending', label: '待开始', color: '#409EFF' },
  { value: 'in_progress', label: '进行中', color: '#E6A23C' },
  { value: 'completed', label: '已完成', color: '#67C23A' },
  { value: 'skipped', label: '已跳过', color: '#C0C4CC' },
  { value: 'cancelled', label: '已取消', color: '#F56C6C' }
]

/**
 * 根据状态值获取标签
 * @param {string} status - 状态值
 * @returns {string} 状态标签
 */
export function getTaskStatusLabel(status) {
  const choice = TaskStatusChoices.find(item => item.value === status)
  return choice ? choice.label : status
}

/**
 * 根据状态值获取颜色
 * @param {string} status - 状态值
 * @returns {string} 颜色值
 */
export function getTaskStatusColor(status) {
  const choice = TaskStatusChoices.find(item => item.value === status)
  return choice ? choice.color : '#909399'
}
