import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

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

export async function listQualityInspections(params: {
  page: number
  page_size: number
  search?: string
  type?: string
  result?: string
  start_date?: string
  end_date?: string
}) {
  const res = await http.get<PaginatedResult<QualityInspection>>('/quality-inspections/', { params })
  return res.data
}

export async function getQualityInspection(id: number) {
  const res = await http.get<QualityInspection>(`/quality-inspections/${id}/`)
  return res.data
}

export async function createQualityInspection(input: Partial<QualityInspection>) {
  const res = await http.post<QualityInspection>('/quality-inspections/', input)
  return res.data
}

export async function updateQualityInspection(id: number, input: Partial<QualityInspection>) {
  const res = await http.patch<QualityInspection>(`/quality-inspections/${id}/`, input)
  return res.data
}

export async function deleteQualityInspection(id: number) {
  const res = await http.delete(`/quality-inspections/${id}/`)
  return res.data
}

export async function completeQualityInspection(
  id: number,
  input: { result: QualityInspectionResult; passed_quantity: number; failed_quantity: number }
) {
  const res = await http.post(`/quality-inspections/${id}/complete/`, input)
  return res.data
}

export async function getQualityInspectionSummary() {
  const res = await http.get('/quality-inspections/summary/')
  return res.data
}

