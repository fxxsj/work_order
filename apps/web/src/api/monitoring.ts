import { http } from '../lib/http'

type ApiResponse<T> = {
  success: boolean
  code: number
  message: string
  data: T
  timestamp?: string
}

export async function getMonitoringOverview() {
  const res = await http.get<ApiResponse<any>>('/monitoring-dashboard/overview/')
  return (res.data as any)?.data ?? res.data
}

export async function getMonitoringAlerts() {
  const res = await http.get<ApiResponse<any>>('/monitoring-dashboard/alerts/')
  return (res.data as any)?.data ?? res.data
}

