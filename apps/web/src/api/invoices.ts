import { http } from '../lib/http'
import { createApiWithActions } from './base'

export type { PaginatedResult } from './base'

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

export const invoiceApi = createApiWithActions(
  'invoices',
  {
    submit: async (id: number) => {
      const res = await http.post(`/invoices/${id}/submit/`)
      return res.data
    },
    approve: async (id: number, input: { approved: boolean; approval_comment?: string }) => {
      const res = await http.post(`/invoices/${id}/approve/`, input)
      return res.data
    }
  },
  { updateMethod: 'patch' }
)

export async function listInvoices(params: {
  page: number
  page_size: number
  search?: string
  status?: string
  customer?: number
  start_date?: string
  end_date?: string
}) {
  return invoiceApi.list(params)
}

export async function getInvoice(id: number) {
  return invoiceApi.retrieve(id)
}

export async function createInvoice(input: Partial<Invoice>) {
  return invoiceApi.create(input)
}

export async function updateInvoice(id: number, input: Partial<Invoice>) {
  return invoiceApi.update(id, input)
}

export async function deleteInvoice(id: number) {
  return invoiceApi.delete(id)
}

export async function submitInvoice(id: number) {
  return invoiceApi.submit(id)
}

export async function approveInvoice(id: number, input: { approved: boolean; approval_comment?: string }) {
  return invoiceApi.approve(id, input)
}
