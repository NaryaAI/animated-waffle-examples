import type { WaffleInputMode, WaffleStatus } from '@animated-waffle/react'

import { useTheme } from '../hooks/use-theme'

const STATUS_LABEL: Record<WaffleStatus, string> = {
  disconnected: 'Off air',
  connecting: 'Connecting',
  connected: 'Live',
  disconnecting: 'Ending',
}

const STATUS_DOT: Record<WaffleStatus, string> = {
  disconnected: 'bg-muted/50',
  connecting: 'bg-amber-400 animate-halo',
  connected: 'bg-emerald-400',
  disconnecting: 'bg-amber-400 animate-halo',
}

const MODES: { value: WaffleInputMode; label: string }[] = [
  { value: 'push-to-talk', label: 'Push to talk' },
  { value: 'automatic', label: 'Hands-free' },
]

interface SessionBarProps {
  status: WaffleStatus
  inputMode: WaffleInputMode
  onInputModeChange: (mode: WaffleInputMode) => void
  onConnect: () => void
  onDisconnect: () => void
}

export function SessionBar({
  status,
  inputMode,
  onInputModeChange,
  onConnect,
  onDisconnect,
}: SessionBarProps) {
  const idle = status === 'disconnected'
  const busy = status === 'connecting' || status === 'disconnecting'

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-b border-line bg-surface px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-lg bg-ruby/15 text-ruby">
          <GemIcon />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Ruby</p>
          <p className="text-xs text-muted">Live avatar chat</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-line px-3 py-1">
        <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-xs font-medium">{STATUS_LABEL[status]}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div
          className="flex rounded-full border border-line p-0.5"
          title={idle ? undefined : 'Disconnect to change the input mode'}
        >
          {MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              disabled={!idle}
              onClick={() => onInputModeChange(mode.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                inputMode === mode.value
                  ? 'bg-raised text-ink'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={idle ? onConnect : onDisconnect}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
            idle
              ? 'bg-ruby text-white hover:bg-ruby-soft'
              : 'border border-line text-ink hover:bg-raised'
          }`}
        >
          {idle
            ? 'Start conversation'
            : status === 'connecting'
              ? 'Connecting…'
              : status === 'disconnecting'
                ? 'Ending…'
                : 'End conversation'}
        </button>
      </div>
    </header>
  )
}

function GemIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M7 3h10l4 6-9 12L3 9l4-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3 9h18M12 21 8 9l3-6M12 21l4-12-3-6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="grid size-8 place-items-center rounded-full border border-line text-muted transition-colors hover:text-ink"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
