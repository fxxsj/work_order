import { http } from '../lib/http'
import { createApiWithActions } from './base'

export type { PaginatedResult } from './base'

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

export const stockInApi = createApiWithActions(
  'stock-ins',
  {
    submit: async (id: number) => (await http.post(`/stock-ins/${id}/submit/`)).data,
    approve: async (id: number) => (await http.post(`/stock-ins/${id}/approve/`)).data
  }
)

export async function listStockIns(params: { page: number; page_size: number; status?: string; start_date?: string; end_date?: string }) {
  return stockInApi.list(params)
}

export async function createStockIn(input: { work_order: number; stock_in_date?: string; notes?: string }) {
  return stockInApi.create(input)
}

export async function submitStockIn(id: number) {
  return stockInApi.submit(id)
}

export async function approveStockIn(id: number) {
  return stockInApi.approve(id)
}

export async function deleteStockIn(id: number) {
  return stockInApi.delete(id)
}
