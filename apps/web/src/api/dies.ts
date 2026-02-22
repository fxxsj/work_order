import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Die = {
  id: number
  code?: string
  name: string
  die_type?: string
  die_type_display?: string
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

export async function listDies(params: { page: number; page_size: number; search?: string; confirmed?: boolean }) {
  const res = await http.get<PaginatedResult<Die>>('/dies/', { params })
  return res.data
}

export async function createDie(input: Partial<Die>) {
  const res = await http.post<Die>('/dies/', input)
  return res.data
}

export async function updateDie(id: number, input: Partial<Die>) {
  const res = await http.put<Die>(`/dies/${id}/`, input)
  return res.data
}

export async function deleteDie(id: number) {
  const res = await http.delete(`/dies/${id}/`)
  return res.data
}

export async function confirmDie(id: number) {
  const res = await http.post<Die>(`/dies/${id}/confirm/`)
  return res.data
}

