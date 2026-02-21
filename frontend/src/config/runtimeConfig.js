const STORAGE_KEY = 'workorder.runtimeConfig'

function safeJsonParse(value, fallback) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function getRuntimeConfig() {
  const stored = safeJsonParse(localStorage.getItem(STORAGE_KEY), {})
  return {
    apiBaseUrl: stored.apiBaseUrl || '',
    wsBaseUrl: stored.wsBaseUrl || ''
  }
}

export function setRuntimeConfig(partial) {
  const current = getRuntimeConfig()
  const next = {
    ...current,
    ...partial
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function clearRuntimeConfig() {
  localStorage.removeItem(STORAGE_KEY)
}

export function normalizeApiBaseUrl(input) {
  const value = String(input || '').trim()
  if (!value) return ''

  const withoutTrailingSlash = value.replace(/\/+$/, '')

  // 兼容用户输入域名但忘记加 /api 的情况
  const hasApiSegment = /\/api(\/|$)/.test(withoutTrailingSlash)
  if (hasApiSegment) return withoutTrailingSlash

  return `${withoutTrailingSlash}/api`
}

function normalizeWsBaseUrlProtocol(url) {
  if (url.startsWith('wss://') || url.startsWith('ws://')) return url
  if (url.startsWith('https://')) return `wss://${url.slice('https://'.length)}`
  if (url.startsWith('http://')) return `ws://${url.slice('http://'.length)}`
  return url
}

export function normalizeWsBaseUrl(input) {
  const value = String(input || '').trim()
  if (!value) return ''

  const withoutTrailingSlash = value.replace(/\/+$/, '')
  const withProtocol = normalizeWsBaseUrlProtocol(withoutTrailingSlash)

  // 允许用户只填 host:port（或 host）
  if (!/^[a-z]+:\/\//i.test(withProtocol)) {
    const isHttpsLike = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const protocol = isHttpsLike ? 'wss://' : 'ws://'
    return `${protocol}${withProtocol}`
  }

  return withProtocol
}

export function getApiBaseUrl() {
  const runtime = getRuntimeConfig()
  if (runtime.apiBaseUrl) return runtime.apiBaseUrl
  return process.env.VUE_APP_API_BASE_URL ||
    process.env.VUE_APP_API_URL ||
    '/api'
}

export function getWsBaseUrl() {
  const runtime = getRuntimeConfig()
  if (runtime.wsBaseUrl) return runtime.wsBaseUrl

  const envBase = process.env.VUE_APP_WS_BASE_URL
  if (envBase) return normalizeWsBaseUrl(envBase)

  // 兼容旧变量：只配置 host:port（默认 localhost:8001）
  const host = process.env.VUE_APP_WS_HOST || 'localhost:8001'
  const isHttpsLike = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const protocol = isHttpsLike ? 'wss://' : 'ws://'
  return `${protocol}${host}`
}

export function buildNotificationsWsUrl(token) {
  const base = getWsBaseUrl().replace(/\/+$/, '')
  const tokenParam = `token=${encodeURIComponent(token || '')}`

  // 如果用户直接配置了完整的 notifications URL，则直接拼 token 参数
  if (base.includes('/ws/notifications')) {
    return base.includes('?') ? `${base}&${tokenParam}` : `${base}?${tokenParam}`
  }

  // 允许用户把 base 写成 .../ws
  const wsPrefix = base.endsWith('/ws') ? base : `${base}/ws`
  return `${wsPrefix}/notifications/?${tokenParam}`
}

