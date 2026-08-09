import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

/**
 * Dev-only stand-in for the integrator's backend.
 *
 * The browser SDK never sees a workspace API key. It calls a callback that
 * returns a short-lived, Agent-scoped session token, and that token can only
 * be minted with the permanent key — so minting has to happen somewhere the
 * browser cannot read. In this example that somewhere is the Vite dev server.
 *
 * A production backend replaces this with a real route that additionally:
 *   - authenticates its own user;
 *   - checks that the user may talk to the requested Agent;
 *   - derives `end_user_id` from the session instead of trusting the body;
 *   - applies concurrency, rate, duration, and spend limits.
 */

/** Must match `SESSION_TOKEN_PATH` in `src/lib/session-token.ts`. */
const ROUTE = '/api/session-token'

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
// The browser SDK targets this origin by default; the token endpoint has to
// agree with it. `ANIMATED_WAFFLE_PUBLIC_API_ORIGIN` overrides both.
const DEFAULT_API_ORIGIN = 'https://animated-waffle.narya.ai'
const MAX_REQUEST_BYTES = 4_096
const UPSTREAM_TIMEOUT_MS = 15_000

interface Failure {
  code: string
  detail: string
}

function send(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

async function readEndUserId(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_REQUEST_BYTES) throw new Error('Request body is too large.')
    chunks.push(chunk as Buffer)
  }
  const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  const endUserId =
    typeof body === 'object' && body !== null
      ? (body as { endUserId?: unknown }).endUserId
      : undefined
  return typeof endUserId === 'string' ? endUserId : ''
}

/** Reject a cross-site POST. Same-origin requests carry no Origin or ours. */
function sameOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin
  if (!origin) return true
  try {
    return new URL(origin).host === request.headers.host
  } catch {
    return false
  }
}

export function sessionTokenEndpoint(env: Record<string, string>): Plugin {
  const apiOrigin = (env.ANIMATED_WAFFLE_PUBLIC_API_ORIGIN?.trim() || DEFAULT_API_ORIGIN).replace(
    /\/+$/,
    '',
  )
  const apiKey = env.ANIMATED_WAFFLE_API_KEY?.trim() ?? ''
  const agentId = env.ANIMATED_WAFFLE_PUBLIC_AGENT_ID?.trim() ?? ''

  function misconfigured(): Failure | null {
    if (!apiKey || apiKey === 'awp_replace_me') {
      return {
        code: 'example_not_configured',
        detail: 'Set ANIMATED_WAFFLE_API_KEY in examples/ruby-live-chat/.env.',
      }
    }
    if (!UUID.test(agentId)) {
      return {
        code: 'example_not_configured',
        detail: 'Set ANIMATED_WAFFLE_PUBLIC_AGENT_ID to a published Agent id.',
      }
    }
    return null
  }

  async function mint(endUserId: string): Promise<Response> {
    // The Agent id comes from server configuration, not from the request: this
    // endpoint can only ever mint tokens for the Agent it was set up with.
    return fetch(`${apiOrigin}/v1/agents/${encodeURIComponent(agentId)}/session-tokens`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ end_user_id: endUserId }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  }

  async function handle(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    if (request.method !== 'POST') {
      send(response, 405, { code: 'method_not_allowed', detail: 'Use POST.' })
      return
    }
    if (!sameOrigin(request)) {
      send(response, 403, {
        code: 'origin_rejected',
        detail: 'Session tokens are only minted for this application origin.',
      })
      return
    }
    const failure = misconfigured()
    if (failure) {
      send(response, 503, failure)
      return
    }

    const endUserId = await readEndUserId(request)
    if (!UUID.test(endUserId)) {
      send(response, 400, {
        code: 'invalid_end_user_id',
        detail: 'endUserId must be a UUID.',
      })
      return
    }

    const upstream = await mint(endUserId)
    const payload: unknown = await upstream.json().catch(() => null)
    const record = (payload ?? {}) as Record<string, unknown>

    if (!upstream.ok || typeof record.token !== 'string') {
      send(response, upstream.ok ? 502 : upstream.status, {
        code: typeof record.code === 'string' ? record.code : 'session_token_rejected',
        detail:
          typeof record.detail === 'string'
            ? record.detail
            : 'The API declined to mint a session token.',
      })
      return
    }

    // Forward only what the browser needs. The upstream body also reports the
    // Agent's capabilities, which are of no use to the SDK caller.
    send(response, 200, { token: record.token, expiresAt: record.expires_at })
  }

  return {
    name: 'ruby-live-chat:session-token',
    apply: 'serve',
    configureServer(server) {
      const failure = misconfigured()
      if (failure) server.config.logger.warn(`\n[ruby-live-chat] ${failure.detail}\n`)

      server.middlewares.use(ROUTE, (request, response) => {
        handle(request, response).catch((error: unknown) => {
          if (response.headersSent) {
            response.destroy()
            return
          }
          const timedOut = error instanceof Error && error.name === 'TimeoutError'
          send(response, timedOut ? 504 : 502, {
            code: timedOut ? 'upstream_timeout' : 'upstream_unreachable',
            detail:
              error instanceof Error ? error.message : 'The API could not be reached.',
          })
        })
      })
    },
  }
}
