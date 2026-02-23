import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

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

export const productApi = createCrudApi<Product>('products')

export async function listProducts(params: { page: number; page_size: number; search?: string }) {
  return productApi.list(params)
}

export async function createProduct(input: Partial<Product>) {
  return productApi.create(input)
}

export async function updateProduct(id: number, input: Partial<Product>) {
  return productApi.update(id, input)
}

export async function deleteProduct(id: number) {
  return productApi.delete(id)
}
