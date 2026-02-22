import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Department = {
  id: number
  name: string
  code: string
  parent?: number | null
  parent_name?: string | null
  sort_order?: number
  is_active?: boolean
  processes?: number[]
  process_names?: string[]
  children_count?: number
  level?: number
}

export async function listDepartments(params: { page: number; page_size: number; search?: string }) {
  const res = await http.get<PaginatedResult<Department>>('/departments/', { params })
  return res.data
}

export async function listAllDepartments(params?: { is_active?: boolean }) {
  const res = await http.get<Department[]>('/departments/all/', { params })
  return res.data
}

export async function getDepartmentTree() {
  const res = await http.get<Department[]>('/departments/tree/')
  return res.data
}

export async function createDepartment(input: Partial<Department>) {
  const res = await http.post<Department>('/departments/', input)
  return res.data
}

export async function updateDepartment(id: number, input: Partial<Department>) {
  const res = await http.put<Department>(`/departments/${id}/`, input)
  return res.data
}

export async function deleteDepartment(id: number) {
  const res = await http.delete(`/departments/${id}/`)
  return res.data
}
