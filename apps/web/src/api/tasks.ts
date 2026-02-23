import { http } from '../lib/http'
import { createApiWithActions } from './base'
import type { PaginatedResult } from './base'

export type WorkOrderTaskListItem = {
  id: number
  version?: number
  status: string
  status_display: string
  task_type: string
  task_type_display: string
  work_content: string
  production_quantity: number | null
  quantity_completed: number | null
  assigned_department_name: string | null
  assigned_operator_name: string | null
  work_order_process_info?: {
    process?: { name?: string }
    work_order?: { order_number?: string; delivery_date?: string | null }
  } | null
  created_at: string
}

export const taskApi = createApiWithActions(
  'workorder-tasks',
  {
    getOperatorCenter: async () => (await http.get<OperatorCenterResponse>('/workorder-tasks/operator_center/')).data,
    claim: async (taskId: number, notes?: string) => (await http.post(`/workorder-tasks/${taskId}/claim/`, { notes: notes || '' })).data,
    updateQuantity: async (input: {
      taskId: number
      version?: number
      quantity_increment: number
      quantity_defective?: number
      notes?: string
    }) =>
      (
        await http.post(`/workorder-tasks/${input.taskId}/update_quantity/`, {
          version: input.version,
          quantity_increment: input.quantity_increment,
          quantity_defective: input.quantity_defective || 0,
          notes: input.notes || ''
        })
      ).data,
    complete: async (input: {
      taskId: number
      version?: number
      completion_reason?: string
      quantity_defective?: number
      notes?: string
    }) =>
      (
        await http.post(`/workorder-tasks/${input.taskId}/complete/`, {
          version: input.version,
          completion_reason: input.completion_reason || '',
          quantity_defective: input.quantity_defective || 0,
          notes: input.notes || ''
        })
      ).data
  }
)

export async function listTasks(params: {
  page: number
  page_size: number
  search?: string
  ordering?: string
}) {
  return taskApi.list(params)
}

export type OperatorCenterResponse = {
  my_tasks: WorkOrderTaskListItem[]
  claimable_tasks: WorkOrderTaskListItem[]
  summary: {
    my_total: number
    my_pending: number
    my_in_progress: number
    my_completed?: number
    claimable_count: number
  }
}

export async function getOperatorCenter() {
  return taskApi.getOperatorCenter()
}

export async function claimTask(taskId: number, notes?: string) {
  return taskApi.claim(taskId, notes)
}

export async function updateTaskQuantity(input: {
  taskId: number
  version?: number
  quantity_increment: number
  quantity_defective?: number
  notes?: string
}) {
  return taskApi.updateQuantity(input)
}

export async function completeTask(input: {
  taskId: number
  version?: number
  completion_reason?: string
  quantity_defective?: number
  notes?: string
}) {
  return taskApi.complete(input)
}
