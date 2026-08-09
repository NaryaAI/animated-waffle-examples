import { useCallback, useEffect, useRef, useState } from 'react'

interface HoldToTalkOptions {
  /** False while disconnected or in hands-free mode. */
  enabled: boolean
  onStart: () => void
  onStop: () => void
  onCancel: () => void
}

export interface HoldToTalk {
  /** True between press and release, for the button's own visual state. */
  holding: boolean
  press: () => void
  release: () => void
  cancel: () => void
}

function typingInto(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  )
}

/**
 * Push-to-talk gesture handling for both the on-screen button and the space
 * bar. The SDK's three controls map to press (open the mic), release (send the
 * turn), and cancel (drop it) — cancel is what a lost pointer, a blurred
 * window, or a hidden tab must send, so a half-finished turn never hangs open.
 */
export function useHoldToTalk({
  enabled,
  onStart,
  onStop,
  onCancel,
}: HoldToTalkOptions): HoldToTalk {
  const [holding, setHolding] = useState(false)
  const handlers = useRef({ onStart, onStop, onCancel })
  handlers.current = { onStart, onStop, onCancel }

  const press = useCallback(() => {
    setHolding((current) => {
      if (current) return current
      handlers.current.onStart()
      return true
    })
  }, [])

  const finish = useCallback((send: boolean) => {
    setHolding((current) => {
      if (!current) return current
      if (send) handlers.current.onStop()
      else handlers.current.onCancel()
      return false
    })
  }, [])

  const release = useCallback(() => finish(true), [finish])
  const cancel = useCallback(() => finish(false), [finish])

  // Losing the ability to talk mid-hold drops the turn rather than sending it.
  useEffect(() => {
    if (!enabled) cancel()
  }, [enabled, cancel])

  useEffect(() => {
    if (!enabled) return

    const keyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (typingInto(event.target)) return
      // Space would otherwise scroll the transcript or re-trigger a focused
      // button.
      event.preventDefault()
      press()
    }
    const keyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      release()
    }
    const abandon = () => cancel()
    const visibility = () => {
      if (document.hidden) cancel()
    }

    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', abandon)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', abandon)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [enabled, press, release, cancel])

  return { holding, press, release, cancel }
}
