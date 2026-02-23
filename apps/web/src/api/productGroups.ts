import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

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

export const productGroupApi = createCrudApi<ProductGroup>('product-groups')

export async function listProductGroups(params: { page: number; page_size: number; search?: string; is_active?: boolean }) {
  return productGroupApi.list(params)
}

export async function getProductGroup(id: number) {
  return productGroupApi.retrieve(id)
}

export async function createProductGroup(input: Partial<ProductGroup> & { items_write?: any[] }) {
  return productGroupApi.create(input)
}

export async function updateProductGroup(id: number, input: Partial<ProductGroup> & { items_write?: any[] }) {
  return productGroupApi.update(id, input)
}

export async function deleteProductGroup(id: number) {
  return productGroupApi.delete(id)
}
