import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

export type CustomerOption = { id: number; name: string }
export type ProductOption = { id: number; name: string; code?: string }

export const catalogCustomerApi = createCrudApi<CustomerOption>('customers')
export const catalogProductApi = createCrudApi<ProductOption>('products')

export async function listCustomers(params: { page?: number; page_size?: number; search?: string }) {
  return catalogCustomerApi.list({
    page: params.page || 1,
    page_size: params.page_size || 50,
    search: params.search
  })
}

export async function listProducts(params: { page?: number; page_size?: number; search?: string }) {
  return catalogProductApi.list({
    page: params.page || 1,
    page_size: params.page_size || 50,
    search: params.search
  })
}
