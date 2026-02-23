import { http } from '../lib/http'
import { createApiWithActions } from './base'

export type ApprovalStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'
export type ApprovalStepDecision = 'approve' | 'reject' | 'escalate'

export type ApprovalStep = {
  id: number
  work_order: number
  work_order_number?: string
  workflow: number
  workflow_name?: string
  step_name: string
  step_order: number
  assigned_to?: number | null
  assigned_to_name?: string | null
  status: ApprovalStepStatus
  decision?: ApprovalStepDecision | ''
  comments?: string
  started_at?: string | null
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export const approvalStepApi = createApiWithActions('approval-steps', {
  start: async (id: number) => (await http.post(`/approval-steps/${id}/start_step/`, {})).data,
  complete: async (id: number, input: { decision: ApprovalStepDecision; comments?: string }) =>
    (await http.post(`/approval-steps/${id}/complete_step/`, input)).data,
  escalate: async (id: number, input: { escalation_reason: string; to_step_id?: number | null }) =>
    (await http.post(`/approval-steps/${id}/escalate_step/`, input)).data
})

export async function listApprovalSteps(params: { page: number; page_size: number; search?: string }) {
  return approvalStepApi.list(params)
}

export async function startApprovalStep(id: number) {
  return approvalStepApi.start(id)
}

export async function completeApprovalStep(id: number, input: { decision: ApprovalStepDecision; comments?: string }) {
  return approvalStepApi.complete(id, input)
}

export async function escalateApprovalStep(id: number, input: { escalation_reason: string; to_step_id?: number | null }) {
  return approvalStepApi.escalate(id, input)
}
