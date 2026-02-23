import { http } from '../lib/http'

export type UserItem = {
  id: number
  username: string
  first_name?: string
  last_name?: string
  email?: string
  is_staff?: boolean
}

export async function listUsersByDepartment(params?: { department_id?: number | string }) {
  const res = await http.get<UserItem[]>('/auth/users/', { params })
  return res.data
}

