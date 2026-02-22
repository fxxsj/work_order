import { http } from '../lib/http'
import type { PaginatedResult } from './workorders'

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

export async function listTasks(params: {
  page: number
  page_size: number
  search?: string
  ordering?: string
}) {
  const res = await http.get<PaginatedResult<WorkOrderTaskListItem>>('/workorder-tasks/', { params })
  return res.data
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
  const res = await http.get<OperatorCenterResponse>('/workorder-tasks/operator_center/')
  return res.data
}

export async function claimTask(taskId: number, notes?: string) {
  const res = await http.post(`/workorder-tasks/${taskId}/claim/`, { notes: notes || '' })
  return res.data
}

export async function updateTaskQuantity(input: {
  taskId: number
  version?: number
  quantity_increment: number
  quantity_defective?: number
  notes?: string
}) {
  const res = await http.post(`/workorder-tasks/${input.taskId}/update_quantity/`, {
    version: input.version,
    quantity_increment: input.quantity_increment,
    quantity_defective: input.quantity_defective || 0,
    notes: input.notes || ''
  })
  return res.data
}

export async function completeTask(input: {
  taskId: number
  version?: number
  completion_reason?: string
  quantity_defective?: number
  notes?: string
}) {
  const res = await http.post(`/workorder-tasks/${input.taskId}/complete/`, {
    version: input.version,
    completion_reason: input.completion_reason || '',
    quantity_defective: input.quantity_defective || 0,
    notes: input.notes || ''
  })
  return res.data
}
