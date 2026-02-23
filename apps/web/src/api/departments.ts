import { http } from '../lib/http'

import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

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

export const departmentApi = createCrudApi<Department>('departments')

export async function listDepartments(params: { page: number; page_size: number; search?: string }) {
  return departmentApi.list(params)
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
  return departmentApi.create(input)
}

export async function updateDepartment(id: number, input: Partial<Department>) {
  return departmentApi.update(id, input)
}

export async function deleteDepartment(id: number) {
  return departmentApi.delete(id)
}
