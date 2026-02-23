import { http } from '../lib/http'
import { createApiWithActions, createCrudApi } from './base'

export type { PaginatedResult } from './base'

export type WorkOrderListItem = {
  id: number
  order_number: string
  customer_name: string
  product_name: string | null
  quantity: number
  unit: string
  status_display: string
  priority_display: string
  delivery_date: string | null
  progress_percentage: number
}

export const workOrderListApi = createCrudApi<WorkOrderListItem>('workorders')

export async function listWorkOrders(params: {
  page: number
  page_size: number
  search?: string
  ordering?: string
  status?: string
  priority?: string
}) {
  return workOrderListApi.list(params)
}

export type WorkOrderDetail = Record<string, any>

export const workOrderApi = createApiWithActions(
  'workorders',
  {
    updateStatus: async (id: number, status: string) => (await http.post(`/workorders/${id}/update_status/`, { status })).data,
    approve: async (input: {
      id: number
      approval_status: 'approved' | 'rejected'
      approval_comment?: string
      rejection_reason?: string
    }) =>
      (
        await http.post(`/workorders/${input.id}/approve/`, {
          approval_status: input.approval_status,
          approval_comment: input.approval_comment || '',
          rejection_reason: input.rejection_reason || ''
        })
      ).data
  }
)

export async function getWorkOrder(id: number) {
  return workOrderApi.retrieve(id)
}

export async function updateWorkOrderStatus(id: number, status: string) {
  return workOrderApi.updateStatus(id, status)
}

export async function approveWorkOrder(input: {
  id: number
  approval_status: 'approved' | 'rejected'
  approval_comment?: string
  rejection_reason?: string
}) {
  return workOrderApi.approve(input)
}

export async function createWorkOrder(input: {
  customer: number
  priority: 'low' | 'normal' | 'high' | 'urgent'
  delivery_date: string
  notes?: string
  products_data: Array<{
    product: number
    quantity: number
    unit: string
    specification?: string
    sort_order?: number
  }>
}) {
  return workOrderApi.create(input)
}
