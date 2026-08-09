import type { ReactNode } from 'react'
import type { WaffleAvatarLoadState, WaffleStatus } from '@animated-waffle/react'

interface AvatarStageProps {
  /** Mount point the SDK renders Ruby into. */
  avatarRef: (element: HTMLDivElement | null) => void
  load: WaffleAvatarLoadState
  status: WaffleStatus
  speaking: boolean
  /** Talk controls, laid over the bottom of the stage. */
  children?: ReactNode
}

export function AvatarStage({
  avatarRef,
  load,
  status,
  speaking,
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

      {notice ? <StageNotice {...notice} /> : null}

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-6 pb-8">
        {children}
      </div>
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
