import { emotionFamilyFor, segmentTranscript, stripTags } from '@animated-waffle/avatar'
import type { WaffleTranscript } from '@animated-waffle/react'

export interface PerformanceCue {
  tag: string
  kind: 'emotion' | 'vocal-action'
  /** Emotion family id, used only to colour the chip. */
  family: string | null
}

export interface ChatTurn {
  id: string
  role: WaffleTranscript['role']
  /** Caption text, with performance tags removed. */
  text: string
  /** Cues Ruby performed while saying this, in the order she reached them. */
  cues: PerformanceCue[]
  /** True for the interim bubble that speech recognition is still revising. */
  live: boolean
}

/**
 * Fold the SDK's transcript log into chat bubbles.
 *
 * One bubble per entry. Ruby's replies arrive one entry per spoken sentence, as
 * she starts saying it, so bubbles appear alongside her voice and nothing here
 * has to group or de-duplicate anything.
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

  // An entry that was only a tag — `[sighing]` on its own — has no caption and
  // no segment to read a cue from. Drop it instead of drawing an empty bubble.
  return turns.filter((turn) => turn.text !== '' || turn.cues.length > 0)
}

function present(id: string, entry: WaffleTranscript, live: boolean): ChatTurn {
  if (entry.role === 'user') {
    return { id, role: entry.role, text: entry.text, cues: [], live }
  }

  // Ruby's text carries the bracketed performance tags that drive her face.
  // `segmentTranscript` from `@animated-waffle/avatar` reads them the same way
  // the runtime does, so the chips name the cues the stage is performing and the
  // caption is left clean.
  const segments = segmentTranscript(entry.text)
  const cues: PerformanceCue[] = []
  let carried: string | null = null

  for (const segment of segments) {
    // Emotion is durable state: it repeats until it changes, so only record it
    // at the point it turns over.
    if (segment.emotion && segment.emotion !== carried) {
      cues.push({
        tag: segment.emotion,
        kind: 'emotion',
        family: emotionFamilyFor(segment.emotion),
      })
    }
    carried = segment.emotion
    for (const action of segment.vocalActions) {
      cues.push({ tag: action, kind: 'vocal-action', family: null })
    }
  }

  const caption = segments
    .map((segment) => segment.display)
    .join(' ')
    .trim()

  return {
    id,
    role: entry.role,
    text: caption || stripTags(entry.text),
    cues,
    live,
  }
}
