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

export async function exportTasks(params?: { search?: string; ordering?: string; filename?: string }) {
  return http.get('/workorder-tasks/export/', { params, responseType: 'blob' })
}

export type AssignmentHistoryItem = {
  id?: number
  log_type?: string
  content?: string
  created_at?: string
  operator_name?: string
  task_info?: {
    id: number
    work_content: string
    assigned_department?: string | null
    assigned_operator?: string | null
  }
  work_order_info?: {
    id: number
    order_number: string
    customer_name?: string | null
  }
}

export type AssignmentHistoryResponse = {
  results: AssignmentHistoryItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export async function getAssignmentHistory(params: {
  page: number
  page_size: number
  task_id?: number | string
  department_id?: number | string
  operator_id?: number | string
  start_date?: string
  end_date?: string
}) {
  const res = await http.get<AssignmentHistoryResponse>('/workorder-tasks/assignment_history/', { params })
  return res.data
}

export async function batchCompleteTasks(input: {
  task_ids: number[]
  completion_reason?: string
  notes?: string
}) {
  return (
    await http.post('/workorder-tasks/batch_complete/', {
      task_ids: input.task_ids,
      completion_reason: input.completion_reason || '',
      notes: input.notes || ''
    })
  ).data
}

export async function batchCancelTasks(input: {
  task_ids: number[]
  cancellation_reason: string
  notes?: string
}) {
  return (
    await http.post('/workorder-tasks/batch_cancel/', {
      task_ids: input.task_ids,
      cancellation_reason: input.cancellation_reason,
      notes: input.notes || ''
    })
  ).data
}

export async function batchAssignTasks(input: {
  task_ids: number[]
  assigned_department?: number | null
  assigned_operator?: number | null
  reason?: string
  notes?: string
}) {
  return (
    await http.post('/workorder-tasks/batch_assign/', {
      task_ids: input.task_ids,
      assigned_department: input.assigned_department || null,
      assigned_operator: input.assigned_operator || null,
      reason: input.reason || '',
      notes: input.notes || ''
    })
  ).data
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
