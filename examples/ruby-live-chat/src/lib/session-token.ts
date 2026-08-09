/** Must match `ROUTE` in `server/session-token-endpoint.ts`. */
const SESSION_TOKEN_PATH = '/api/session-token'

/**
 * The SDK calls this once per connection attempt, so there is nothing to cache
 * or refresh here — a token that expired between two conversations is simply
 * never reused.
 */
export async function requestSessionToken(endUserId: string): Promise<string> {
  const response = await fetch(SESSION_TOKEN_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endUserId }),
  })
  const payload = (await response.json().catch(() => null)) as {
    token?: unknown
    detail?: unknown
  } | null

  if (!response.ok || typeof payload?.token !== 'string') {
    throw new Error(
      typeof payload?.detail === 'string'
        ? payload.detail
        : `Could not mint a session token (HTTP ${response.status}).`,
    )
  }
  return payload.token
}
