import { http } from '../lib/http'
import { createApiWithActions } from './base'

export type ApprovalWorkflowType = 'simple' | 'standard' | 'complex' | 'urgent'

export type ApprovalWorkflow = {
  id: number
  name: string
  workflow_type: ApprovalWorkflowType
  description?: string
  steps?: any
  is_active?: boolean
  created_by?: number | null
  created_at?: string
  updated_at?: string
}

export const approvalWorkflowApi = createApiWithActions('approval-workflows', {
  activate: async (id: number) => (await http.post(`/approval-workflows/${id}/activate/`, {})).data,
  deactivate: async (id: number) => (await http.post(`/approval-workflows/${id}/deactivate/`, {})).data,
  createDefault: async () => (await http.post('/approval-workflows/create_default/', {})).data,
  duplicate: async (input: { source_id: number; new_name: string }) =>
    (await http.post('/approval-workflows/duplicate/', input)).data
})

export async function listApprovalWorkflows(params: { page: number; page_size: number; search?: string }) {
  return approvalWorkflowApi.list(params)
}

export async function createApprovalWorkflow(input: Partial<ApprovalWorkflow>) {
  return approvalWorkflowApi.create(input)
}

export async function updateApprovalWorkflow(id: number, input: Partial<ApprovalWorkflow>) {
  return approvalWorkflowApi.update(id, input)
}

export async function deleteApprovalWorkflow(id: number) {
  return approvalWorkflowApi.delete(id)
}

export async function activateApprovalWorkflow(id: number) {
  return approvalWorkflowApi.activate(id)
}

export async function deactivateApprovalWorkflow(id: number) {
  return approvalWorkflowApi.deactivate(id)
}

export async function createDefaultApprovalWorkflows() {
  return approvalWorkflowApi.createDefault()
}

export async function duplicateApprovalWorkflow(input: { source_id: number; new_name: string }) {
  return approvalWorkflowApi.duplicate(input)
}

