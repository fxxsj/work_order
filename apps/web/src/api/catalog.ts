import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type CustomerOption = { id: number; name: string }
export type ProductOption = { id: number; name: string; code?: string }

export async function listCustomers(params: { page?: number; page_size?: number; search?: string }) {
  const res = await http.get<PaginatedResult<CustomerOption>>('/customers/', {
    params: { page: params.page || 1, page_size: params.page_size || 50, search: params.search }
  })
  return res.data
}

export async function listProducts(params: { page?: number; page_size?: number; search?: string }) {
  const res = await http.get<PaginatedResult<ProductOption>>('/products/', {
    params: { page: params.page || 1, page_size: params.page_size || 50, search: params.search }
  })
  return res.data
}

