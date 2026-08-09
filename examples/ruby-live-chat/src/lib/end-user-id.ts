const STORAGE_KEY = 'ruby-live-chat:end-user-id'

let cached: string | null = null

/**
 * One stable opaque UUID per end user, owned by this application. The Agent's
 * conversation memory is scoped to it, so it has to survive a reload — an app
 * with real accounts would derive it from its own user record instead.
 */
export function resolveEndUserId(): string {
  if (cached) return cached
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    cached = stored ?? crypto.randomUUID()
    if (!stored) localStorage.setItem(STORAGE_KEY, cached)
  } catch {
    // Private browsing or blocked storage: this device gets a fresh identity,
    // and therefore a fresh conversation, on every reload.
    cached = crypto.randomUUID()
  }
  return cached
}
