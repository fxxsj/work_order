import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

export type CostCenter = {
  id: number
  name: string
  code: string
  type: 'production' | 'auxiliary' | 'management' | 'sales'
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export const costCenterApi = createCrudApi<CostCenter>('cost-centers')

export async function createCostCenter(input: Partial<CostCenter>) {
  return costCenterApi.create(input)
}

export async function updateCostCenter(id: number, input: Partial<CostCenter>) {
  return costCenterApi.update(id, input)
}

export async function deleteCostCenter(id: number) {
  return costCenterApi.delete(id)
}

