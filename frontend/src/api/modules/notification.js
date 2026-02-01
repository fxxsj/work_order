/**
 * 通知管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class NotificationAPI extends BaseAPI {
  constructor() {
    super('/notifications/', request)
  }

  // 标记单个通知为已读
  markAsRead(id) {
    return this.request({
      url: `${this.baseURL}${id}/mark_read/`,
      method: 'post'
    })
  }

  // 标记所有通知为已读
  markAllAsRead() {
    return this.request({
      url: `${this.baseURL}mark_all_read/`,
      method: 'post'
    })
  }

  // 获取未读数量
  getUnreadCount() {
    return this.request({
      url: `${this.baseURL}unread_count/`,
      method: 'get'
    })
  }

  // 获取通知统计
  getStatistics() {
    return this.request({
      url: `${this.baseURL}statistics/`,
      method: 'get'
    })
  }

  // 删除通知
  delete(id) {
    return this.request({
      url: `${this.baseURL}${id}/`,
      method: 'delete'
    })
  }

  // 删除所有已读
  deleteAllRead() {
    return this.request({
      url: `${this.baseURL}delete_all_read/`,
      method: 'delete'
    })
  }
}

export const notificationAPI = new NotificationAPI()
export default notificationAPI
