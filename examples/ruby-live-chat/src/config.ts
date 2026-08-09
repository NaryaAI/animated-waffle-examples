const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface WaffleConfig {
  agentId: string
  /** Left undefined so the SDK uses its own production default. */
  apiOrigin: string | undefined
}

/**
 * `WaffleClient` rejects a non-UUID `agentId` in its constructor, and
 * `useWaffle` constructs it while rendering. Resolve configuration before
 * mounting the hook so a missing `.env` shows setup instructions instead of
 * throwing out of a render.
 */
export function readWaffleConfig(): WaffleConfig | null {
  const agentId = import.meta.env.ANIMATED_WAFFLE_PUBLIC_AGENT_ID?.trim() ?? ''
  if (!UUID.test(agentId)) return null
  return {
    agentId,
    apiOrigin: import.meta.env.ANIMATED_WAFFLE_PUBLIC_API_ORIGIN?.trim() || undefined,
  }
}
