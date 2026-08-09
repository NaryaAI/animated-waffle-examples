import { useEffect, useRef } from 'react'

import type { ChatTurn } from '../lib/chat-history'
import { Composer } from './composer'
import { ErrorBanner } from './error-banner'
import { TurnBubble } from './turn-bubble'

const OPENERS = [
  'Hi Ruby — introduce yourself in one line.',
  'What are you good at?',
  'Tell me something surprising.',
]

interface ChatPanelProps {
  turns: ChatTurn[]
  connected: boolean
  agentSpeaking: boolean
  error: Error | null
  onDismissError: () => void
  onSend: (text: string) => void
}

export function ChatPanel({
  turns,
  connected,
  agentSpeaking,
  error,
  onDismissError,
  onSend,
}: ChatPanelProps) {
  const scroller = useRef<HTMLDivElement | null>(null)
  // Follow the conversation, unless the reader has scrolled back to re-read.
  const pinned = useRef(true)

  useEffect(() => {
    const element = scroller.current
    if (element && pinned.current) element.scrollTop = element.scrollHeight
  }, [turns])

  const last = turns.at(-1)
  const waiting = connected && !agentSpeaking && last?.role === 'user' && !last.live

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col border-t border-line bg-surface lg:w-[27rem] lg:border-t-0 lg:border-l">
      <header className="flex shrink-0 items-baseline justify-between border-b border-line px-5 py-3">
        <h2 className="text-sm font-medium">Transcript</h2>
        <p className="text-xs text-muted">
          {turns.length === 0 ? 'nothing yet' : `${turns.length} turns`}
        </p>
      </header>

      {error ? <ErrorBanner error={error} onDismiss={onDismissError} /> : null}

      <div
        ref={scroller}
        onScroll={() => {
          const element = scroller.current
          if (!element) return
          pinned.current =
            element.scrollHeight - element.scrollTop - element.clientHeight < 80
        }}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4"
      >
        {turns.length === 0 ? (
          <EmptyState connected={connected} onSend={onSend} />
        ) : (
          turns.map((turn) => <TurnBubble key={turn.id} turn={turn} />)
        )}
        {waiting ? <ThinkingDots /> : null}
      </div>

      <Composer disabled={!connected} onSend={onSend} />
    </aside>
  )
}

function EmptyState({
  connected,
  onSend,
}: {
  connected: boolean
  onSend: (text: string) => void
}) {
  return (
    <div className="pt-6">
      <p className="text-sm text-muted">
        Speak or type. Ruby answers out loud, and the badge over her shoulder
        names the cue her face is performing as she plays it.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {OPENERS.map((opener) => (
          <button
            key={opener}
            type="button"
            disabled={!connected}
            onClick={() => onSend(opener)}
            className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors enabled:hover:border-ruby/50 enabled:hover:text-ink disabled:opacity-50"
          >
            {opener}
          </button>
        ))}
      </div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1" aria-label="Ruby is thinking">
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className="size-1.5 rounded-full bg-muted animate-halo"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}
