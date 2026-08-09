import type { ChatTurn } from '../lib/chat-history'

export function TurnBubble({ turn }: { turn: ChatTurn }) {
  const mine = turn.role === 'user'

  return (
    <div className={`flex flex-col gap-1.5 animate-rise ${mine ? 'items-end' : 'items-start'}`}>
      <p className="px-1 text-[0.7rem] font-medium tracking-wide text-muted uppercase">
        {mine ? 'You' : 'Ruby'}
      </p>

      <div
        className={`max-w-[92%] rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed ${
          mine
            ? 'border-ruby/25 bg-ruby/10 text-ink'
            : 'border-line bg-raised text-ink'
        } ${turn.live ? 'text-muted italic' : ''}`}
      >
        {turn.text}
      </div>
    </div>
  )
}
