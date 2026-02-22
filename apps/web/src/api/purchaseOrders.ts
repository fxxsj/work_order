import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

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

export async function listPurchaseOrders(params: { page: number; page_size: number; search?: string; status?: string }) {
  const res = await http.get<PaginatedResult<PurchaseOrderListItem>>('/purchase-orders/', { params })
  return res.data
}

export async function getPurchaseOrder(id: number) {
  const res = await http.get<PurchaseOrderDetail>(`/purchase-orders/${id}/`)
  return res.data
}

export async function createPurchaseOrder(input: Partial<PurchaseOrderDetail> & { items_data?: any[] }) {
  const res = await http.post<PurchaseOrderDetail>('/purchase-orders/', input)
  return res.data
}

export async function updatePurchaseOrder(id: number, input: Partial<PurchaseOrderDetail> & { items_data?: any[] }) {
  const res = await http.put<PurchaseOrderDetail>(`/purchase-orders/${id}/`, input)
  return res.data
}

export async function deletePurchaseOrder(id: number) {
  const res = await http.delete(`/purchase-orders/${id}/`)
  return res.data
}

export async function submitPurchaseOrder(id: number) {
  const res = await http.post(`/purchase-orders/${id}/submit/`)
  return res.data
}

export async function approvePurchaseOrder(id: number) {
  const res = await http.post(`/purchase-orders/${id}/approve/`)
  return res.data
}

export async function rejectPurchaseOrder(id: number, input: { rejection_reason: string }) {
  const res = await http.post(`/purchase-orders/${id}/reject/`, input)
  return res.data
}

export async function placeOrderPurchaseOrder(id: number, input?: { ordered_date?: string }) {
  const res = await http.post(`/purchase-orders/${id}/place_order/`, input || {})
  return res.data
}

export async function receivePurchaseOrder(
  id: number,
  input: { received_date?: string; items: { item_id: number; received_quantity: number; delivery_note_number?: string; notes?: string }[] }
) {
  const res = await http.post(`/purchase-orders/${id}/receive/`, input)
  return res.data
}

export async function getPurchaseOrderReceiveRecords(id: number) {
  const res = await http.get(`/purchase-orders/${id}/receive_records/`)
  return res.data
}

export async function getPurchaseOrderPendingInspections(id: number) {
  const res = await http.get(`/purchase-orders/${id}/pending_inspections/`)
  return res.data
}

export async function cancelPurchaseOrder(id: number) {
  const res = await http.post(`/purchase-orders/${id}/cancel/`)
  return res.data
}

export async function getLowStockMaterials() {
  const res = await http.get('/purchase-orders/low_stock_materials/')
  return res.data
}

