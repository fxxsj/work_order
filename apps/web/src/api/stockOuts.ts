import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

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

export async function listStockOuts(params: { page: number; page_size: number; status?: string; out_type?: string }) {
  const res = await http.get<PaginatedResult<StockOut>>('/stock-outs/', { params })
  return res.data
}

export async function approveStockOut(id: number) {
  const res = await http.post(`/stock-outs/${id}/approve/`)
  return res.data
}

