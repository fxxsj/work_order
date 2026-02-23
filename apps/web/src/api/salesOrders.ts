import { http } from '../lib/http'
import { createApiWithActions } from './base'
import type { PaginatedResult } from './base'

export type { PaginatedResult } from './base'

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

export const salesOrderApi = createApiWithActions(
  'sales-orders',
  {
    submit: async (id: number) => (await http.post(`/sales-orders/${id}/submit/`)).data,
    approve: async (id: number, input?: { approval_comment?: string }) =>
      (await http.post(`/sales-orders/${id}/approve/`, input || {})).data,
    reject: async (id: number, input: { reason: string; approval_comment?: string }) =>
      (await http.post(`/sales-orders/${id}/reject/`, input)).data,
    startProduction: async (id: number) => (await http.post(`/sales-orders/${id}/start_production/`)).data
  }
)

export async function listSalesOrders(params: { page: number; page_size: number; search?: string; status?: string; payment_status?: string }) {
  return salesOrderApi.list(params) as Promise<PaginatedResult<SalesOrderListItem>>
}

export async function getSalesOrder(id: number) {
  return salesOrderApi.retrieve(id) as Promise<SalesOrderDetail>
}

export async function createSalesOrder(input: Partial<SalesOrderDetail>) {
  return salesOrderApi.create(input) as Promise<SalesOrderDetail>
}

export async function updateSalesOrder(id: number, input: Partial<SalesOrderDetail>) {
  return salesOrderApi.update(id, input) as Promise<SalesOrderDetail>
}

export async function deleteSalesOrder(id: number) {
  return salesOrderApi.delete(id)
}

export async function submitSalesOrder(id: number) {
  return salesOrderApi.submit(id)
}

export async function approveSalesOrder(id: number, input?: { approval_comment?: string }) {
  return salesOrderApi.approve(id, input)
}

export async function rejectSalesOrder(id: number, input: { reason: string; approval_comment?: string }) {
  return salesOrderApi.reject(id, input)
}

export async function startProductionSalesOrder(id: number) {
  return salesOrderApi.startProduction(id)
}
