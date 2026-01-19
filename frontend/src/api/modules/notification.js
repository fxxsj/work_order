/**
 * 通知管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class NotificationAPI extends BaseAPI {
  constructor() {
    super('/notifications/', request)
  }

  // 标记为已读
  markAsRead(id) {
    return this.customAction(`${this.baseUrl}${id}/mark_read/`, 'post')
  }

  // 全部标记为已读
  markAllAsRead() {
    return this.customAction(`${this.baseUrl}mark_all_read/`, 'post')
  }
}

export const notificationAPI = new NotificationAPI()
export default notificationAPI
