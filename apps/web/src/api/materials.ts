import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

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

export async function listMaterials(params: { page: number; page_size: number; search?: string }) {
  const res = await http.get<PaginatedResult<Material>>('/materials/', { params })
  return res.data
}

export async function getMaterial(id: number) {
  const res = await http.get<Material>(`/materials/${id}/`)
  return res.data
}

export async function createMaterial(input: Partial<Material>) {
  const res = await http.post<Material>('/materials/', input)
  return res.data
}

export async function updateMaterial(id: number, input: Partial<Material>) {
  const res = await http.put<Material>(`/materials/${id}/`, input)
  return res.data
}

export async function deleteMaterial(id: number) {
  const res = await http.delete(`/materials/${id}/`)
  return res.data
}
