import { http } from '../lib/http'
import { createApiWithActions } from './base'

export type { PaginatedResult } from './base'

export type StockOutStatus = 'draft' | 'submitted' | 'approved' | 'completed' | 'cancelled'
export type StockOutType = 'delivery' | 'production' | 'adjustment' | 'other'

export type StockOut = {
  id: number
  order_number: string
  out_type: StockOutType
  out_type_display?: string
  delivery_order?: number | null
  delivery_order_number?: string | null
  stock_out_date?: string
  status: StockOutStatus
  status_display?: string
  operator_name?: string | null
  submitted_by_name?: string | null
  approved_by_name?: string | null
  notes?: string
  created_at?: string
}

export const stockOutApi = createApiWithActions(
  'stock-outs',
  {
    approve: async (id: number) => (await http.post(`/stock-outs/${id}/approve/`)).data
  }
)

export async function listStockOuts(params: { page: number; page_size: number; status?: string; out_type?: string }) {
  return stockOutApi.list(params)
}

export async function approveStockOut(id: number) {
  return stockOutApi.approve(id)
}
