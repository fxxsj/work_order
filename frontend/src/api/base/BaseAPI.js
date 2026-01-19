/**
 * BaseAPI Class
 * 提供标准的 CRUD 操作，消除 90% 的 API 代码重复
 *
 * @example
 * import request from '@/api/index'
 * import { BaseAPI } from '@/api/base/BaseAPI'
 *
 * class CustomerAPI extends BaseAPI {
 *   constructor() {
 *     super('/customers/', request)
 *   }
 * }
 *
 * export const customerAPI = new CustomerAPI()
 */
export class BaseAPI {
  /**
   * @param {string} baseUrl - 基础 URL（如 '/customers/'）
   * @param {Function} request - axios 请求实例
   */
  constructor(baseUrl, request) {
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new Error('baseUrl must be a non-empty string')
    }
    if (!request || typeof request !== 'function') {
      throw new Error('request must be a function')
    }
    this.baseUrl = baseUrl
    this.request = request
  }

  /**
   * 获取列表数据
   * @param {Object} params - 查询参数
   * @returns {Promise} API 响应
   */
  getList(params) {
    return this.request({
      url: this.baseUrl,
      method: 'get',
      params
    })
  }

  /**
   * 获取详情数据
   * @param {number|string} id - 资源 ID
   * @returns {Promise} API 响应
   */
  getDetail(id) {
    if (!id) {
      return Promise.reject(new Error('ID is required'))
    }
    return this.request({
      url: `${this.baseUrl}${id}/`,
      method: 'get'
    })
  }

  /**
   * 创建资源
   * @param {Object} data - 创建数据
   * @returns {Promise} API 响应
   */
  create(data) {
    if (!data) {
      return Promise.reject(new Error('Data is required'))
    }
    return this.request({
      url: this.baseUrl,
      method: 'post',
      data
    })
  }

  /**
   * 更新资源
   * @param {number|string} id - 资源 ID
   * @param {Object} data - 更新数据
   * @returns {Promise} API 响应
   */
  update(id, data) {
    if (!id) {
      return Promise.reject(new Error('ID is required'))
    }
    if (!data) {
      return Promise.reject(new Error('Data is required'))
    }
    return this.request({
      url: `${this.baseUrl}${id}/`,
      method: 'put',
      data
    })
  }

  /**
   * 部分更新资源
   * @param {number|string} id - 资源 ID
   * @param {Object} data - 更新数据
   * @returns {Promise} API 响应
   */
  patch(id, data) {
    if (!id) {
      return Promise.reject(new Error('ID is required'))
    }
    if (!data) {
      return Promise.reject(new Error('Data is required'))
    }
    return this.request({
      url: `${this.baseUrl}${id}/`,
      method: 'patch',
      data
    })
  }

  /**
   * 删除资源
   * @param {number|string} id - 资源 ID
   * @returns {Promise} API 响应
   */
  delete(id) {
    if (!id) {
      return Promise.reject(new Error('ID is required'))
    }
    return this.request({
      url: `${this.baseUrl}${id}/`,
      method: 'delete'
    })
  }

  /**
   * 批量操作
   * @param {Object} data - 批量操作数据（包含 action 和 ids）
   * @returns {Promise} API 响应
   */
  batchAction(data) {
    if (!data) {
      return Promise.reject(new Error('Data is required'))
    }
    return this.request({
      url: `${this.baseUrl}batch_action/`,
      method: 'post',
      data
    })
  }

  /**
   * 批量删除
   * @param {Array} ids - ID 数组
   * @returns {Promise} API 响应
   */
  batchDelete(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return Promise.reject(new Error('IDs array is required'))
    }
    return this.batchAction({
      action: 'delete',
      ids
    })
  }

  /**
   * 自定义操作（用于子类扩展）
   * @param {string} url - 完整 URL
   * @param {string} method - HTTP 方法
   * @param {Object} data - 请求数据
   * @param {Object} params - 查询参数
   * @returns {Promise} API 响应
   */
  customAction(url, method = 'get', data = null, params = null) {
    const config = {
      url,
      method
    }
    if (data) {
      config.data = data
    }
    if (params) {
      config.params = params
    }
    return this.request(config)
  }
}

export default BaseAPI
