import { http } from '../lib/http'
import { createApiWithActions } from './base'

export type { PaginatedResult } from './base'

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

export const foilingPlateApi = createApiWithActions(
  'foiling-plates',
  {
    confirm: async (id: number) => (await http.post<FoilingPlate>(`/foiling-plates/${id}/confirm/`)).data
  }
)

export async function listFoilingPlates(params: { page: number; page_size: number; search?: string }) {
  return foilingPlateApi.list(params)
}

export async function createFoilingPlate(input: Partial<FoilingPlate>) {
  return foilingPlateApi.create(input)
}

export async function updateFoilingPlate(id: number, input: Partial<FoilingPlate>) {
  return foilingPlateApi.update(id, input)
}

export async function deleteFoilingPlate(id: number) {
  return foilingPlateApi.delete(id)
}

export async function confirmFoilingPlate(id: number) {
  return foilingPlateApi.confirm(id)
}
