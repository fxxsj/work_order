/**
 * 部门管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class DepartmentAPI extends BaseAPI {
  constructor() {
    super('/departments/', request)
  }
}

export const departmentAPI = new DepartmentAPI()
export default departmentAPI
