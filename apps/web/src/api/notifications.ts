import { http } from '../lib/http'
import type { PaginatedResult } from './workorders'

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

export async function listNotifications(params: { page: number; page_size: number }) {
  const res = await http.get<PaginatedResult<NotificationItem>>('/notifications/', { params })
  return res.data
}

export async function getUnreadCount() {
  const res = await http.get<{ unread_count: number }>('/notifications/unread_count/')
  return res.data.unread_count
}

export async function markRead(id: number) {
  const res = await http.post(`/notifications/${id}/mark_read/`)
  return res.data
}

export async function markAllRead() {
  const res = await http.post('/notifications/mark_all_read/')
  return res.data
}

export async function getWsTicket() {
  const res = await http.post<{ ticket: string; expires_in: number }>('/notifications/ws_ticket/')
  return res.data.ticket
}
