import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

export type Supplier = {
  id: number
  name: string
  code: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  status?: 'active' | 'inactive'
  status_display?: string
  material_count?: number
  notes?: string
  created_at?: string
  updated_at?: string
}

export const supplierApi = createCrudApi<Supplier>('suppliers')

export async function listSuppliers(params: { page: number; search?: string; status?: string }) {
  return supplierApi.list(params)
}

export async function getSupplier(id: number) {
  return supplierApi.retrieve(id)
}

export async function createSupplier(input: Partial<Supplier>) {
  return supplierApi.create(input)
}

export async function updateSupplier(id: number, input: Partial<Supplier>) {
  return supplierApi.update(id, input)
}

export async function deleteSupplier(id: number) {
  return supplierApi.delete(id)
}
