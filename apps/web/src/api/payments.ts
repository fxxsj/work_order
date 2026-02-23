import { createCrudApi } from './base'

export type { PaginatedResult } from './base'

export type PaymentMethod = 'cash' | 'transfer' | 'check' | 'acceptance'

export type Payment = {
  id: number
  payment_number: string
  sales_order?: number | null
  sales_order_number?: string | null
  invoice?: number | null
  invoice_number?: string | null
  customer: number
  customer_name?: string
  amount: string | number
  payment_method: PaymentMethod
  payment_method_display?: string
  payment_date?: string
  bank_account?: string
  transaction_number?: string
  applied_amount?: string | number
  remaining_amount?: string | number
  notes?: string
  recorded_by_name?: string | null
  created_at?: string
}

export const paymentApi = createCrudApi<Payment>('payments')

export async function listPayments(params: {
  page: number
  page_size: number
  search?: string
  customer?: number
  payment_method?: string
  start_date?: string
  end_date?: string
}) {
  return paymentApi.list(params)
}

export async function createPayment(input: Partial<Payment>) {
  return paymentApi.create(input)
}

export async function deletePayment(id: number) {
  return paymentApi.delete(id)
}
