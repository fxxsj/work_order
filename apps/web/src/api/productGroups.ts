import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ProductGroupItem = {
  id: number
  product_group: number
  product: number
  product_name?: string
  product_code?: string
  item_name: string
  sort_order?: number
}

export type ProductGroup = {
  id: number
  name: string
  code: string
  description?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  items?: ProductGroupItem[]
}

export async function listProductGroups(params: { page: number; page_size: number; search?: string; is_active?: boolean }) {
  const res = await http.get<PaginatedResult<ProductGroup>>('/product-groups/', { params })
  return res.data
}

export async function getProductGroup(id: number) {
  const res = await http.get<ProductGroup>(`/product-groups/${id}/`)
  return res.data
}

export async function createProductGroup(input: Partial<ProductGroup> & { items_write?: any[] }) {
  const res = await http.post<ProductGroup>('/product-groups/', input)
  return res.data
}

export async function updateProductGroup(id: number, input: Partial<ProductGroup> & { items_write?: any[] }) {
  const res = await http.put<ProductGroup>(`/product-groups/${id}/`, input)
  return res.data
}

export async function deleteProductGroup(id: number) {
  const res = await http.delete(`/product-groups/${id}/`)
  return res.data
}

