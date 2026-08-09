# Ruby · live chat

A published Animated Waffle Agent, embedded twice over: Ruby performs on the left, and the
conversation reads as chat history on the right.

- **Avatar stage** — the VRM renderer the SDK mounts, with the avatar's download
  progress, a speaking indicator, and push-to-talk.
- **Transcript** — user and agent turns, plus the performance cues Ruby is
  acting out while she says them.
- **Two ways in** — hold to talk (or hold `Space`), or type. Both go through the
  same Agent and come back as speech.

```
┌──────────────────────────────┬──────────────────┐
│                              │ Transcript       │
│         Ruby (VRM)           ├──────────────────┤
│                              │  You: …          │
│                              │  Ruby: …         │
│                              │  [happy] [laughing]
│      ( hold to talk )        ├──────────────────┤
│                              │ [ type…      → ] │
└──────────────────────────────┴──────────────────┘
```

## Run it

You need a **published Agent whose Avatar is Ruby** and a workspace API key.

```bash
pnpm install            # at the repository root
cp .env.example .env    # agent id + API key
pnpm dev                # http://127.0.0.1:5273
```

Press **Start conversation**, allow the microphone, then hold the talk button
while speaking. To develop against a non-production API, set
`ANIMATED_WAFFLE_PUBLIC_API_ORIGIN` — the browser SDK and the token endpoint
both read it.

## How it is wired

```
browser                          dev server                    API
───────                          ──────────                    ───
useWaffle({ agentId,
            sessionToken })
   └── sessionToken() ─POST──▶ /api/session-token
                                 + API key ──────────POST──▶ /v1/agents/{id}
                                                            /session-tokens
   ◀────────────── short-lived, Agent-scoped token ──────────────┘
   └── connect() ────────────────────────────────────────▶ Agent session
                              ◀─── audio · transcripts · performance cues
```

`src/lib/session-token.ts` is the browser half: one `fetch`, no caching. The SDK
calls it once per connection attempt, so a token can never be pinned in
configuration and expire in place.

`server/session-token-endpoint.ts` is the server half — a Vite dev-server
plugin, because the point is only that the permanent key lives somewhere the
browser cannot read. **It is a tutorial, not a gateway.** A real backend must
also authenticate its own user, check that the user may talk to the requested
Agent, derive `end_user_id` from that session instead of the request body, and
apply concurrency, rate, duration, and spend limits.

The workspace key is kept out of the bundle by naming, not by discipline: Vite's
`envPrefix` exposes only `ANIMATED_WAFFLE_PUBLIC_*` to browser code, and
`ANIMATED_WAFFLE_API_KEY` is deliberately named outside that prefix.

## What the SDK owns, and what this app owns

`useWaffle` returns the whole session — `status`, `session`, `transcript`,
`agentSpeaking`, `error`, `connect`, `disconnect`, `sendText`, the push-to-talk
controls, plus `avatarRef` and `avatarLoad`. This app adds only layout,
gestures, and presentation:

| File | Responsibility |
| --- | --- |
| `components/live-chat.tsx` | Calls `useWaffle`; wires one session to both panels. |
| `components/avatar-stage.tsx` | Mounts `avatarRef`; turns `avatarLoad` into stage states. |
| `hooks/use-hold-to-talk.ts` | Pointer and `Space` gestures → `start` / `stop` / `cancel`. |
| `lib/chat-history.ts` | Folds the transcript log into turns; reads performance cues. |
| `config.ts` | Resolves the Agent id *before* mounting the hook. |

Things this app never touches, because the Agent's published revision decides
them and the SDK keeps them internal: Ruby's model URL, her voice, her prompt,
the room, the transport token, the audio element.

Two details worth copying:

- **`avatarLoad` is a first-class UI state.** The first VRM download is streamed
  with byte progress, verified against the session's content hash, and cached by
  content — so a second conversation reports `fromCache` and starts instantly. A
  session that only shows a spinner throws that away.
- **Resolve `agentId` before rendering the hook.** `WaffleClient` rejects a
  non-UUID id in its constructor, and `useWaffle` constructs it during render. A
  missing `.env` should render setup instructions, not throw out of a render.

## Performance cues in the transcript

Ruby's replies carry bracketed tags — `[happy]`, `[laughing]` — that drive her
face. `lib/chat-history.ts` uses `@animated-waffle/avatar` to read them the same
way the runtime does:

```ts
import { emotionFamilyFor, segmentTranscript, stripTags } from '@animated-waffle/avatar'
```

`segmentTranscript` splits an utterance at each tag; emotion is durable state
that persists until it changes, while a vocal action belongs to one segment
only. The caption uses each segment's tag-free `display` text, and the chips
under a bubble name the cues in the order Ruby reached them — coloured by
emotion family, so the chat annotates the performance on the left instead of
leaking markup into it.

An Agent that emits no tags simply produces no chips.

## Not covered here

Agent creation and publishing (the management console, not the browser SDK),
durable transcripts and recordings (the server-side session record), and user
accounts — this example persists one anonymous `end_user_id` in `localStorage`,
which is what the Agent's memory is scoped to.
