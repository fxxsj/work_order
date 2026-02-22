import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type StockInStatus = 'draft' | 'submitted' | 'approved' | 'completed' | 'cancelled'

export type StockIn = {
  id: number
  order_number: string
  work_order?: number | null
  work_order_number?: string
  stock_in_date?: string
  status: StockInStatus
  status_display?: string
  operator?: number | null
  operator_name?: string | null
  submitted_by_name?: string | null
  approved_by_name?: string | null
  notes?: string
  created_at?: string
}

export async function listStockIns(params: { page: number; page_size: number; status?: string; start_date?: string; end_date?: string }) {
  const res = await http.get<PaginatedResult<StockIn>>('/stock-ins/', { params })
  return res.data
}

export async function createStockIn(input: { work_order: number; stock_in_date?: string; notes?: string }) {
  const res = await http.post<StockIn>('/stock-ins/', input)
  return res.data
}

export async function submitStockIn(id: number) {
  const res = await http.post(`/stock-ins/${id}/submit/`)
  return res.data
}

export async function approveStockIn(id: number) {
  const res = await http.post(`/stock-ins/${id}/approve/`)
  return res.data
}

export async function deleteStockIn(id: number) {
  const res = await http.delete(`/stock-ins/${id}/`)
  return res.data
}

