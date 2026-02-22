import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Customer = {
  id: number
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export async function listCustomers(params: { page: number; page_size: number; search?: string }) {
  const res = await http.get<PaginatedResult<Customer>>('/customers/', { params })
  return res.data
}

export async function createCustomer(input: Partial<Customer>) {
  const res = await http.post<Customer>('/customers/', input)
  return res.data
}

export async function updateCustomer(id: number, input: Partial<Customer>) {
  const res = await http.put<Customer>(`/customers/${id}/`, input)
  return res.data
}

export async function deleteCustomer(id: number) {
  const res = await http.delete(`/customers/${id}/`)
  return res.data
}

