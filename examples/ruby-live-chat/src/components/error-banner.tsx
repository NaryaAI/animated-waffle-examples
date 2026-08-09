import { WaffleError } from '@animated-waffle/react'

interface ErrorBannerProps {
  error: Error
  onDismiss: () => void
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  // Failures the SDK raises itself carry a stable machine-readable code; a
  // failure from this app's own token endpoint arrives as a plain Error.
  const code = error instanceof WaffleError ? error.code : undefined

  return (
    <div className="flex items-start gap-3 border-b border-ruby/25 bg-ruby/10 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">{error.message}</p>
        {code ? <p className="mt-0.5 font-mono text-[0.7rem] text-muted">{code}</p> : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-muted transition-colors hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6 6 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
