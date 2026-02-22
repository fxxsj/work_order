import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

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

export async function listMaterialSuppliers(params: {
  page: number
  page_size: number
  material?: number
  supplier?: number
  is_preferred?: boolean
}) {
  const res = await http.get<PaginatedResult<MaterialSupplier>>('/material-suppliers/', { params })
  return res.data
}

export async function createMaterialSupplier(input: Partial<MaterialSupplier>) {
  const res = await http.post<MaterialSupplier>('/material-suppliers/', input)
  return res.data
}

export async function updateMaterialSupplier(id: number, input: Partial<MaterialSupplier>) {
  const res = await http.put<MaterialSupplier>(`/material-suppliers/${id}/`, input)
  return res.data
}

export async function deleteMaterialSupplier(id: number) {
  const res = await http.delete(`/material-suppliers/${id}/`)
  return res.data
}

