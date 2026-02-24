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

function ensureHttpProtocol(url: string) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return url
  if (url.startsWith('//')) {
    const protocol =
      typeof window !== 'undefined' && window.location?.protocol ? window.location.protocol : 'http:'
    return `${protocol}${url}`
  }
  const protocol =
    typeof window !== 'undefined' && window.location?.protocol === 'https:' ? 'https://' : 'http://'
  return `${protocol}${url}`
}

export function normalizeApiBaseUrl(input: string) {
  const value = String(input || '').trim().replace(/\/+$/, '')
  if (!value) return ''
  const withProtocol = ensureHttpProtocol(value)
  if (/\/api(\/|$)/.test(withProtocol)) return withProtocol
  return `${withProtocol}/api`
}

export function getApiBaseUrl() {
  const runtime = getRuntimeConfig()
  if (runtime.apiBaseUrl) return normalizeApiBaseUrl(runtime.apiBaseUrl) || '/api'
  const env = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (env) return normalizeApiBaseUrl(env) || '/api'
  return '/api'
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
  // - 本地开发：默认走 8001（后端 WebSocket 默认端口）
  // - 其他环境：复用当前 host（假设由反向代理转发 /ws）
  if (window.location.protocol === 'file:' || !window.location.hostname) {
    return ''
  }
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${protocol}${host}:8001`
  }
  return `${protocol}${window.location.host}`
}

export function buildNotificationsWsUrl(auth: { token?: string; ticket?: string }) {
  const base = getWsBaseUrl().replace(/\/+$/, '')
  if (!base) return ''
  const ticket = auth.ticket ? String(auth.ticket) : ''
  const token = !ticket && auth.token ? String(auth.token) : ''
  const query = ticket ? `ticket=${encodeURIComponent(ticket)}` : `token=${encodeURIComponent(token)}`

  if (base.includes('/ws/notifications')) {
    return base.includes('?') ? `${base}&${query}` : `${base}?${query}`
  }

  const wsPrefix = base.endsWith('/ws') ? base : `${base}/ws`
  return `${wsPrefix}/notifications/?${query}`
}
