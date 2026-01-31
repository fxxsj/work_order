/**
 * 任务分派规则 API
 * 管理工序到部门的任务分派规则配置
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class TaskAssignmentRuleAPI extends BaseAPI {
  constructor() {
    super('/task-assignment-rules/', request)
  }

  /**
   * 获取分派预览
   * 返回所有工序的分派效果预览
   * @param {Object} params - 查询参数
   * @returns {Promise} 预览数据
   */
  preview(params = {}) {
    return this.request({
      url: `${this.baseURL}preview/`,
      method: 'get',
      params
    })
  }

  /**
   * 获取全局自动分派启用状态
   * @returns {Promise} { enabled: boolean }
   */
  getGlobalState() {
    return this.request({
      url: `${this.baseURL}global_state/`,
      method: 'get'
    })
  }

  /**
   * 设置全局自动分派启用状态
   * @param {boolean} enabled - 是否启用
   * @returns {Promise} { enabled: boolean }
   */
  setGlobalState(enabled) {
    return this.request({
      url: `${this.baseURL}set_global_state/`,
      method: 'post',
      data: { enabled }
    })
  }
}

export const taskAssignmentRuleAPI = new TaskAssignmentRuleAPI()
export default taskAssignmentRuleAPI
