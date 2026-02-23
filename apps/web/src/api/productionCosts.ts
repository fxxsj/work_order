import { http } from '../lib/http'
import { createApiWithActions, createCrudApi } from './base'

export type { PaginatedResult } from './base'

export type ProductionCost = {
  id: number
  work_order: number
  work_order_number?: string
  customer_name?: string | null
  period: string
  material_cost: string | number
  labor_cost: string | number
  equipment_cost: string | number
  overhead_cost: string | number
  total_cost: string | number
  standard_cost: string | number
  variance: string | number
  variance_rate: string | number
  variance_rate_formatted?: string
  calculated_at?: string | null
  calculated_by?: number | null
  calculated_by_name?: string | null
  notes?: string
}

export const productionCostApi = createApiWithActions<ProductionCost, any>(
  'production-costs',
  {
    calculateMaterial: async (id: number) => (await http.post(`/production-costs/${id}/calculate_material/`)).data,
    calculateTotal: async (id: number) => (await http.post(`/production-costs/${id}/calculate_total/`)).data
  },
  { updateMethod: 'patch' }
)

export const productionCostListApi = createCrudApi<ProductionCost>('production-costs')

