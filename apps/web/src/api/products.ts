import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Product = {
  id: number
  name: string
  code: string
  specification?: string
  unit?: string
  unit_price?: string | number
  is_active?: boolean
  description?: string
}

export async function listProducts(params: { page: number; page_size: number; search?: string }) {
  const res = await http.get<PaginatedResult<Product>>('/products/', { params })
  return res.data
}

export async function createProduct(input: Partial<Product>) {
  const res = await http.post<Product>('/products/', input)
  return res.data
}

export async function updateProduct(id: number, input: Partial<Product>) {
  const res = await http.put<Product>(`/products/${id}/`, input)
  return res.data
}

export async function deleteProduct(id: number) {
  const res = await http.delete(`/products/${id}/`)
  return res.data
}

