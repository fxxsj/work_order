/**
 * 部门管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class DepartmentAPI extends BaseAPI {
  constructor() {
    super('/departments/', request)
  }

  /**
   * 获取部门树结构
   * @returns {Promise} 部门树数据
   */
  getTree() {
    return this.request({
      url: `${this.baseUrl}tree/`,
      method: 'get'
    })
  }

  /**
   * 获取所有部门（不分页，用于下拉选择）
   * @param {Object} params - 查询参数
   * @param {boolean} params.is_active - 是否只返回启用的部门
   * @returns {Promise} 所有部门列表
   */
  getAll(params = {}) {
    return this.request({
      url: `${this.baseUrl}all/`,
      method: 'get',
      params
    })
  }
}

export const departmentAPI = new DepartmentAPI()
export default departmentAPI
