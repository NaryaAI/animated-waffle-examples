import { useCallback, useMemo, useState } from 'react'
import { useWaffle, type WaffleInputMode } from '@animated-waffle/react'

import type { WaffleConfig } from '../config'
import { useDismissibleError } from '../hooks/use-dismissible-error'
import { useHoldToTalk } from '../hooks/use-hold-to-talk'
import { buildChatHistory } from '../lib/chat-history'
import { resolveEndUserId } from '../lib/end-user-id'
import { requestSessionToken } from '../lib/session-token'
import { AvatarStage } from './avatar-stage'
import { ChatPanel } from './chat-panel'
import { SessionBar } from './session-bar'
import { TalkControl } from './talk-control'

export function LiveChat({ config }: { config: WaffleConfig }) {
  const endUserId = useMemo(resolveEndUserId, [])
  const [inputMode, setInputMode] = useState<WaffleInputMode>('push-to-talk')
  const [failure, setFailure] = useState<Error | null>(null)

  // One hook owns the whole session: connection, Ruby's audio, her avatar's
  // download and playback, transcripts, and cleanup. Everything below is this
  // application's own layout and controls.
  const waffle = useWaffle({
    agentId: config.agentId,
    apiOrigin: config.apiOrigin,
    sessionToken: () => requestSessionToken(endUserId),
  })

  const connected = waffle.status === 'connected'
  const turns = useMemo(() => buildChatHistory(waffle.transcript), [waffle.transcript])
  const { visible: error, dismiss } = useDismissibleError(failure ?? waffle.error)

  const report = useCallback((error: unknown) => {
    setFailure(error instanceof Error ? error : new Error(String(error)))
  }, [])

  const connect = useCallback(() => {
    setFailure(null)
    // The input mode is fixed for the life of a connection, so it is chosen
    // here rather than toggled mid-conversation.
    waffle.connect({ inputMode }).catch(report)
  }, [waffle, inputMode, report])

  const disconnect = useCallback(() => {
    waffle.disconnect().catch(report)
  }, [waffle, report])

  const send = useCallback(
    (text: string) => {
      setFailure(null)
      // The hook records the typed turn in the transcript once the send lands.
      waffle.sendText(text).catch(report)
    },
    [waffle, report],
  )

  const hold = useHoldToTalk({
    enabled: connected && inputMode === 'push-to-talk',
    onStart: waffle.startPushToTalk,
    onStop: waffle.stopPushToTalk,
    onCancel: waffle.cancelPushToTalk,
  })

  return (
    <div className="flex h-full flex-col">
      <SessionBar
        status={waffle.status}
        inputMode={inputMode}
        onInputModeChange={setInputMode}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="min-h-[24rem] flex-1 lg:min-h-0">
          <AvatarStage
            avatarRef={waffle.avatarRef}
            load={waffle.avatarLoad}
            status={waffle.status}
            speaking={waffle.agentSpeaking}
            performance={waffle.performance}
          >
            <TalkControl connected={connected} inputMode={inputMode} hold={hold} />
          </AvatarStage>
        </section>

        <ChatPanel
          turns={turns}
          connected={connected}
          agentSpeaking={waffle.agentSpeaking}
          error={error}
          onDismissError={dismiss}
          onSend={send}
        />
      </main>
    </div>
  )
}
