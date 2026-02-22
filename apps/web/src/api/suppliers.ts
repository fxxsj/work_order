import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

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

export async function listSuppliers(params: { page: number; search?: string; status?: string }) {
  const res = await http.get<PaginatedResult<Supplier>>('/suppliers/', { params })
  return res.data
}

export async function getSupplier(id: number) {
  const res = await http.get<Supplier>(`/suppliers/${id}/`)
  return res.data
}

export async function createSupplier(input: Partial<Supplier>) {
  const res = await http.post<Supplier>('/suppliers/', input)
  return res.data
}

export async function updateSupplier(id: number, input: Partial<Supplier>) {
  const res = await http.put<Supplier>(`/suppliers/${id}/`, input)
  return res.data
}

export async function deleteSupplier(id: number) {
  const res = await http.delete(`/suppliers/${id}/`)
  return res.data
}

