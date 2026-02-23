import { http } from '../lib/http'
import { createApiWithActions } from './base'

export type { PaginatedResult } from './base'

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

export const embossingPlateApi = createApiWithActions(
  'embossing-plates',
  {
    confirm: async (id: number) => (await http.post<EmbossingPlate>(`/embossing-plates/${id}/confirm/`)).data
  }
)

export async function listEmbossingPlates(params: { page: number; page_size: number; search?: string }) {
  return embossingPlateApi.list(params)
}

export async function createEmbossingPlate(input: Partial<EmbossingPlate>) {
  return embossingPlateApi.create(input)
}

export async function updateEmbossingPlate(id: number, input: Partial<EmbossingPlate>) {
  return embossingPlateApi.update(id, input)
}

export async function deleteEmbossingPlate(id: number) {
  return embossingPlateApi.delete(id)
}

export async function confirmEmbossingPlate(id: number) {
  return embossingPlateApi.confirm(id)
}
