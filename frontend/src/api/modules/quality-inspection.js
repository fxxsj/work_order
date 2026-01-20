/**
 * Quality Inspection API Module
 * 质量检验管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class QualityInspectionAPI extends BaseAPI {
  constructor() {
    super('/quality-inspections/', request)
  }

  /**
   * 完成检验
   * @param {number} id - 质检单ID
   * @param {Object} data - 检验结果
   * @returns {Promise} 检验结果
   */
  complete(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/complete/`,
      method: 'post',
      data
    })
  }

  /**
   * 获取质检汇总
   * @returns {Promise} 质检汇总数据
   */
  getSummary() {
    return this.request({
      url: `${this.baseURL}summary/`,
      method: 'get'
    })
  }
}

export const qualityInspectionAPI = new QualityInspectionAPI()
export default qualityInspectionAPI
