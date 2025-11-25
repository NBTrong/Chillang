import { useMemo } from 'react'
import type { Flashcard } from '../types/vocabulary'

const demoCards: Flashcard[] = [
  {
    id: 'card-1',
    vocabularyId: 'vocab-1',
    frontText: 'Authentic',
    backText: 'Real, not imitation',
    difficulty: 2,
    reviewCount: 3,
  },
  {
    id: 'card-2',
    vocabularyId: 'vocab-2',
    frontText: 'Dictation',
    backText: 'Writing what you hear',
    difficulty: 3,
    reviewCount: 5,
  },
]

export function useFlashcard() {
  const cards = useMemo(() => demoCards, [])
  const stats = useMemo(
    () => ({
      today: 8,
      mastered: 24,
      streak: 6,
    }),
    [],
  )

  return {
    cards,
    stats,
  }
}

