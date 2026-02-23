import { http } from '../lib/http'
import { createApiWithActions } from './base'
import type { PaginatedResult } from './base'

export type { PaginatedResult } from './base'

export type PurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'ordered' | 'received' | 'cancelled'

export type PurchaseOrderItem = {
  id: number
  purchase_order: number
  material: number
  material_name?: string
  material_code?: string
  quantity: string | number
  received_quantity?: string | number
  unit_price: string | number
  status?: 'pending' | 'partial' | 'received'
  status_display?: string
  subtotal?: string | number
  remaining_quantity?: string | number
  notes?: string
}

export type PurchaseOrderListItem = {
  id: number
  order_number: string
  supplier: number
  supplier_name?: string
  supplier_code?: string
  status: PurchaseOrderStatus
  status_display?: string
  total_amount?: string | number
  items_count?: number
  received_progress?: number
  created_at?: string
  notes?: string
  rejection_reason?: string
  submitted_by?: number | null
  submitted_by_name?: string | null
  submitted_at?: string | null
  approved_by?: number | null
  approved_by_name?: string | null
  approved_at?: string | null
  ordered_date?: string | null
  expected_date?: string | null
  actual_received_date?: string | null
  work_order?: number | null
  work_order_number?: string | null
}

export type PurchaseOrderDetail = PurchaseOrderListItem & {
  supplier_contact?: string
  supplier_phone?: string
  items?: PurchaseOrderItem[]
}

export const purchaseOrderApi = createApiWithActions(
  'purchase-orders',
  {
    submit: async (id: number) => (await http.post(`/purchase-orders/${id}/submit/`)).data,
    approve: async (id: number) => (await http.post(`/purchase-orders/${id}/approve/`)).data,
    reject: async (id: number, input: { rejection_reason: string }) =>
      (await http.post(`/purchase-orders/${id}/reject/`, input)).data,
    placeOrder: async (id: number, input?: { ordered_date?: string }) =>
      (await http.post(`/purchase-orders/${id}/place_order/`, input || {})).data,
    receive: async (
      id: number,
      input: {
        received_date?: string
        items: { item_id: number; received_quantity: number; delivery_note_number?: string; notes?: string }[]
      }
    ) => (await http.post(`/purchase-orders/${id}/receive/`, input)).data,
    getReceiveRecords: async (id: number) => (await http.get(`/purchase-orders/${id}/receive_records/`)).data,
    getPendingInspections: async (id: number) => (await http.get(`/purchase-orders/${id}/pending_inspections/`)).data,
    cancel: async (id: number) => (await http.post(`/purchase-orders/${id}/cancel/`)).data,
    getLowStockMaterials: async () => (await http.get('/purchase-orders/low_stock_materials/')).data
  }
)

export async function listPurchaseOrders(params: { page: number; page_size: number; search?: string; status?: string }) {
  return purchaseOrderApi.list(params) as Promise<PaginatedResult<PurchaseOrderListItem>>
}

export async function getPurchaseOrder(id: number) {
  return purchaseOrderApi.retrieve(id) as Promise<PurchaseOrderDetail>
}

export async function createPurchaseOrder(input: Partial<PurchaseOrderDetail> & { items_data?: any[] }) {
  return purchaseOrderApi.create(input) as Promise<PurchaseOrderDetail>
}

export async function updatePurchaseOrder(id: number, input: Partial<PurchaseOrderDetail> & { items_data?: any[] }) {
  return purchaseOrderApi.update(id, input) as Promise<PurchaseOrderDetail>
}

export async function deletePurchaseOrder(id: number) {
  return purchaseOrderApi.delete(id)
}

export async function submitPurchaseOrder(id: number) {
  return purchaseOrderApi.submit(id)
}

export async function approvePurchaseOrder(id: number) {
  return purchaseOrderApi.approve(id)
}

export async function rejectPurchaseOrder(id: number, input: { rejection_reason: string }) {
  return purchaseOrderApi.reject(id, input)
}

export async function placeOrderPurchaseOrder(id: number, input?: { ordered_date?: string }) {
  return purchaseOrderApi.placeOrder(id, input)
}

export async function receivePurchaseOrder(
  id: number,
  input: { received_date?: string; items: { item_id: number; received_quantity: number; delivery_note_number?: string; notes?: string }[] }
) {
  return purchaseOrderApi.receive(id, input)
}

export async function getPurchaseOrderReceiveRecords(id: number) {
  return purchaseOrderApi.getReceiveRecords(id)
}

export async function getPurchaseOrderPendingInspections(id: number) {
  return purchaseOrderApi.getPendingInspections(id)
}

export async function cancelPurchaseOrder(id: number) {
  return purchaseOrderApi.cancel(id)
}

export async function getLowStockMaterials() {
  return purchaseOrderApi.getLowStockMaterials()
}
