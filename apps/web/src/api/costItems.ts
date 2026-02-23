import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

export type CostItem = {
  id: number
  name: string
  code: string
  type: 'material' | 'labor' | 'equipment' | 'overhead'
  allocation_method: 'direct' | 'labor_hours' | 'machine_hours' | 'quantity' | 'value'
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export const costItemApi = createCrudApi<CostItem>('cost-items')

export async function createCostItem(input: Partial<CostItem>) {
  return costItemApi.create(input)
}

export async function updateCostItem(id: number, input: Partial<CostItem>) {
  return costItemApi.update(id, input)
}

export async function deleteCostItem(id: number) {
  return costItemApi.delete(id)
}

