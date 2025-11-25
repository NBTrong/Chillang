import { useCallback, useMemo, useState } from 'react'
import { normalizeTranscript } from '../utils/transcription'

const targetSentence =
  'We will learn using authentic videos from YouTube and practice dictation.'

export function useDictation() {
  const [userInput, setUserInput] = useState('')
  const [accuracy, setAccuracy] = useState<number | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const prompt = targetSentence

  const checkAnswer = useCallback(() => {
    setIsLoading(true)
    const normalizedTarget = normalizeTranscript(targetSentence)
    const normalizedInput = normalizeTranscript(userInput)
    const targetWords = normalizedTarget.split(' ')
    const inputWords = normalizedInput.split(' ')
    const matches = targetWords.filter(
      (word, index) => word === inputWords[index],
    )
    setAccuracy(matches.length / targetWords.length)
    setIsLoading(false)
  }, [userInput])

  const stats = useMemo(
    () => ({
      attempts: accuracy ? 1 : 0,
    }),
    [accuracy],
  )

  return {
    prompt,
    userInput,
    accuracy,
    isLoading,
    stats,
    setUserInput,
    checkAnswer,
  }
}

