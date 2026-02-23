import { http } from '../lib/http'
import { createApiWithActions } from './base'
import type { PaginatedResult } from './base'

export type { PaginatedResult } from './base'

export type ProductStock = {
  id: number
  product: number
  product_name?: string
  product_code?: string
  work_order?: number | null
  work_order_number?: string | null
  batch_no?: string
  location?: string
  quantity: string | number
  reserved_quantity?: string | number
  min_stock_level?: string | number
  unit_cost?: string | number
  status?: string
  status_display?: string
  expiry_date?: string | null
  is_expired?: boolean
  days_until_expiry?: number | null
  available_quantity?: number
  total_value?: number
  is_low_stock?: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

export const productStockApi = createApiWithActions(
  'product-stocks',
  {
    adjust: async (id: number, input: { adjust_type: 'add' | 'subtract' | 'set'; quantity: number; reason: string }) =>
      (await http.post(`/product-stocks/${id}/adjust/`, input)).data,
    getLowStock: async () => (await http.get('/product-stocks/low_stock/')).data,
    getSummary: async () => (await http.get('/product-stocks/summary/')).data
  },
  { updateMethod: 'patch' }
)

export async function listProductStocks(params: {
  page: number
  page_size: number
  search?: string
  product?: number
  status?: string
  batch_number?: string
}) {
  return productStockApi.list(params)
}

export async function updateProductStock(id: number, input: Partial<ProductStock>) {
  return productStockApi.update(id, input)
}

export async function adjustProductStock(id: number, input: { adjust_type: 'add' | 'subtract' | 'set'; quantity: number; reason: string }) {
  return productStockApi.adjust(id, input)
}

export async function getLowStockProductStocks() {
  return productStockApi.getLowStock()
}

export async function getProductStockSummary() {
  return productStockApi.getSummary()
}
