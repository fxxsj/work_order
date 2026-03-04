import request from '@/api'
import { BaseAPI } from '@/api/base/BaseAPI'

class AuditLogAPI extends BaseAPI {
  constructor() {
    super('/audit-logs/', request)
  }

  getStatistics(params) {
    return this.customAction(`${this.baseUrl}statistics/`, 'get', null, params)
  }

  getDiff(id) {
    return this.customAction(`${this.baseUrl}${id}/diff/`, 'get')
  }

  exportLogs(data) {
    return this.customAction(`${this.baseUrl}export/`, 'post', data)
  }

  getExportList(params) {
    return this.customAction(`${this.baseUrl}exports/`, 'get', null, params)
  }

  downloadExport(id) {
    return this.request({
      url: `${this.baseUrl}exports/${id}/download/`,
      method: 'get',
      responseType: 'blob'
    })
  }
}

export const auditLogAPI = new AuditLogAPI()
