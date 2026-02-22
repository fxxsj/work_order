export function redirectToLoginWithRedirect(redirect: string) {
  const encoded = encodeURIComponent(redirect || '/')

  if (import.meta.env.VITE_ROUTER_MODE === 'hash') {
    window.location.hash = `#/login?redirect=${encoded}`
    return
  }

  window.location.assign(`/login?redirect=${encoded}`)
}

