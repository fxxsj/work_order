import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

export type Material = {
  id: number
  name: string
  code: string
  specification?: string
  unit?: string
  unit_price?: string | number
  stock_quantity?: string | number
  min_stock_quantity?: string | number
  default_supplier?: number | null
  lead_time_days?: number
  need_cutting?: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

export const materialApi = createCrudApi<Material>('materials')

export async function listMaterials(params: { page: number; page_size: number; search?: string }) {
  return materialApi.list(params)
}

export async function getMaterial(id: number) {
  return materialApi.retrieve(id)
}

export async function createMaterial(input: Partial<Material>) {
  return materialApi.create(input)
}

export async function updateMaterial(id: number, input: Partial<Material>) {
  return materialApi.update(id, input)
}

export async function deleteMaterial(id: number) {
  return materialApi.delete(id)
}
