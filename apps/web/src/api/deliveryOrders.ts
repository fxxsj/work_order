import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type DeliveryOrderStatus = 'pending' | 'shipped' | 'in_transit' | 'received' | 'rejected' | 'returned'

export type DeliveryItem = {
  id: number
  delivery_order: number
  product: number
  product_name?: string
  product_code?: string
  quantity: string | number
  unit?: string
  unit_price?: string | number
  subtotal?: string | number
  stock_batch?: string
  notes?: string
}

export type DeliveryOrderListItem = {
  id: number
  order_number: string
  customer_name?: string
  sales_order_number?: string
  delivery_date?: string | null
  status: DeliveryOrderStatus
  status_display?: string
  items_count?: number
  total_quantity?: number
  logistics_company?: string
  tracking_number?: string
  created_at?: string
}

export type DeliveryOrderDetail = DeliveryOrderListItem & {
  sales_order: number
  customer: number
  receiver_name: string
  receiver_phone: string
  delivery_address: string
  freight?: string | number
  package_count?: number
  package_weight?: string | number | null
  received_date?: string | null
  received_notes?: string
  notes?: string
  items?: DeliveryItem[]
}

export async function listDeliveryOrders(params: {
  page: number
  page_size: number
  search?: string
  status?: string
  customer?: number
  start_date?: string
  end_date?: string
}) {
  const res = await http.get<PaginatedResult<DeliveryOrderListItem>>('/delivery-orders/', { params })
  return res.data
}

export async function getDeliveryOrder(id: number) {
  const res = await http.get<DeliveryOrderDetail>(`/delivery-orders/${id}/`)
  return res.data
}

export async function createDeliveryOrder(input: any) {
  const res = await http.post('/delivery-orders/', input)
  return res.data
}

export async function updateDeliveryOrder(id: number, input: any) {
  const res = await http.put(`/delivery-orders/${id}/`, input)
  return res.data
}

export async function deleteDeliveryOrder(id: number) {
  const res = await http.delete(`/delivery-orders/${id}/`)
  return res.data
}

export async function shipDeliveryOrder(id: number, input?: { logistics_company?: string; tracking_number?: string }) {
  const res = await http.post(`/delivery-orders/${id}/ship/`, input || {})
  return res.data
}

export async function receiveDeliveryOrder(id: number, input?: { received_notes?: string }) {
  const res = await http.post(`/delivery-orders/${id}/receive/`, input || {})
  return res.data
}

export async function rejectDeliveryOrder(id: number, input: { reject_reason: string }) {
  const res = await http.post(`/delivery-orders/${id}/reject/`, input)
  return res.data
}

export async function getDeliveryOrderSummary() {
  const res = await http.get('/delivery-orders/summary/')
  return res.data
}

