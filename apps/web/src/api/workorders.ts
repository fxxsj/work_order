import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type WorkOrderListItem = {
  id: number
  order_number: string
  customer_name: string
  product_name: string | null
  quantity: number
  unit: string
  status_display: string
  priority_display: string
  delivery_date: string | null
  progress_percentage: number
}

export async function listWorkOrders(params: {
  page: number
  page_size: number
  search?: string
  ordering?: string
  status?: string
  priority?: string
}) {
  const res = await http.get<PaginatedResult<WorkOrderListItem>>('/workorders/', { params })
  return res.data
}

export type WorkOrderDetail = Record<string, any>

export async function getWorkOrder(id: number) {
  const res = await http.get<WorkOrderDetail>(`/workorders/${id}/`)
  return res.data
}

export async function updateWorkOrderStatus(id: number, status: string) {
  const res = await http.post(`/workorders/${id}/update_status/`, { status })
  return res.data
}

export async function approveWorkOrder(input: {
  id: number
  approval_status: 'approved' | 'rejected'
  approval_comment?: string
  rejection_reason?: string
}) {
  const res = await http.post(`/workorders/${input.id}/approve/`, {
    approval_status: input.approval_status,
    approval_comment: input.approval_comment || '',
    rejection_reason: input.rejection_reason || ''
  })
  return res.data
}

export async function createWorkOrder(input: {
  customer: number
  priority: 'low' | 'normal' | 'high' | 'urgent'
  delivery_date: string
  notes?: string
  products_data: Array<{
    product: number
    quantity: number
    unit: string
    specification?: string
    sort_order?: number
  }>
}) {
  const res = await http.post('/workorders/', input)
  return res.data
}
