import type { ChatTurn, PerformanceCue } from '../lib/chat-history'

/**
 * One colour per emotion family from the SDK's performance-tag contract. Unknown
 * families fall back to the neutral tint, so a contract that grows a family does
 * not break the chip.
 */
const NEUTRAL_COLOR = '#9aa3b8'

const FAMILY_COLOR: Record<string, string> = {
  neutral: NEUTRAL_COLOR,
  joy: '#ffb545',
  anticipation: '#4ad6c4',
  confidence: '#7aa2ff',
  sadness: '#6f8cd8',
  self_conscious: '#c58ad6',
  anger: '#ff6b5e',
  aversion: '#b07be0',
  disengagement: '#95907f',
  fear: '#a78bfa',
  orienting: '#5eead4',
  care: '#7dd3a0',
  playful: '#ff8fb1',
}

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

      {turn.cues.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-1">
          {turn.cues.map((cue, index) => (
            <CueChip key={`${cue.tag}-${index}`} cue={cue} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CueChip({ cue }: { cue: PerformanceCue }) {
  if (cue.kind === 'vocal-action') {
    return (
      <span className="rounded-full border border-line px-2 py-0.5 text-[0.7rem] text-muted">
        {cue.tag}
      </span>
    )
  }

  const color = FAMILY_COLOR[cue.family ?? 'neutral'] ?? NEUTRAL_COLOR
  return (
    <span
      className="cue-chip rounded-full border px-2 py-0.5 text-[0.7rem]"
      style={{
        color,
        borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      {cue.tag}
    </span>
  )
}
