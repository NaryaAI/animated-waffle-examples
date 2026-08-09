# Animated Waffle examples

Runnable integrations built on the Animated Waffle talking-avatar SDK, from the
outside in —
each one uses the published packages exactly the way an integrating application
would:

| Example | What it shows |
| --- | --- |
| [`examples/ruby-live-chat`](examples/ruby-live-chat) | Ruby performing on stage next to a live chat transcript: voice in, speech and avatar performance out, typed input, and performance-cue annotations. |

## Packages

```bash
pnpm add @animated-waffle/react                          # React embed
pnpm add @animated-waffle/client                          # framework-independent
pnpm add @animated-waffle/avatar three @pixiv/three-vrm   # renderer / contracts
```

- **`@animated-waffle/react`** — `useWaffle`, one hook that owns the session,
  the agent's audio, the avatar's download and playback, and the transcript. It
  re-exports the whole client API, so a React app installs only this.
- **`@animated-waffle/client`** — `WaffleClient`, the same lifecycle without
  React or a renderer.
- **`@animated-waffle/avatar`** — the renderer and performance coordination the
  React package is built on, plus the performance-tag contract. The escape hatch
  for apps that bring their own model or drive the stage themselves.

Every example keeps the permanent workspace API key on the server and hands the
browser a callback that returns a short-lived, Agent-scoped session token. No
example passes an avatar URL, a room URL, a transport token, or a provider
option: those come from the Agent's published revision and stay inside the SDK.

## Run one

```bash
pnpm install
cp examples/ruby-live-chat/.env.example examples/ruby-live-chat/.env
# fill in the published Agent id and the workspace API key, then:
pnpm dev
```

At the repository root, `pnpm dev` runs the featured example. Every example also
has its own `pnpm dev:<name>`, and works from inside its own directory.

## Add one

Each example is a self-contained pnpm workspace package under `examples/`,
built with TypeScript, Vite, and Tailwind CSS:

```
examples/<name>/
├── package.json      # name: "<name>", private, its own dev/build/typecheck
├── tsconfig.json     # extends ../../tsconfig.base.json
├── vite.config.ts
├── .env.example      # never a real key
├── server/           # dev-only endpoints that hold the workspace API key
└── src/
```

Add `dev:<name>` to the root `package.json` (and point the root `dev` at it if
it becomes the featured one), a row to the table above, and a README in the
example explaining what it demonstrates and what a production
integration must add. `pnpm build` and `pnpm typecheck` at the root cover every
example.
