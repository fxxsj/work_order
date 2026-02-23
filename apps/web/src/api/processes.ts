import { http } from '../lib/http'
import { createApiWithActions } from './base'
import type { PaginatedResult } from './base'

export type { PaginatedResult } from './base'

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

export const processApi = createApiWithActions(
  'processes',
  {
    listAll: async () => {
      const res = await http.get<PaginatedResult<Process>>('/processes/', {
        params: { page: 1, page_size: 1000, ordering: 'sort_order,code' }
      })
      return res.data.results
    },
    batchUpdateActive: async (input: { ids: number[]; is_active: boolean }) => {
      const res = await http.post('/processes/batch_update_active/', input)
      return res.data
    }
  }
)

export async function listProcesses(params: { page: number; page_size: number; search?: string }) {
  return processApi.list(params)
}

export async function listAllProcesses() {
  return processApi.listAll()
}

export async function batchUpdateProcessesActive(input: { ids: number[]; is_active: boolean }) {
  return processApi.batchUpdateActive(input)
}

export async function createProcess(input: Partial<Process>) {
  return processApi.create(input)
}

export async function updateProcess(id: number, input: Partial<Process>) {
  return processApi.update(id, input)
}

export async function deleteProcess(id: number) {
  return processApi.delete(id)
}
