import { http } from '../lib/http'
import { createApiWithActions } from './base'

export type { PaginatedResult } from './base'

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

export const dieApi = createApiWithActions(
  'dies',
  {
    confirm: async (id: number) => (await http.post<Die>(`/dies/${id}/confirm/`)).data
  }
)

export async function listDies(params: { page: number; page_size: number; search?: string; confirmed?: boolean }) {
  return dieApi.list(params)
}

export async function createDie(input: Partial<Die>) {
  return dieApi.create(input)
}

export async function updateDie(id: number, input: Partial<Die>) {
  return dieApi.update(id, input)
}

export async function deleteDie(id: number) {
  return dieApi.delete(id)
}

export async function confirmDie(id: number) {
  return dieApi.confirm(id)
}
