import type { WaffleTranscript } from '@animated-waffle/react'

export interface ChatTurn {
  id: string
  role: WaffleTranscript['role']
  text: string
  /** True for the interim bubble that speech recognition is still revising. */
  live: boolean
}

/**
 * Fold the SDK's transcript log into chat bubbles.
 *
 * Captions only. Ruby's performance is not read out of this text — the runtime
 * owns which cue plays and when, and `useWaffle().performance` reports what
 * actually reached her face, which is what the stage badge shows.
 *
 * The only state here is speech recognition revising its guess: a non-final
 * entry is a slot that the next revision overwrites and that speaker's next
 * final entry replaces. Typed turns arrive as ordinary final user entries.
 */
export function buildChatHistory(
  transcript: readonly WaffleTranscript[],
): ChatTurn[] {
  const turns: ChatTurn[] = []
  const liveAt = new Map<WaffleTranscript['role'], number>()

  for (const [index, entry] of transcript.entries()) {
    if (!entry.final) {
      const at = liveAt.get(entry.role)
      const bubble = present(`live-${entry.role}`, entry, true)
      if (at === undefined) {
        liveAt.set(entry.role, turns.length)
        turns.push(bubble)
      } else {
        turns[at] = bubble
      }
      continue
    }

    // Their own interim guess is superseded; nobody else's is touched.
    const at = liveAt.get(entry.role)
    if (at !== undefined) {
      turns.splice(at, 1)
      liveAt.delete(entry.role)
      for (const [role, position] of liveAt) {
        if (position > at) liveAt.set(role, position - 1)
      }
    }
    turns.push(present(`turn-${index}`, entry, false))
  }

  return turns.filter((turn) => turn.text !== '')
}

function present(id: string, entry: WaffleTranscript, live: boolean): ChatTurn {
  return { id, role: entry.role, text: entry.text.trim(), live }
}
