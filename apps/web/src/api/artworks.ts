import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

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

export async function listArtworks(params: { page: number; page_size: number; search?: string; base_code?: string; version?: number }) {
  const res = await http.get<PaginatedResult<Artwork>>('/artworks/', { params })
  return res.data
}

export async function createArtwork(input: Partial<Artwork>) {
  const res = await http.post<Artwork>('/artworks/', input)
  return res.data
}

export async function updateArtwork(id: number, input: Partial<Artwork>) {
  const res = await http.put<Artwork>(`/artworks/${id}/`, input)
  return res.data
}

export async function deleteArtwork(id: number) {
  const res = await http.delete(`/artworks/${id}/`)
  return res.data
}

export async function confirmArtwork(id: number) {
  const res = await http.post<Artwork>(`/artworks/${id}/confirm/`)
  return res.data
}

export async function createArtworkVersion(id: number) {
  const res = await http.post<Artwork>(`/artworks/${id}/create_version/`)
  return res.data
}

