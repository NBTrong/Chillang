export type VocabularyItem = {
  id: string
  word: string
  translation?: string
  notes?: string
  language: string
  sourceVideoId?: string
  sourceSegmentId?: string
}

export type VocabularyFilters = {
  keyword: string
  language: string
}

export type Flashcard = {
  id: string
  vocabularyId: string
  frontText: string
  backText: string
  difficulty: number
  reviewCount: number
  imageUrl?: string
  nextReviewAt?: string
}

