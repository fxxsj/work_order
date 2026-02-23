import { http } from '../lib/http'
import { createApiWithActions } from './base'
import type { PaginatedResult } from './base'

export type { PaginatedResult } from './base'

export type NotificationItem = {
  id: number
  notification_type: string
  priority: string
  title: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
  work_order_id: number | null
  task_id: number | null
}

export const notificationApi = createApiWithActions(
  'notifications',
  {
    unreadCount: async () => (await http.get<{ unread_count: number }>('/notifications/unread_count/')).data.unread_count,
    markRead: async (id: number) => (await http.post(`/notifications/${id}/mark_read/`)).data,
    markAllRead: async () => (await http.post('/notifications/mark_all_read/')).data,
    wsTicket: async () => (await http.post<{ ticket: string; expires_in: number }>('/notifications/ws_ticket/')).data.ticket
  }
)

export async function listNotifications(params: { page: number; page_size: number }) {
  return notificationApi.list(params)
}

export async function getUnreadCount() {
  return notificationApi.unreadCount()
}

export async function markRead(id: number) {
  return notificationApi.markRead(id)
}

export async function markAllRead() {
  return notificationApi.markAllRead()
}

export async function getWsTicket() {
  return notificationApi.wsTicket()
}
