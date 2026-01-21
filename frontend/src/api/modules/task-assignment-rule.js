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
}

export const taskAssignmentRuleAPI = new TaskAssignmentRuleAPI()
export default taskAssignmentRuleAPI
