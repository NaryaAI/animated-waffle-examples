import { emotionFamilyFor, segmentTranscript, stripTags } from '@animated-waffle/avatar'
import type { WaffleSpeechSegment, WaffleTranscript } from '@animated-waffle/react'

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
 * Fold durable transcript rows and live speech segments into chat bubbles.
 *
 * A transcript row is one persisted conversation turn. Ruby's visible bubbles
 * instead come from the sentence-sized speech segments that arrive immediately
 * before their audio. Keeping those streams separate means persistence can use
 * one stable message id without collapsing the live chat into one giant bubble.
 *
 * The only state here is speech recognition revising its guess: a non-final
 * entry is a slot that the next revision overwrites and that speaker's next
 * final entry replaces. Typed turns arrive as ordinary final user entries.
 */
export function buildChatHistory(
  transcript: readonly WaffleTranscript[],
  speechSegments: readonly WaffleSpeechSegment[],
): ChatTurn[] {
  const turns: ChatTurn[] = []
  const liveAt = new Map<WaffleTranscript['role'], number>()
  const latestSegmentById = new Map<string, WaffleSpeechSegment>()
  const segmentsByMessage = new Map<string, WaffleSpeechSegment[]>()
  const renderedSegments = new Set<string>()

  for (const segment of speechSegments) {
    latestSegmentById.set(segment.id, segment)
  }

  for (const segment of latestSegmentById.values()) {
    const messageSegments = segmentsByMessage.get(segment.messageId) ?? []
    messageSegments.push(segment)
    segmentsByMessage.set(segment.messageId, messageSegments)
  }

  const appendSegments = (segments: readonly WaffleSpeechSegment[]) => {
    for (const segment of [...segments].sort((a, b) => a.sequence - b.sequence)) {
      if (renderedSegments.has(segment.id)) continue
      renderedSegments.add(segment.id)
      turns.push(presentSpeechSegment(segment))
    }
  }

  for (const [index, entry] of transcript.entries()) {
    if (entry.role === 'assistant') {
      const segments = segmentsByMessage.get(entry.id)
      if (segments?.length) appendSegments(segments)
      // Assistant transcript rows are persistence, not proof that their audio
      // reached playout. This applies to interim rows too: Ruby's visible chat
      // is built exclusively from the speech segments released by the SDK.
      continue
    }

    if (!entry.final) {
      const at = liveAt.get(entry.role)
      const bubble = presentTranscript(`live-${entry.role}`, entry, true)
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
    turns.push(presentTranscript(`turn-${index}`, entry, false))
  }

  // During speech, segments precede the final durable assistant row. Show
  // those unanchored segments now; the stable segment id prevents duplication
  // when the transcript row arrives after playback.
  appendSegments([...latestSegmentById.values()])

  // An entry that was only a tag — `[sighing]` on its own — has no caption and
  // no segment to read a cue from. Drop it instead of drawing an empty bubble.
  return turns.filter((turn) => turn.text !== '' || turn.cues.length > 0)
}

function presentTranscript(id: string, entry: WaffleTranscript, live: boolean): ChatTurn {
  return { id, role: entry.role, text: entry.text, cues: [], live }
}

function presentSpeechSegment(segment: WaffleSpeechSegment): ChatTurn {
  return presentAssistant(
    `speech-${segment.id}`,
    segment.annotatedText,
    false,
    segment.text,
  )
}

function presentAssistant(
  id: string,
  annotatedText: string,
  live: boolean,
  displayText?: string,
): ChatTurn {
  // Ruby's text carries the bracketed performance tags that drive her face.
  // `segmentTranscript` from `@animated-waffle/avatar` reads them the same way
  // the runtime does, so the chips name the cues the stage is performing and the
  // caption is left clean.
  const segments = segmentTranscript(annotatedText)
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
    role: 'assistant',
    text: displayText?.trim() || caption || stripTags(annotatedText),
    cues,
    live,
  }
}
