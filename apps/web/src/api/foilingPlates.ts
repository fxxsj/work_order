import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type FoilingPlate = {
  id: number
  code?: string
  name: string
  foiling_type?: 'gold' | 'silver'
  size?: string
  material?: string
  thickness?: string
  confirmed?: boolean
  confirmed_by_name?: string | null
  confirmed_at?: string | null
  notes?: string
  created_at?: string
  updated_at?: string
}

export async function listFoilingPlates(params: { page: number; page_size: number; search?: string }) {
  const res = await http.get<PaginatedResult<FoilingPlate>>('/foiling-plates/', { params })
  return res.data
}

export async function createFoilingPlate(input: Partial<FoilingPlate>) {
  const res = await http.post<FoilingPlate>('/foiling-plates/', input)
  return res.data
}

export async function updateFoilingPlate(id: number, input: Partial<FoilingPlate>) {
  const res = await http.put<FoilingPlate>(`/foiling-plates/${id}/`, input)
  return res.data
}

export async function deleteFoilingPlate(id: number) {
  const res = await http.delete(`/foiling-plates/${id}/`)
  return res.data
}

export async function confirmFoilingPlate(id: number) {
  const res = await http.post<FoilingPlate>(`/foiling-plates/${id}/confirm/`)
  return res.data
}

