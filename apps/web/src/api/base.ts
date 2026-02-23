import { http } from '../lib/http'

export type ListParams = {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
  [key: string]: any
}

export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type CrudApi<T> = {
  list: (params?: ListParams) => Promise<PaginatedResult<T>>
  retrieve: (id: number) => Promise<T>
  create: (data: Partial<T>) => Promise<T>
  update: (id: number, data: Partial<T>) => Promise<T>
  delete: (id: number) => Promise<void>
}

type UpdateMethod = 'put' | 'patch'

export type CrudApiOptions = {
  updateMethod?: UpdateMethod
}

export function createCrudApi<T>(resource: string, options: CrudApiOptions = {}): CrudApi<T> {
  const updateMethod: UpdateMethod = options.updateMethod ?? 'put'
  const base = `/${resource}/`

  return {
    list: async (params = {}) => (await http.get<PaginatedResult<T>>(base, { params })).data,
    retrieve: async (id) => (await http.get<T>(`${base}${id}/`)).data,
    create: async (data) => (await http.post<T>(base, data)).data,
    update: async (id, data) => {
      if (updateMethod === 'patch') {
        return (await http.patch<T>(`${base}${id}/`, data)).data
      }
      return (await http.put<T>(`${base}${id}/`, data)).data
    },
    delete: async (id) => {
      await http.delete(`${base}${id}/`)
    }
  }
}

export function createApiWithActions<T, A extends Record<string, any>>(
  resource: string,
  actions: A,
  options?: CrudApiOptions
): CrudApi<T> & A {
  return {
    ...createCrudApi<T>(resource, options),
    ...actions
  }
}

