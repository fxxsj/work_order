import { http } from '../lib/http'
import { createApiWithActions } from './base'

export type { PaginatedResult } from './base'

export type Artwork = {
  id: number
  base_code?: string | null
  version?: number
  code?: string
  name: string
  cmyk_colors?: string[]
  other_colors?: string[]
  color_display?: string
  imposition_size?: string
  confirmed?: boolean
  confirmed_by_name?: string | null
  confirmed_at?: string | null
  notes?: string
  created_at?: string
  updated_at?: string
  die_codes?: string[]
  die_names?: string[]
  foiling_plate_codes?: string[]
  foiling_plate_names?: string[]
  embossing_plate_codes?: string[]
  embossing_plate_names?: string[]
}

export const artworkApi = createApiWithActions(
  'artworks',
  {
    confirm: async (id: number) => (await http.post<Artwork>(`/artworks/${id}/confirm/`)).data,
    createVersion: async (id: number) => (await http.post<Artwork>(`/artworks/${id}/create_version/`)).data
  }
)

export async function listArtworks(params: { page: number; page_size: number; search?: string; base_code?: string; version?: number }) {
  return artworkApi.list(params)
}

export async function createArtwork(input: Partial<Artwork>) {
  return artworkApi.create(input)
}

export async function updateArtwork(id: number, input: Partial<Artwork>) {
  return artworkApi.update(id, input)
}

export async function deleteArtwork(id: number) {
  return artworkApi.delete(id)
}

export async function confirmArtwork(id: number) {
  return artworkApi.confirm(id)
}

export async function createArtworkVersion(id: number) {
  return artworkApi.createVersion(id)
}
