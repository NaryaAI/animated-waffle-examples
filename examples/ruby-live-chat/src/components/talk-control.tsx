import type { PointerEvent } from 'react'
import type { WaffleInputMode } from '@animated-waffle/react'

import type { HoldToTalk } from '../hooks/use-hold-to-talk'

interface TalkControlProps {
  connected: boolean
  inputMode: WaffleInputMode
  hold: HoldToTalk
}

export function TalkControl({ connected, inputMode, hold }: TalkControlProps) {
  if (inputMode === 'automatic') {
    return (
      <p className="rounded-full border border-line bg-stage/70 px-4 py-2 text-xs text-muted backdrop-blur-sm">
        {connected
          ? 'Hands-free — just start talking, Ruby decides when you are done.'
          : 'Hands-free mode. Start the conversation to open the microphone.'}
      </p>
    )
  }

  // Capturing the pointer keeps the release on this button even if the cursor
  // slides off it, so a finished turn is sent instead of cancelled.
  const capture = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    hold.press()
  }

  return (
    <>
      <button
        type="button"
        disabled={!connected}
        onPointerDown={capture}
        onPointerUp={hold.release}
        onPointerCancel={hold.cancel}
        onContextMenu={(event) => event.preventDefault()}
        className={`flex touch-none items-center gap-3 rounded-full px-6 py-3.5 text-sm font-medium transition-all select-none disabled:opacity-45 ${
          hold.holding
            ? 'bg-ruby text-white shadow-[0_0_40px_-6px_var(--color-ruby)]'
            : 'border border-ruby/40 bg-stage/70 text-ink backdrop-blur-sm enabled:hover:border-ruby'
        }`}
      >
        <MicIcon listening={hold.holding} />
        {hold.holding ? 'Listening…' : 'Hold to talk'}
      </button>
      <p className="text-xs text-muted">
        or hold{' '}
        <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 font-sans text-[0.7rem]">
          Space
        </kbd>
      </p>
    </>
  )
}

function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        fill={listening ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
