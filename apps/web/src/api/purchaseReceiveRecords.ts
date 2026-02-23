import { http } from '../lib/http'
import { createApiWithActions } from './base'
import type { PaginatedResult } from './base'

export type { PaginatedResult } from './base'

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

export const purchaseReceiveRecordApi = createApiWithActions(
  'purchase-receive-records',
  {
    listPendingInspections: async (params: { page: number; page_size: number; search?: string }) =>
      (await http.get<PaginatedResult<PurchaseReceiveRecord>>('/purchase-receive-records/pending_list/', { params })).data,
    listPendingStockIn: async (params: { page: number; page_size: number; search?: string }) =>
      (await http.get<PaginatedResult<PurchaseReceiveRecord>>('/purchase-receive-records/pending_stock_in/', { params })).data,
    listPendingReturn: async (params: { page: number; page_size: number; search?: string }) =>
      (await http.get<PaginatedResult<PurchaseReceiveRecord>>('/purchase-receive-records/pending_return/', { params })).data,
    confirmInspection: async (
      id: number,
      input: { qualified_quantity: number; unqualified_quantity: number; unqualified_reason?: string }
    ) => (await http.post(`/purchase-receive-records/${id}/confirm_inspection/`, input)).data,
    stockIn: async (id: number) => (await http.post(`/purchase-receive-records/${id}/stock_in/`)).data,
    processReturn: async (id: number, input: { return_quantity: number; return_note?: string }) =>
      (await http.post(`/purchase-receive-records/${id}/process_return/`, input)).data
  }
)

export async function listPendingInspections(params: { page: number; page_size: number; search?: string }) {
  return purchaseReceiveRecordApi.listPendingInspections(params)
}

export async function listPendingStockIn(params: { page: number; page_size: number; search?: string }) {
  return purchaseReceiveRecordApi.listPendingStockIn(params)
}

export async function listPendingReturn(params: { page: number; page_size: number; search?: string }) {
  return purchaseReceiveRecordApi.listPendingReturn(params)
}

export async function confirmInspection(
  id: number,
  input: { qualified_quantity: number; unqualified_quantity: number; unqualified_reason?: string }
) {
  return purchaseReceiveRecordApi.confirmInspection(id, input)
}

export async function stockIn(id: number) {
  return purchaseReceiveRecordApi.stockIn(id)
}

export async function processReturn(id: number, input: { return_quantity: number; return_note?: string }) {
  return purchaseReceiveRecordApi.processReturn(id, input)
}
