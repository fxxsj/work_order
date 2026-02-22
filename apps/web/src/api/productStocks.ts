import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

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

export async function listProductStocks(params: {
  page: number
  page_size: number
  search?: string
  product?: number
  status?: string
  batch_number?: string
}) {
  const res = await http.get<PaginatedResult<ProductStock>>('/product-stocks/', { params })
  return res.data
}

export async function updateProductStock(id: number, input: Partial<ProductStock>) {
  const res = await http.patch<ProductStock>(`/product-stocks/${id}/`, input)
  return res.data
}

export async function adjustProductStock(id: number, input: { adjust_type: 'add' | 'subtract' | 'set'; quantity: number; reason: string }) {
  const res = await http.post(`/product-stocks/${id}/adjust/`, input)
  return res.data
}

export async function getLowStockProductStocks() {
  const res = await http.get('/product-stocks/low_stock/')
  return res.data
}

export async function getProductStockSummary() {
  const res = await http.get('/product-stocks/summary/')
  return res.data
}

