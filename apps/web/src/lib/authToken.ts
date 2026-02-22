export const TOKEN_KEY = 'authToken'

let cachedToken: string | null = null
let initPromise: Promise<void> | null = null

function isTauri() {
  const w = window as any
  return !!w.__TAURI__?.invoke
}

function isCapacitorNative() {
  const w = window as any
  const cap = w.Capacitor
  if (!cap) return false
  if (typeof cap.isNativePlatform === 'function') return !!cap.isNativePlatform()
  return !!cap.isNative
}

async function loadFromTauriKeychain() {
  const w = window as any
  const token = await w.__TAURI__.invoke('get_auth_token')
  return (token ? String(token) : '') || ''
}

async function saveToTauriKeychain(token: string) {
  const w = window as any
  await w.__TAURI__.invoke('set_auth_token', { token })
}

async function clearTauriKeychain() {
  const w = window as any
  await w.__TAURI__.invoke('clear_auth_token')
}

async function loadFromCapacitorPreferences() {
  const mod = await import('@capacitor/preferences')
  const res = await mod.Preferences.get({ key: TOKEN_KEY })
  return res?.value || ''
}

async function saveToCapacitorPreferences(token: string) {
  const mod = await import('@capacitor/preferences')
  await mod.Preferences.set({ key: TOKEN_KEY, value: token })
}

async function clearCapacitorPreferences() {
  const mod = await import('@capacitor/preferences')
  await mod.Preferences.remove({ key: TOKEN_KEY })
}

export function getAuthToken() {
  if (cachedToken) return cachedToken
  return localStorage.getItem(TOKEN_KEY)
}

export async function initAuthToken() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      if (isTauri()) {
        const token = await loadFromTauriKeychain()
        cachedToken = token || null
        return
      }
      if (isCapacitorNative()) {
        const token = await loadFromCapacitorPreferences()
        cachedToken = token || null
        return
      }
    } catch {
      // fall back to localStorage
    }
    cachedToken = localStorage.getItem(TOKEN_KEY)
  })()
  return initPromise
}

export function setAuthToken(token: string) {
  cachedToken = token || null

  if (!token) {
    void clearAuthToken()
    return
  }

  if (isTauri()) {
    void saveToTauriKeychain(token)
    return
  }
  if (isCapacitorNative()) {
    void saveToCapacitorPreferences(token)
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  cachedToken = null

  if (isTauri()) {
    localStorage.removeItem(TOKEN_KEY)
    return void clearTauriKeychain()
  }
  if (isCapacitorNative()) {
    localStorage.removeItem(TOKEN_KEY)
    return void clearCapacitorPreferences()
  }
  localStorage.removeItem(TOKEN_KEY)
}

