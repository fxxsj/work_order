import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type PurchaseReceiveRecord = {
  id: number
  purchase_order_item: number
  purchase_order_number?: string
  material?: number
  material_name?: string
  material_code?: string
  material_unit?: string
  received_quantity: string | number
  received_date?: string
  received_by?: number | null
  received_by_name?: string | null
  delivery_note_number?: string
  notes?: string
  inspection_status?: 'pending' | 'qualified' | 'unqualified' | 'partial_qualified'
  inspection_status_display?: string
  qualified_quantity?: string | number | null
  unqualified_quantity?: string | number | null
  unqualified_reason?: string
  inspected_by_name?: string | null
  inspected_at?: string | null
  is_stocked?: boolean
  stocked_by_name?: string | null
  stocked_at?: string | null
  is_returned?: boolean
  returned_by_name?: string | null
  returned_at?: string | null
}

export async function listPendingInspections(params: { page: number; page_size: number; search?: string }) {
  const res = await http.get<PaginatedResult<PurchaseReceiveRecord>>('/purchase-receive-records/pending_list/', { params })
  return res.data
}

export async function listPendingStockIn(params: { page: number; page_size: number; search?: string }) {
  const res = await http.get<PaginatedResult<PurchaseReceiveRecord>>('/purchase-receive-records/pending_stock_in/', { params })
  return res.data
}

export async function listPendingReturn(params: { page: number; page_size: number; search?: string }) {
  const res = await http.get<PaginatedResult<PurchaseReceiveRecord>>('/purchase-receive-records/pending_return/', { params })
  return res.data
}

export async function confirmInspection(
  id: number,
  input: { qualified_quantity: number; unqualified_quantity: number; unqualified_reason?: string }
) {
  const res = await http.post(`/purchase-receive-records/${id}/confirm_inspection/`, input)
  return res.data
}

export async function stockIn(id: number) {
  const res = await http.post(`/purchase-receive-records/${id}/stock_in/`)
  return res.data
}

export async function processReturn(id: number, input: { return_quantity: number; return_note?: string }) {
  const res = await http.post(`/purchase-receive-records/${id}/process_return/`, input)
  return res.data
}

