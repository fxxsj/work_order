import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type EmbossingPlate = {
  id: number
  code?: string
  name: string
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

export async function listEmbossingPlates(params: { page: number; page_size: number; search?: string }) {
  const res = await http.get<PaginatedResult<EmbossingPlate>>('/embossing-plates/', { params })
  return res.data
}

export async function createEmbossingPlate(input: Partial<EmbossingPlate>) {
  const res = await http.post<EmbossingPlate>('/embossing-plates/', input)
  return res.data
}

export async function updateEmbossingPlate(id: number, input: Partial<EmbossingPlate>) {
  const res = await http.put<EmbossingPlate>(`/embossing-plates/${id}/`, input)
  return res.data
}

export async function deleteEmbossingPlate(id: number) {
  const res = await http.delete(`/embossing-plates/${id}/`)
  return res.data
}

export async function confirmEmbossingPlate(id: number) {
  const res = await http.post<EmbossingPlate>(`/embossing-plates/${id}/confirm/`)
  return res.data
}

