import { http } from '../lib/http'

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'received' | 'cancelled' | 'refunded'
export type InvoiceType = 'vat_special' | 'vat_normal' | 'electronic'

export type Invoice = {
  id: number
  invoice_number: string
  invoice_code?: string
  invoice_type: InvoiceType
  invoice_type_display?: string
  status: InvoiceStatus
  status_display?: string
  sales_order?: number | null
  sales_order_number?: string | null
  work_order?: number | null
  work_order_number?: string | null
  customer: number
  customer_name?: string
  amount: string | number
  tax_rate: string | number
  tax_amount?: string | number
  total_amount?: string | number
  issue_date?: string | null
  customer_tax_number?: string
  customer_address?: string
  customer_phone?: string
  customer_bank?: string
  customer_account?: string
  notes?: string
  created_at?: string
  submitted_by_name?: string | null
  approved_by_name?: string | null
}

export async function listInvoices(params: {
  page: number
  page_size: number
  search?: string
  status?: string
  customer?: number
  start_date?: string
  end_date?: string
}) {
  const res = await http.get<PaginatedResult<Invoice>>('/invoices/', { params })
  return res.data
}

export async function getInvoice(id: number) {
  const res = await http.get<Invoice>(`/invoices/${id}/`)
  return res.data
}

export async function createInvoice(input: Partial<Invoice>) {
  const res = await http.post<Invoice>('/invoices/', input)
  return res.data
}

export async function updateInvoice(id: number, input: Partial<Invoice>) {
  const res = await http.patch<Invoice>(`/invoices/${id}/`, input)
  return res.data
}

export async function deleteInvoice(id: number) {
  const res = await http.delete(`/invoices/${id}/`)
  return res.data
}

export async function submitInvoice(id: number) {
  const res = await http.post(`/invoices/${id}/submit/`)
  return res.data
}

export async function approveInvoice(id: number, input: { approved: boolean; approval_comment?: string }) {
  const res = await http.post(`/invoices/${id}/approve/`, input)
  return res.data
}

