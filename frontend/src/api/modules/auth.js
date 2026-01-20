/**
 * Authentication API Module
 * 用户认证和授权 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class AuthAPI extends BaseAPI {
  constructor() {
    super('/auth/', request)
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证 { username, password }
   * @returns {Promise} 登录结果（包含 token）
   */
  login(credentials) {
    return this.request({
      url: `${this.baseUrl}login/`,
      method: 'post',
      data: credentials
    })
  }

  /**
   * 用户登出
   * @returns {Promise} 登出结果
   */
  logout() {
    return this.request({
      url: `${this.baseUrl}logout/`,
      method: 'post'
    })
  }

  /**
   * 获取当前用户信息
   * @returns {Promise} 用户信息对象
   */
  getCurrentUser() {
    return this.request({
      url: `${this.baseUrl}user/`,
      method: 'get'
    })
  }

  /**
   * 用户注册
   * @param {Object} data - 注册信息 { username, password, email, ... }
   * @returns {Promise} 注册结果
   */
  register(data) {
    return this.request({
      url: `${this.baseUrl}register/`,
      method: 'post',
      data
    })
  }

  /**
   * 获取业务员列表
   * @returns {Promise} 业务员列表
   */
  getSalespersons() {
    return this.request({
      url: `${this.baseUrl}salespersons/`,
      method: 'get'
    })
  }

  /**
   * 根据部门获取用户列表
   * @param {number|null} departmentId - 部门ID，null表示获取所有用户
   * @returns {Promise} 用户列表
   */
  getUsersByDepartment(departmentId = null) {
    const params = {}
    if (departmentId) {
      params.department_id = departmentId
    }
    return this.request({
      url: `${this.baseUrl}users/`,
      method: 'get',
      params
    })
  }

  /**
   * 修改密码
   * @param {Object} data - 密码信息 { old_password, new_password }
   * @returns {Promise} 修改结果
   */
  changePassword(data) {
    return this.request({
      url: `${this.baseUrl}change-password/`,
      method: 'post',
      data
    })
  }

  /**
   * 更新个人信息
   * @param {Object} data - 用户信息 { name, email, phone, ... }
   * @returns {Promise} 更新结果
   */
  updateProfile(data) {
    return this.request({
      url: `${this.baseUrl}update-profile/`,
      method: 'put',
      data
    })
  }
}

export const authAPI = new AuthAPI()
export default authAPI
