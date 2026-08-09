import { describe, expect, it } from 'vitest'

import type { WaffleSpeechSegment, WaffleTranscript } from '@animated-waffle/react'
import { buildChatHistory } from './chat-history'

const transcript: WaffleTranscript[] = [
  { id: 'user-1', role: 'user', text: 'Tell me a joke.', final: true },
  {
    id: 'assistant-1',
    role: 'assistant',
    text: 'Why did the byte cross the bus? It wanted a bit more bandwidth.',
    final: true,
  },
]

const speechSegments: WaffleSpeechSegment[] = [
  {
    id: 'assistant-1:0',
    messageId: 'assistant-1',
    sequence: 0,
    progressId: 101,
    text: 'Why did the byte cross the bus?',
    annotatedText: '[excited] Why did the byte cross the bus?',
  },
  {
    id: 'assistant-1:1',
    messageId: 'assistant-1',
    sequence: 1,
    progressId: 102,
    text: 'It wanted a bit more bandwidth.',
    annotatedText: '[laughing] It wanted a bit more bandwidth.',
  },
]

describe('buildChatHistory', () => {
  it('renders sentence speech segments instead of duplicating the durable turn', () => {
    const turns = buildChatHistory(transcript, speechSegments)

    expect(turns.map(({ id, text }) => ({ id, text }))).toEqual([
      { id: 'turn-0', text: 'Tell me a joke.' },
      { id: 'speech-assistant-1:0', text: 'Why did the byte cross the bus?' },
      { id: 'speech-assistant-1:1', text: 'It wanted a bit more bandwidth.' },
    ])
    expect(turns[1]?.cues).toEqual([
      { tag: 'excited', kind: 'emotion', family: 'anticipation' },
    ])
    expect(turns[2]?.cues).toEqual([
      { tag: 'laughing', kind: 'vocal-action', family: null },
    ])
  })

  it('shows speech immediately before its durable transcript arrives', () => {
    const before = buildChatHistory(transcript.slice(0, 1), speechSegments)
    const after = buildChatHistory(transcript, speechSegments)

    expect(before.map((turn) => turn.id)).toEqual(after.map((turn) => turn.id))
  })

  it('does not flash a durable full-turn bubble before speech reaches playout', () => {
    const turns = buildChatHistory(transcript, [])

    expect(turns).toEqual([{
      id: 'turn-0',
      role: 'user',
      text: 'Tell me a joke.',
      cues: [],
      live: false,
    }])
  })

  it('never treats an interim assistant transcript as spoken text', () => {
    const turns = buildChatHistory([
      transcript[0]!,
      {
        id: 'assistant-live',
        role: 'assistant',
        text: 'A generated reply that has not reached audio yet.',
        final: false,
      },
    ], [])

    expect(turns.map((turn) => turn.text)).toEqual(['Tell me a joke.'])
  })

  it('shows only segments that reached playout when a durable reply has a silent tail', () => {
    const turns = buildChatHistory(transcript, [speechSegments[0]!])

    expect(turns.map(({ id, text }) => ({ id, text }))).toEqual([
      { id: 'turn-0', text: 'Tell me a joke.' },
      { id: 'speech-assistant-1:0', text: 'Why did the byte cross the bus?' },
    ])
    expect(turns.some((turn) => turn.text.includes('bandwidth'))).toBe(false)
  })

  it('keeps plain speech free of performance chips', () => {
    const turns = buildChatHistory([], [{
      id: 'assistant-2:0',
      messageId: 'assistant-2',
      sequence: 0,
      progressId: 201,
      text: 'Plain answer.',
      annotatedText: 'Plain answer.',
    }])

    expect(turns).toEqual([{
      id: 'speech-assistant-2:0',
      role: 'assistant',
      text: 'Plain answer.',
      cues: [],
      live: false,
    }])
  })

  it('updates a stable segment id without drawing a duplicate bubble', () => {
    const original = speechSegments[0]!
    const revised: WaffleSpeechSegment = {
      ...original,
      text: 'Why did the byte cross the system bus?',
      annotatedText: '[sad] Why did the byte cross the [laughing] system bus?',
    }

    const turns = buildChatHistory([], [original, revised])

    expect(turns).toHaveLength(1)
    expect(turns[0]?.text).toBe('Why did the byte cross the system bus?')
    expect(turns[0]?.id).toBe('speech-assistant-1:0')
    expect(turns[0]?.cues).toEqual([
      { tag: 'sad', kind: 'emotion', family: 'sadness' },
      { tag: 'laughing', kind: 'vocal-action', family: null },
    ])
  })

  it('preserves the SDK clean text for CJK captions', () => {
    const turns = buildChatHistory([], [{
      id: 'assistant-cjk:0',
      messageId: 'assistant-cjk',
      sequence: 0,
      progressId: 301,
      text: '你好，世界。今天很高兴见到你！',
      annotatedText: '[excited] 你好，世界。[laughing] 今天很高兴见到你！',
    }])

    expect(turns[0]?.text).toBe('你好，世界。今天很高兴见到你！')
    expect(turns[0]?.cues).toEqual([
      { tag: 'excited', kind: 'emotion', family: 'anticipation' },
      { tag: 'laughing', kind: 'vocal-action', family: null },
    ])
  })
})
