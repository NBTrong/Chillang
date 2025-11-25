import { useMemo } from 'react'
import type { ScriptSegment } from '../types/script'

const demoSegments: ScriptSegment[] = [
  {
    id: 'seg-1',
    sentence: 'Welcome to your personalized language session.',
    startTime: 0,
    endTime: 4.2,
    orderIndex: 0,
  },
  {
    id: 'seg-2',
    sentence: 'We will learn using authentic videos from YouTube.',
    startTime: 4.2,
    endTime: 9.6,
    orderIndex: 1,
  },
  {
    id: 'seg-3',
    sentence: 'Track your vocabulary, practice dictation, and review flashcards.',
    startTime: 9.6,
    endTime: 16.3,
    orderIndex: 2,
  },
]

export function useScript() {
  const segments = useMemo(() => demoSegments, [])
  const currentSegment = segments[0]

  return {
    segments,
    currentSegment,
  }
}

