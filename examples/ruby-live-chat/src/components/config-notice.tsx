export function ConfigNotice() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-lg rounded-2xl border border-line bg-surface p-7">
        <p className="text-xs font-medium tracking-[0.18em] text-ruby uppercase">
          Setup
        </p>
        <h1 className="mt-3 text-xl font-semibold">Point the example at an Agent</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Copy <code className="text-ink">.env.example</code> to{' '}
          <code className="text-ink">.env</code>, then set the published Agent whose
          Avatar is Ruby and the workspace API key the dev server uses to mint
          session tokens.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-stage p-4 text-xs leading-relaxed text-muted">
          <code>
            {'ANIMATED_WAFFLE_PUBLIC_AGENT_ID=22222222-2222-4222-8222-222222222222\n'}
            {'ANIMATED_WAFFLE_API_KEY=awp_…'}
          </code>
        </pre>
        <p className="mt-4 text-sm text-muted">
          Restart <code className="text-ink">pnpm dev</code> afterwards — Vite reads
          the file at startup.
        </p>
      </div>
    </div>
  )
}
