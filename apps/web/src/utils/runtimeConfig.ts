const STORAGE_KEY = 'workorder.runtimeConfig'

export type RuntimeConfig = {
  apiBaseUrl?: string
  wsBaseUrl?: string
}

export function getRuntimeConfig(): Required<RuntimeConfig> {
  const raw = localStorage.getItem(STORAGE_KEY)
  let parsed: RuntimeConfig = {}
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = {}
    }
  }
  return {
    apiBaseUrl: parsed.apiBaseUrl || '',
    wsBaseUrl: parsed.wsBaseUrl || ''
  }
}

export function setRuntimeConfig(next: RuntimeConfig) {
  const current = getRuntimeConfig()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...next }))
}

export function clearRuntimeConfig() {
  localStorage.removeItem(STORAGE_KEY)
}

export function normalizeApiBaseUrl(input: string) {
  const value = String(input || '').trim().replace(/\/+$/, '')
  if (!value) return ''
  if (/\/api(\/|$)/.test(value)) return value
  return `${value}/api`
}

export function getApiBaseUrl() {
  const runtime = getRuntimeConfig()
  return runtime.apiBaseUrl || (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'
}

function normalizeWsBaseUrlProtocol(url: string) {
  if (url.startsWith('wss://') || url.startsWith('ws://')) return url
  if (url.startsWith('https://')) return `wss://${url.slice('https://'.length)}`
  if (url.startsWith('http://')) return `ws://${url.slice('http://'.length)}`
  return url
}

export function normalizeWsBaseUrl(input: string) {
  const value = String(input || '').trim().replace(/\/+$/, '')
  if (!value) return ''

  const withProtocol = normalizeWsBaseUrlProtocol(value)
  if (!/^[a-z]+:\/\//i.test(withProtocol)) {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    return `${protocol}${withProtocol}`
  }
  return withProtocol
}

export function getWsBaseUrl() {
  const runtime = getRuntimeConfig()
  const env = import.meta.env.VITE_WS_BASE_URL as string | undefined
  if (runtime.wsBaseUrl) return runtime.wsBaseUrl
  if (env) return normalizeWsBaseUrl(env)

  // 默认策略（开发友好）：
  // - 本地开发：默认走 8001（与现有 Vue2 约定一致）
  // - 其他环境：复用当前 host（假设由反向代理转发 /ws）
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${protocol}${host}:8001`
  }
  return `${protocol}${window.location.host}`
}

export function buildNotificationsWsUrl(token: string) {
  const base = getWsBaseUrl().replace(/\/+$/, '')
  const tokenParam = `token=${encodeURIComponent(token || '')}`

  if (base.includes('/ws/notifications')) {
    return base.includes('?') ? `${base}&${tokenParam}` : `${base}?${tokenParam}`
  }

  const wsPrefix = base.endsWith('/ws') ? base : `${base}/ws`
  return `${wsPrefix}/notifications/?${tokenParam}`
}
