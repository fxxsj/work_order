import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

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

export const customerApi = createCrudApi<Customer>('customers')

export async function listCustomers(params: { page: number; page_size: number; search?: string }) {
  return customerApi.list(params)
}

export async function createCustomer(input: Partial<Customer>) {
  return customerApi.create(input)
}

export async function updateCustomer(id: number, input: Partial<Customer>) {
  return customerApi.update(id, input)
}

export async function deleteCustomer(id: number) {
  return customerApi.delete(id)
}
