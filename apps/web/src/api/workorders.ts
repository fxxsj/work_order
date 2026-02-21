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

