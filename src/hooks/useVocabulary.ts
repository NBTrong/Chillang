import { useMemo, useState } from 'react'
import type { VocabularyItem, VocabularyFilters } from '../types/vocabulary'

const demoVocabulary: VocabularyItem[] = [
  {
    id: 'vocab-1',
    word: 'Authentic',
    translation: 'genuine',
    notes: 'Use authentic materials for better context.',
    language: 'English',
  },
  {
    id: 'vocab-2',
    word: 'Dictation',
    translation: 'writing what you hear',
    notes: 'Practice listening accuracy.',
    language: 'English',
  },
]

export const defaultVocabularyFilters: VocabularyFilters = {
  keyword: '',
  language: '',
}

export function useVocabulary() {
  const [filters, setFilters] = useState<VocabularyFilters>(() => ({
    ...defaultVocabularyFilters,
  }))

  const items = useMemo(() => {
    return demoVocabulary.filter((item) => {
      const keywordMatch = filters.keyword
        ? item.word.toLowerCase().includes(filters.keyword.toLowerCase())
        : true
      const languageMatch = filters.language
        ? item.language === filters.language
        : true
      return keywordMatch && languageMatch
    })
  }, [filters])

  return {
    items,
    filters,
    setFilters,
  }
}

