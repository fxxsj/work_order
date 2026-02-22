import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Process = {
  id: number
  name: string
  code: string
  description?: string
  sort_order?: number
  standard_duration?: number
  is_active?: boolean
  is_builtin?: boolean
  is_parallel?: boolean
  task_generation_rule?: 'artwork' | 'die' | 'product' | 'material' | 'general'
  requires_artwork?: boolean
  requires_die?: boolean
  requires_foiling_plate?: boolean
  requires_embossing_plate?: boolean
  artwork_required?: boolean
  die_required?: boolean
  foiling_plate_required?: boolean
  embossing_plate_required?: boolean
}

export async function listProcesses(params: { page: number; page_size: number; search?: string }) {
  const res = await http.get<PaginatedResult<Process>>('/processes/', { params })
  return res.data
}

export async function listAllProcesses() {
  const res = await http.get<PaginatedResult<Process>>('/processes/', {
    params: { page: 1, page_size: 1000, ordering: 'sort_order,code' }
  })
  return res.data.results
}

export async function batchUpdateProcessesActive(input: { ids: number[]; is_active: boolean }) {
  const res = await http.post('/processes/batch_update_active/', input)
  return res.data
}

export async function createProcess(input: Partial<Process>) {
  const res = await http.post<Process>('/processes/', input)
  return res.data
}

export async function updateProcess(id: number, input: Partial<Process>) {
  const res = await http.put<Process>(`/processes/${id}/`, input)
  return res.data
}

export async function deleteProcess(id: number) {
  const res = await http.delete(`/processes/${id}/`)
  return res.data
}
