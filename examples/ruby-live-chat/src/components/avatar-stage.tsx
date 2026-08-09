import type { ReactNode } from 'react'
import { emotionFamilyFor } from '@animated-waffle/avatar'
import type {
  AvatarPerformanceState,
  WaffleAvatarLoadState,
  WaffleStatus,
} from '@animated-waffle/react'

interface AvatarStageProps {
  /** Mount point the SDK renders Ruby into. */
  avatarRef: (element: HTMLDivElement | null) => void
  load: WaffleAvatarLoadState
  status: WaffleStatus
  speaking: boolean
  /** The cue Ruby is performing right now, straight from the renderer. */
  performance: AvatarPerformanceState
  /** Talk controls, laid over the bottom of the stage. */
  children?: ReactNode
}

export function AvatarStage({
  avatarRef,
  load,
  status,
  speaking,
  performance,
  children,
}: AvatarStageProps) {
  const notice = stageNotice(status, load)

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(115%_85%_at_50%_-10%,var(--color-spotlight)_0%,var(--color-stage)_62%)]">
      {/* The renderer owns everything inside this element. */}
      <div ref={avatarRef} className="absolute inset-0" />

      {speaking ? (
        <div className="absolute top-5 left-5 flex items-center gap-2 rounded-full border border-ruby/30 bg-stage/70 py-1.5 pr-3 pl-2.5 backdrop-blur-sm">
          <Equalizer />
          <span className="text-xs font-medium text-ruby-soft">Ruby is speaking</span>
        </div>
      ) : null}

      <PerformanceBadge performance={performance} />

      {notice ? <StageNotice {...notice} /> : null}

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-6 pb-8">
        {children}
      </div>
    </div>
  )
}

/**
 * One colour per emotion family from the SDK's performance-tag contract. An
 * unknown family falls back to the neutral tint, so a contract that grows a
 * family does not break the badge.
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

/**
 * What Ruby's face is doing, named while she does it.
 *
 * The source is the renderer itself — `useWaffle().performance` reports a cue
 * at the moment it reaches the avatar — rather than tags parsed out of her
 * caption. The badge therefore never claims a performance the stage did not
 * actually play, and it clears when her turn ends and the face returns to rest.
 */
function PerformanceBadge({ performance }: { performance: AvatarPerformanceState }) {
  const { emotion, vocalAction } = performance
  if (!emotion && !vocalAction) return null

  const color = emotion
    ? FAMILY_COLOR[emotionFamilyFor(emotion) ?? 'neutral'] ?? NEUTRAL_COLOR
    : NEUTRAL_COLOR

  return (
    <div className="pointer-events-none absolute top-5 right-5 flex flex-wrap items-center justify-end gap-1.5">
      {emotion ? (
        <span
          className="animate-rise rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm"
          style={{
            color,
            borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
            backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
          }}
        >
          {emotion}
        </span>
      ) : null}
      {vocalAction ? (
        <span className="animate-rise rounded-full border border-line bg-stage/70 px-2.5 py-1 text-xs text-muted backdrop-blur-sm">
          {vocalAction}
        </span>
      ) : null}
    </div>
  )
}

interface Notice {
  title: string
  detail?: string
  progress?: number | null
}

/**
 * The avatar only starts loading once a session hands the SDK its scoped model
 * grant, so the stage is empty until then. `avatarLoad` covers the rest: the
 * first download is streamed with byte progress, verified against the session's
 * content hash, and cached for later conversations.
 */
function stageNotice(status: WaffleStatus, load: WaffleAvatarLoadState): Notice | null {
  switch (load.status) {
    case 'downloading':
      return {
        title: load.fromCache ? 'Reading Ruby from cache' : 'Downloading Ruby',
        detail: transferred(load),
        progress: load.progress,
      }
    case 'verifying':
      return { title: 'Verifying the model', progress: null }
    case 'parsing':
      return { title: 'Setting the stage', progress: null }
    case 'error':
      return {
        title: 'Ruby could not be loaded',
        detail: 'Check the Agent’s published Avatar and try again.',
      }
    case 'ready':
      return null
    case 'idle':
      break
  }

  if (status === 'connecting') return { title: 'Connecting to Ruby', progress: null }
  if (status === 'disconnected') {
    return {
      title: 'Ruby is off stage',
      detail: 'Start the conversation to bring her on.',
    }
  }
  return null
}

function StageNotice({ title, detail, progress }: Notice) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
      <div className="w-72 rounded-2xl border border-line bg-surface/85 p-5 text-center backdrop-blur-sm">
        <p className="text-sm font-medium">{title}</p>
        {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
        {progress !== undefined ? (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full bg-ruby ${progress === null ? 'animate-halo' : ''}`}
              style={{ width: progress === null ? '100%' : `${Math.round(progress * 100)}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Equalizer() {
  return (
    <span className="flex h-3.5 items-center gap-0.5" aria-hidden="true">
      {[0, 140, 280].map((delay) => (
        <span
          key={delay}
          className="h-full w-0.5 origin-center rounded-full bg-ruby animate-bar"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

function transferred({ loadedBytes, totalBytes }: WaffleAvatarLoadState): string {
  const loaded = megabytes(loadedBytes)
  // `progress` and `totalBytes` are null when the server sends no content length.
  return totalBytes === null ? `${loaded} MB` : `${loaded} of ${megabytes(totalBytes)} MB`
}

function megabytes(bytes: number): string {
  return (bytes / 1_048_576).toFixed(1)
}
