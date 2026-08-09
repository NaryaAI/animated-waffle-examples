import { useEffect, useRef, useState } from 'react'

const MAX_HEIGHT_PX = 140

interface ComposerProps {
  disabled: boolean
  onSend: (text: string) => void
}

export function Composer({ disabled, onSend }: ComposerProps) {
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const element = input.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT_PX)}px`
  }, [draft])

  const submit = () => {
    const text = draft.trim()
    if (!text || disabled) return
    // `sendText` puts a typed turn through the same Agent as spoken input, so
    // the answer still arrives as speech and avatar performance.
    onSend(text)
    setDraft('')
  }

  return (
    <form
      className="shrink-0 border-t border-line px-4 py-3"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-stage px-3 py-2 focus-within:border-ruby/50">
        <textarea
          ref={input}
          rows={1}
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) return
            event.preventDefault()
            submit()
          }}
          placeholder={disabled ? 'Start the conversation to type…' : 'Say something to Ruby…'}
          className="flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted/70 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || draft.trim() === ''}
          aria-label="Send"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-ruby text-white transition-opacity disabled:opacity-35"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
              d="M5 12h13M12 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  )
}
