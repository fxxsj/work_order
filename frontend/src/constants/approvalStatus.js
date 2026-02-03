/**
 * 审批状态常量
 */

export const ApprovalStatus = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

export const ApprovalStatusChoices = [
  { value: 'pending', label: '待审核', color: '#E6A23C' },
  { value: 'submitted', label: '已提交', color: '#409EFF' },
  { value: 'approved', label: '已审核', color: '#67C23A' },
  { value: 'rejected', label: '已拒绝', color: '#F56C6C' }
]

/**
 * 根据状态值获取标签
 * @param {string} status - 状态值
 * @returns {string} 状态标签
 */
export function getApprovalStatusLabel(status) {
  const choice = ApprovalStatusChoices.find(item => item.value === status)
  return choice ? choice.label : status
}

/**
 * 根据状态值获取颜色
 * @param {string} status - 状态值
 * @returns {string} 颜色值
 */
export function getApprovalStatusColor(status) {
  const choice = ApprovalStatusChoices.find(item => item.value === status)
  return choice ? choice.color : '#E6A23C'
}
