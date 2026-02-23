import { http } from '../lib/http'
import { createApiWithActions } from './base'
import type { PaginatedResult } from './base'

export type { PaginatedResult } from './base'

export type QualityInspectionType = 'incoming' | 'process' | 'final' | 'customer'
export type QualityInspectionResult = 'pending' | 'passed' | 'failed' | 'conditional'

export type QualityInspection = {
  id: number
  inspection_number: string
  inspection_type: QualityInspectionType
  inspection_type_display?: string
  work_order?: number | null
  work_order_number?: string | null
  product?: number | null
  product_name?: string | null
  batch_no?: string
  inspection_date?: string
  inspector?: number | null
  inspector_name?: string | null
  result: QualityInspectionResult
  result_display?: string
  inspection_quantity?: number
  passed_quantity?: number
  failed_quantity?: number
  defective_rate?: string | number
  defective_rate_formatted?: string
  inspection_standard?: string
  inspection_items?: any[]
  defects?: any[]
  defect_description?: string
  disposition?: 'accept' | 'rework' | 'scrap' | 'return' | ''
  disposition_notes?: string
  notes?: string
  created_at?: string
}

export const qualityInspectionApi = createApiWithActions(
  'quality-inspections',
  {
    complete: async (id: number, input: { result: QualityInspectionResult; passed_quantity: number; failed_quantity: number }) =>
      (await http.post(`/quality-inspections/${id}/complete/`, input)).data,
    getSummary: async () => (await http.get('/quality-inspections/summary/')).data
  },
  { updateMethod: 'patch' }
)

export async function listQualityInspections(params: {
  page: number
  page_size: number
  search?: string
  type?: string
  result?: string
  start_date?: string
  end_date?: string
}) {
  return qualityInspectionApi.list(params)
}

export async function getQualityInspection(id: number) {
  return qualityInspectionApi.retrieve(id)
}

export async function createQualityInspection(input: Partial<QualityInspection>) {
  return qualityInspectionApi.create(input)
}

export async function updateQualityInspection(id: number, input: Partial<QualityInspection>) {
  return qualityInspectionApi.update(id, input)
}

export async function deleteQualityInspection(id: number) {
  return qualityInspectionApi.delete(id)
}

export async function completeQualityInspection(
  id: number,
  input: { result: QualityInspectionResult; passed_quantity: number; failed_quantity: number }
) {
  return qualityInspectionApi.complete(id, input)
}

export async function getQualityInspectionSummary() {
  return qualityInspectionApi.getSummary()
}
