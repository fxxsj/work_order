import { http } from '../lib/http'
import { createApiWithActions } from './base'

export type { PaginatedResult } from './base'

export type Statement = {
  id: number
  statement_number: string
  statement_type: 'customer' | 'supplier'
  statement_type_display?: string
  customer?: number | null
  customer_name?: string | null
  supplier?: number | null
  supplier_name?: string | null
  partner_name?: string | null
  period: string
  start_date: string
  end_date: string
  opening_balance: string | number
  total_debit: string | number
  total_credit: string | number
  closing_balance: string | number
  status: 'draft' | 'sent' | 'confirmed' | 'disputed'
  status_display?: string
  confirmed_by?: number | null
  confirmed_by_name?: string | null
  confirmed_at?: string | null
  confirmation_notes?: string
  notes?: string
  created_by?: number | null
  created_by_name?: string | null
  created_at?: string
}

export type StatementGenerateResult = {
  statement_type: 'customer' | 'supplier'
  period: string
  start_date: string
  end_date: string
  opening_balance: string | number
  total_debit: string | number
  total_credit: string | number
  closing_balance: string | number
}

export const statementApi = createApiWithActions<Statement, any>('statements', {
  generate: async (params: { period: string; customer?: number; supplier?: number }) =>
    (await http.get<StatementGenerateResult>('/statements/generate/', { params })).data,
  confirm: async (id: number, input: { confirmed?: boolean; confirm_notes?: string }) =>
    (await http.post(`/statements/${id}/confirm/`, input)).data
})

