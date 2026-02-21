import { http } from '../lib/http'
import type { PaginatedResult } from './workorders'

export type WorkOrderTaskListItem = {
  id: number
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

