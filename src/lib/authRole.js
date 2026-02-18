const getProjectRef = () => {
  try {
    const url = new URL(import.meta.env.VITE_SUPABASE_URL || '')
    return url.hostname.split('.')[0] || null
  } catch {
    return null
  }
}

const getCachedAuthPayload = () => {
  if (typeof window === 'undefined') return null
  const ref = getProjectRef()
  if (!ref) return null

  const raw = window.localStorage.getItem(`sb-${ref}-auth-token`)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const getCachedUserRole = () => {
  const payload = getCachedAuthPayload()
  const session =
    payload?.currentSession ??
    payload?.session ??
    (Array.isArray(payload) ? payload[0] : null)
  const role = session?.user?.user_metadata?.role
  return role ?? null
}
