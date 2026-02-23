import { http } from '../lib/http'
import { createApiWithActions } from './base'
import type { PaginatedResult } from './base'

export type { PaginatedResult } from './base'

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
  receiver_signature?: string | null
  received_notes?: string
  notes?: string
  items?: DeliveryItem[]
}

export const deliveryOrderApi = createApiWithActions(
  'delivery-orders',
  {
    ship: async (id: number, input?: { logistics_company?: string; tracking_number?: string }) =>
      (await http.post(`/delivery-orders/${id}/ship/`, input || {})).data,
    receive: async (id: number, input?: { received_notes?: string; receiver_signature?: File }) => {
      if (input?.receiver_signature) {
        const form = new FormData()
        if (input.received_notes) form.append('received_notes', input.received_notes)
        form.append('receiver_signature', input.receiver_signature)
        return (await http.post(`/delivery-orders/${id}/receive/`, form)).data
      }
      return (await http.post(`/delivery-orders/${id}/receive/`, input || {})).data
    },
    reject: async (id: number, input: { reject_reason: string }) =>
      (await http.post(`/delivery-orders/${id}/reject/`, input)).data,
    summary: async () => (await http.get('/delivery-orders/summary/')).data
  }
)

export async function listDeliveryOrders(params: {
  page: number
  page_size: number
  search?: string
  status?: string
  customer?: number
  start_date?: string
  end_date?: string
}) {
  return deliveryOrderApi.list(params) as Promise<PaginatedResult<DeliveryOrderListItem>>
}

export async function getDeliveryOrder(id: number) {
  return deliveryOrderApi.retrieve(id) as Promise<DeliveryOrderDetail>
}

export async function createDeliveryOrder(input: any) {
  return deliveryOrderApi.create(input)
}

export async function updateDeliveryOrder(id: number, input: any) {
  return deliveryOrderApi.update(id, input)
}

export async function deleteDeliveryOrder(id: number) {
  return deliveryOrderApi.delete(id)
}

export async function shipDeliveryOrder(id: number, input?: { logistics_company?: string; tracking_number?: string }) {
  return deliveryOrderApi.ship(id, input)
}

export async function receiveDeliveryOrder(id: number, input?: { received_notes?: string; receiver_signature?: File }) {
  return deliveryOrderApi.receive(id, input)
}

export async function rejectDeliveryOrder(id: number, input: { reject_reason: string }) {
  return deliveryOrderApi.reject(id, input)
}

export async function getDeliveryOrderSummary() {
  return deliveryOrderApi.summary()
}
