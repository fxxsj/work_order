import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type SalesOrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'in_production'
  | 'completed'
  | 'cancelled'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export type SalesOrderItem = {
  id?: number
  product: number
  product_name?: string
  product_code?: string
  quantity: number
  unit?: string
  unit_price: string | number
  discount_amount?: string | number
  tax_rate?: string | number
  subtotal?: string | number
  notes?: string
}

export type SalesOrderListItem = {
  id: number
  order_number: string
  customer: number
  customer_name?: string
  status: SalesOrderStatus
  status_display?: string
  payment_status?: PaymentStatus
  payment_status_display?: string
  subtotal?: string | number
  tax_rate?: string | number
  tax_amount?: string | number
  discount_amount?: string | number
  total_amount?: string | number
  order_date?: string
  delivery_date?: string
  created_at?: string
  items_count?: number
  rejection_reason?: string
}

export type SalesOrderDetail = SalesOrderListItem & {
  customer_contact?: string
  customer_phone?: string
  customer_address?: string
  contact_person?: string
  contact_phone?: string
  shipping_address?: string
  notes?: string
  items?: SalesOrderItem[]
  work_order_numbers?: string[]
}

export async function listSalesOrders(params: { page: number; page_size: number; search?: string; status?: string; payment_status?: string }) {
  const res = await http.get<PaginatedResult<SalesOrderListItem>>('/sales-orders/', { params })
  return res.data
}

export async function getSalesOrder(id: number) {
  const res = await http.get<SalesOrderDetail>(`/sales-orders/${id}/`)
  return res.data
}

export async function createSalesOrder(input: Partial<SalesOrderDetail>) {
  const res = await http.post<SalesOrderDetail>('/sales-orders/', input)
  return res.data
}

export async function updateSalesOrder(id: number, input: Partial<SalesOrderDetail>) {
  const res = await http.put<SalesOrderDetail>(`/sales-orders/${id}/`, input)
  return res.data
}

export async function deleteSalesOrder(id: number) {
  const res = await http.delete(`/sales-orders/${id}/`)
  return res.data
}

export async function submitSalesOrder(id: number) {
  const res = await http.post(`/sales-orders/${id}/submit/`)
  return res.data
}

export async function approveSalesOrder(id: number, input?: { approval_comment?: string }) {
  const res = await http.post(`/sales-orders/${id}/approve/`, input || {})
  return res.data
}

export async function rejectSalesOrder(id: number, input: { reason: string; approval_comment?: string }) {
  const res = await http.post(`/sales-orders/${id}/reject/`, input)
  return res.data
}

export async function startProductionSalesOrder(id: number) {
  const res = await http.post(`/sales-orders/${id}/start_production/`)
  return res.data
}

