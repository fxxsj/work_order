import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

export type MaterialSupplier = {
  id: number
  material: number
  supplier: number
  supplier_code?: string
  supplier_price: string | number
  is_preferred?: boolean
  min_order_quantity?: string | number
  lead_time_days?: number
  notes?: string
  created_at?: string
}

export const materialSupplierApi = createCrudApi<MaterialSupplier>('material-suppliers')

export async function listMaterialSuppliers(params: {
  page: number
  page_size: number
  material?: number
  supplier?: number
  is_preferred?: boolean
}) {
  return materialSupplierApi.list(params)
}

export async function createMaterialSupplier(input: Partial<MaterialSupplier>) {
  return materialSupplierApi.create(input)
}

export async function updateMaterialSupplier(id: number, input: Partial<MaterialSupplier>) {
  return materialSupplierApi.update(id, input)
}

export async function deleteMaterialSupplier(id: number) {
  return materialSupplierApi.delete(id)
}
