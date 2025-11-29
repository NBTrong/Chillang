import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchVideoByYoutubeId,
  fetchStudySessionByVideoId,
  fetchDictationPrompts,
  updateStudySession,
  type VideoRecord,
  type StudySessionRecord,
  type DictationPrompt,
} from '../services/supabaseApi'
import { useTranslation } from '../context/LanguageContext'

type WordComparison = {
  word: string
  isCorrect: boolean
  userWord: string
  correctWord: string
}

type FeedbackState = {
  userAnswer: string
  correctAnswer: string
  wordComparisons: WordComparison[]
  isFullyCorrect: boolean
} | null

// YouTube IFrame API types - using type assertion to avoid conflicts
type YouTubePlayer = {
  getCurrentTime(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  destroy(): void
}

type WindowWithYT = {
  YT?: {
    Player: new (
      id: string | HTMLElement,
      options?: {
        events?: {
          onReady?: (event: { target: YouTubePlayer }) => void
          onStateChange?: () => void
        }
      }
    ) => YouTubePlayer
  }
  onYouTubeIframeAPIReady?: (() => void) | undefined
}

const DictationScreen = () => {
  const { t } = useTranslation()
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  
  // Data states
  const [video, setVideo] = useState<VideoRecord | null>(null)
  const [session, setSession] = useState<StudySessionRecord | null>(null)
  const [prompts, setPrompts] = useState<DictationPrompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI states
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isAnswerChecked, setIsAnswerChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  
  // YouTube player states
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null)
  const youtubeIframeRef = useRef<HTMLIFrameElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const timeCheckIntervalRef = useRef<number | null>(null)

  // Fetch data on mount
  useEffect(() => {
    if (!videoId) {
      setError(t('errors.invalidVideoId'))
      setIsLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch video
        const videoData = await fetchVideoByYoutubeId(videoId)
        if (!videoData) {
          setError(t('errors.videoNotFound'))
          setIsLoading(false)
          return
        }
        setVideo(videoData)

        // Fetch session
        const sessionData = await fetchStudySessionByVideoId(videoData.id)
        if (!sessionData) {
          setError(t('errors.sessionNotFound'))
          setIsLoading(false)
          return
        }
        setSession(sessionData)

        // Fetch dictation prompts
        const promptsData = await fetchDictationPrompts(sessionData.id)
        setPrompts(promptsData)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(t('errors.dataLoadError'))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [videoId, t])

  // Load YouTube IFrame API and initialize player
  useEffect(() => {
    if (!video) return

    const initPlayer = (retryCount = 0) => {
      if (youtubePlayerRef.current) {
        return
      }

      const iframe = youtubeIframeRef.current || (document.getElementById('youtube-player-dictation') as HTMLIFrameElement)
      
      if (!iframe) {
        if (retryCount < 10) {
          setTimeout(() => initPlayer(retryCount + 1), 300)
        }
        return
      }

      const windowWithYT = window as unknown as WindowWithYT
      if (!windowWithYT.YT || !windowWithYT.YT.Player) {
        if (retryCount < 10) {
          setTimeout(() => initPlayer(retryCount + 1), 300)
        }
        return
      }

      try {
        if (!iframe.src || iframe.offsetWidth === 0 || iframe.offsetHeight === 0) {
          if (retryCount < 10) {
            setTimeout(() => initPlayer(retryCount + 1), 300)
          }
          return
        }

        youtubeIframeRef.current = iframe

        youtubePlayerRef.current = new windowWithYT.YT.Player('youtube-player-dictation', {
          events: {
            onReady: () => {
              console.log('YouTube player ready for dictation')
              setIsPlayerReady(true)
            },
            onStateChange: () => {
              // Player state changed
            },
          },
        })
      } catch (error) {
        console.error('Error initializing YouTube player:', error)
        if (retryCount < 5) {
          setTimeout(() => initPlayer(retryCount + 1), 500)
        }
      }
    }

    // Load YouTube IFrame API script if not already loaded
    const windowWithYT = window as unknown as WindowWithYT
    if (!windowWithYT.YT) {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (!existingScript) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      }

      const originalOnReady = windowWithYT.onYouTubeIframeAPIReady
      windowWithYT.onYouTubeIframeAPIReady = () => {
        if (originalOnReady) originalOnReady()
        setTimeout(() => initPlayer(0), 500)
      }
    } else {
      setTimeout(() => initPlayer(0), 500)
    }

    return () => {
      setIsPlayerReady(false)
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy()
        } catch (error) {
          console.error('Error destroying YouTube player:', error)
        }
        youtubePlayerRef.current = null
      }
    }
  }, [video])

  // Play audio when prompt changes
  useEffect(() => {
    if (!isPlayerReady || !youtubePlayerRef.current || prompts.length === 0) return

    const currentPrompt = prompts[currentPromptIndex]
    if (!currentPrompt) return

    // Clear any existing time check interval
    if (timeCheckIntervalRef.current) {
      clearInterval(timeCheckIntervalRef.current)
      timeCheckIntervalRef.current = null
    }

    // Get start and end time from context
    let startTime = 0
    let endTime: number | null = null
    
    if (currentPrompt.context && typeof currentPrompt.context === 'object') {
      if ('start_time' in currentPrompt.context) {
        const time = currentPrompt.context.start_time
        if (typeof time === 'number') {
          startTime = time
        } else if (typeof time === 'string') {
          startTime = parseFloat(time) || 0
        }
      }
      
      if ('end_time' in currentPrompt.context) {
        const time = currentPrompt.context.end_time
        if (typeof time === 'number') {
          endTime = time
        } else if (typeof time === 'string') {
          endTime = parseFloat(time) || null
        }
      }
    }

    // Seek to start time and play
    try {
      youtubePlayerRef.current.seekTo(startTime, true)
      // Small delay before playing to ensure seek completes
      setTimeout(() => {
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.playVideo()
          
          // If we have an end time, set up interval to pause at end_time
          if (endTime !== null && endTime > startTime) {
            timeCheckIntervalRef.current = window.setInterval(() => {
              if (!youtubePlayerRef.current) {
                if (timeCheckIntervalRef.current) {
                  clearInterval(timeCheckIntervalRef.current)
                  timeCheckIntervalRef.current = null
                }
                return
              }
              
              try {
                const currentTime = youtubePlayerRef.current.getCurrentTime()
                if (currentTime >= endTime!) {
                  youtubePlayerRef.current.pauseVideo()
                  if (timeCheckIntervalRef.current) {
                    clearInterval(timeCheckIntervalRef.current)
                    timeCheckIntervalRef.current = null
                  }
                }
              } catch (error) {
                console.error('Error checking video time:', error)
                if (timeCheckIntervalRef.current) {
                  clearInterval(timeCheckIntervalRef.current)
                  timeCheckIntervalRef.current = null
                }
              }
            }, 100) // Check every 100ms
          }
        }
      }, 100)
    } catch (error) {
      console.error('Error playing video:', error)
    }

    // Cleanup interval on unmount or prompt change
    return () => {
      if (timeCheckIntervalRef.current) {
        clearInterval(timeCheckIntervalRef.current)
        timeCheckIntervalRef.current = null
      }
    }
  }, [isPlayerReady, currentPromptIndex, prompts])

  // Reset state when prompt changes
  useEffect(() => {
    setUserInput('')
    setFeedback(null)
    setShowFeedback(false)
    setIsAnswerChecked(false)
    setIsCorrect(false)
    // Auto-focus textarea
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }, [currentPromptIndex])

  const currentPrompt = prompts[currentPromptIndex]
  const totalPrompts = prompts.length
  const progress = totalPrompts > 0 ? ((currentPromptIndex + 1) / totalPrompts) * 100 : 0

  // Normalize text for comparison
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,!?;:]/g, '')
  }

  // Compare texts word by word
  const compareTexts = (userText: string, correctText: string): WordComparison[] => {
    const normalizedUser = normalizeText(userText)
    const normalizedCorrect = normalizeText(correctText)
    
    const userWords = normalizedUser.split(/\s+/).filter(w => w.length > 0)
    const correctWords = normalizedCorrect.split(/\s+/).filter(w => w.length > 0)
    
    const maxLength = Math.max(userWords.length, correctWords.length)
    const comparisons: WordComparison[] = []

    for (let i = 0; i < maxLength; i++) {
      const userWord = userWords[i] || ''
      const correctWord = correctWords[i] || ''
      const isCorrect = userWord === correctWord && userWord !== ''

      comparisons.push({
        word: correctWord || userWord,
        isCorrect,
        userWord,
        correctWord,
      })
    }

    return comparisons
  }

  const handleReplay = useCallback(() => {
    if (!isPlayerReady || !youtubePlayerRef.current || !currentPrompt) return

    // Clear any existing time check interval
    if (timeCheckIntervalRef.current) {
      clearInterval(timeCheckIntervalRef.current)
      timeCheckIntervalRef.current = null
    }

    // Get start and end time from context
    let startTime = 0
    let endTime: number | null = null
    
    if (currentPrompt.context && typeof currentPrompt.context === 'object') {
      if ('start_time' in currentPrompt.context) {
        const time = currentPrompt.context.start_time
        if (typeof time === 'number') {
          startTime = time
        } else if (typeof time === 'string') {
          startTime = parseFloat(time) || 0
        }
      }
      
      if ('end_time' in currentPrompt.context) {
        const time = currentPrompt.context.end_time
        if (typeof time === 'number') {
          endTime = time
        } else if (typeof time === 'string') {
          endTime = parseFloat(time) || null
        }
      }
    }

    try {
      youtubePlayerRef.current.seekTo(startTime, true)
      setTimeout(() => {
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.playVideo()
          
          // If we have an end time, set up interval to pause at end_time
          if (endTime !== null && endTime > startTime) {
            timeCheckIntervalRef.current = window.setInterval(() => {
              if (!youtubePlayerRef.current) {
                if (timeCheckIntervalRef.current) {
                  clearInterval(timeCheckIntervalRef.current)
                  timeCheckIntervalRef.current = null
                }
                return
              }
              
              try {
                const currentTime = youtubePlayerRef.current.getCurrentTime()
                if (currentTime >= endTime!) {
                  youtubePlayerRef.current.pauseVideo()
                  if (timeCheckIntervalRef.current) {
                    clearInterval(timeCheckIntervalRef.current)
                    timeCheckIntervalRef.current = null
                  }
                }
              } catch (error) {
                console.error('Error checking video time:', error)
                if (timeCheckIntervalRef.current) {
                  clearInterval(timeCheckIntervalRef.current)
                  timeCheckIntervalRef.current = null
                }
              }
            }, 100) // Check every 100ms
          }
        }
      }, 100)
    } catch (error) {
      console.error('Error replaying video:', error)
    }
  }, [isPlayerReady, currentPrompt])

  const handleCheckAnswer = async () => {
    if (!currentPrompt || !userInput.trim()) return

    const userText = userInput.trim()
    const correctText = currentPrompt.expected_text.trim()

    const wordComparisons = compareTexts(userText, correctText)
    const fullyCorrect = wordComparisons.every(w => w.isCorrect) && 
                          wordComparisons.length > 0 &&
                          normalizeText(userText) === normalizeText(correctText)

    setFeedback({
      userAnswer: userText,
      correctAnswer: correctText,
      wordComparisons,
      isFullyCorrect: fullyCorrect,
    })
    setShowFeedback(true)
    setIsAnswerChecked(true)
    setIsCorrect(fullyCorrect)

    // Update dictation_completed if answer is correct
    if (fullyCorrect && session) {
      try {
        const newCompleted = Math.max(
          session.dictation_completed || 0,
          currentPromptIndex + 1
        )
        await updateStudySession(session.id, {
          dictation_completed: newCompleted,
        })
        setSession((prev) => 
          prev ? { ...prev, dictation_completed: newCompleted } : null
        )
      } catch (err) {
        console.error('Failed to update dictation_completed:', err)
      }
    }
  }

  const handleNext = () => {
    if (currentPromptIndex < totalPrompts - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1)
    }
  }

  const handleSkip = () => {
    if (currentPromptIndex < totalPrompts - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1)
    }
  }

  const handleClose = () => {
    navigate(`/${videoId}/dash`)
  }

  // Handle input change - hide feedback if wrong answer
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value)
    // Hide feedback if showing and answer was wrong
    if (showFeedback && isAnswerChecked && !isCorrect) {
      setShowFeedback(false)
      setIsAnswerChecked(false)
    }
  }

  // Handle Enter key in textarea
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isAnswerChecked) {
        handleCheckAnswer()
      } else if (isCorrect) {
        handleNext()
      }
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift or Ctrl+Shift: Replay
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        handleReplay()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleReplay])

  const formatDifficulty = (level: string | null): string => {
    if (!level) return 'Intermediate English'
    const levelMap: Record<string, string> = {
      A1: 'Beginner English',
      A2: 'Elementary English',
      B1: 'Intermediate English',
      B2: 'Upper Intermediate English',
      C1: 'Advanced English',
      C2: 'Proficiency English',
      custom: 'Intermediate English',
    }
    return levelMap[level] || 'Intermediate English'
  }

  // Render text with word-by-word highlighting
  const renderTextWithHighlights = (text: string, comparisons: WordComparison[], isUserAnswer: boolean) => {
    const words = text.split(/(\s+)/)
    let comparisonIndex = 0

    return (
      <span>
        {words.map((word, index) => {
          if (/^\s+$/.test(word)) {
            return <span key={index}>{word}</span>
          }

          const comparison = comparisons[comparisonIndex]
          comparisonIndex++

          if (!comparison) {
            return <span key={index}>{word}</span>
          }

          const isCorrect = comparison.isCorrect
          const displayWord = isUserAnswer ? comparison.userWord : comparison.correctWord

          return (
            <span
              key={index}
              className={isCorrect ? 'text-accent-secondary font-semibold' : 'text-error font-semibold'}
            >
              {displayWord || word}
            </span>
          )
        })}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary text-text-primary">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent-primary/30 border-t-accent-primary mx-auto" />
          <p className="text-text-secondary">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !video || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary text-text-primary">
        <div className="text-center">
          <p className="text-lg font-semibold text-error mb-4">{error || t('errors.dataLoadError')}</p>
          <button
            onClick={() => navigate(`/${videoId}/dash`)}
            className="rounded-lg border border-border-primary bg-bg-secondary px-6 py-3 typo-body-sm font-semibold text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale"
          >
            {t('common.backToHome')}
          </button>
        </div>
      </div>
    )
  }

  // Empty state when no prompts
  if (prompts.length === 0) {
    return (
      <div className="flex flex-1 flex-col text-text-primary">
        <div className="flex flex-1 flex-col overflow-auto">
          {/* Breadcrumbs */}
          <div className="mb-6 flex items-center gap-2 typo-body-sm text-text-secondary">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="transition-chill hover:text-accent-primary"
            >
              {t('common.home')}
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => navigate(`/${videoId}/dash`)}
              className="transition-chill hover:text-accent-primary"
            >
              {formatDifficulty(video.difficulty_level)}
            </button>
            <span>/</span>
            <span className="text-text-primary">{t('dictation.title')}</span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
            <div className="text-center max-w-md">
              <p className="text-lg font-semibold text-text-secondary mb-4">
                {t('dictation.noPrompts')}
              </p>
              <p className="typo-body text-text-tertiary mb-6">
                {t('dictation.noPromptsMessage')}
              </p>
              <button
                onClick={() => navigate(`/${videoId}/dash`)}
                className="rounded-lg border border-border-primary bg-bg-secondary px-6 py-3 typo-body-sm font-semibold text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale"
              >
                {t('common.backToHome')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isLastPrompt = currentPromptIndex === totalPrompts - 1

  return (
    <div className="flex flex-1 flex-col text-text-primary">
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 typo-body-sm text-text-secondary">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="transition-chill hover:text-accent-primary"
        >
          {t('common.home')}
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigate(`/${videoId}/dash`)}
          className="transition-chill hover:text-accent-primary"
        >
          {formatDifficulty(video.difficulty_level)}
        </button>
        <span>/</span>
        <span className="text-text-primary">{t('dictation.title')}</span>
      </div>

        <div className="mx-auto w-full max-w-6xl px-6 pb-4">
          {/* YouTube Video Player - Smaller size */}
          <div className="mb-4">
            <div 
              className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-border-primary bg-bg-secondary shadow-chill-md transition-chill" 
              style={{ aspectRatio: '16/9' }}
            >
              <iframe
                id="youtube-player-dictation"
                ref={youtubeIframeRef}
                src={`https://www.youtube.com/embed/${video.youtube_video_id}?rel=0&modestbranding=1&enablejsapi=1&autoplay=0&controls=0&disablekb=1`}
                title={video.title || 'YouTube video player'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full">
            <div className="w-full max-w-3xl space-y-6">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between typo-body-sm text-text-secondary">
              <span className="font-medium">{t('dictation.question')} {currentPromptIndex + 1}/{totalPrompts}</span>
              <span className="text-xs text-text-tertiary">
                Cmd+Shift: {t('dictation.replay')} • Enter: {t('dictation.checkAnswer')}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
              <div
                className="h-full rounded-full gradient-secondary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Completion Message */}
          {isLastPrompt && showFeedback && feedback?.isFullyCorrect && (
            <div className="rounded-xl border border-accent-secondary bg-accent-secondary/10 p-4 text-center shadow-chill-md">
              <p className="typo-title text-accent-secondary mb-2">{t('dictation.completed')}</p>
              <p className="typo-body text-text-secondary">
                {t('dictation.completedMessage')}
              </p>
            </div>
          )}

          {/* Input Section */}
          <div className="relative">
            <div className="relative rounded-2xl border border-border-primary bg-bg-secondary p-4 shadow-chill-sm transition-chill focus-within:border-border-accent focus-within:shadow-chill-md">
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleTextareaKeyDown}
                placeholder={t('dictation.inputPlaceholder')}
                disabled={showFeedback && isAnswerChecked && isCorrect && !isLastPrompt}
                className="w-full resize-none bg-transparent typo-subtitle text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:opacity-50"
                rows={4}
              />
              
              {/* Action Buttons */}
              <div className="absolute bottom-6 right-6 flex items-center gap-3">
                {/* Check Answer Button */}
                {!isAnswerChecked && (
                  <button
                    type="button"
                    onClick={handleCheckAnswer}
                    disabled={!userInput.trim()}
                    className={`flex h-12 w-12 items-center justify-center rounded-full border border-accent-primary bg-bg-tertiary text-accent-primary transition-chill hover:bg-accent-primary hover:text-white hover-scale disabled:opacity-50 disabled:cursor-not-allowed ${
                      userInput.trim() ? 'border-accent-primary' : 'border-border-primary'
                    }`}
                    aria-label={t('dictation.checkAnswer')}
                    title={t('dictation.checkAnswer') + ' (Enter)'}
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                )}
                {/* Skip Button */}
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLastPrompt}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border border-border-primary bg-bg-tertiary text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale ${
                    isLastPrompt ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label={t('dictation.skip')}
                  title={t('dictation.skip')}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          {showFeedback && feedback && (
            <div className="space-y-3 rounded-xl border border-border-accent bg-bg-secondary p-4 shadow-chill-md transition-chill">
              {feedback.isFullyCorrect && (
                <div className="rounded-lg border border-accent-secondary bg-accent-secondary/10 p-3 mb-3">
                  <p className="typo-body-sm font-semibold text-accent-secondary">
                    {t('dictation.correct')}
                  </p>
                  {!isLastPrompt && (
                    <p className="typo-body-sm text-text-tertiary mt-2">
                      {t('dictation.nextQuestion')}
                    </p>
                  )}
                </div>
              )}
              {/* {!feedback.isFullyCorrect && (
                <div className="rounded-lg border border-error/30 bg-error/5 p-3 mb-3">
                  <p className="typo-body-sm font-semibold text-error">
                    {t('dictation.incorrect')}
                  </p>
                </div>
              )} */}
              <div className="space-y-2">
                <p className="typo-body-sm text-text-secondary">{t('dictation.yourAnswer')}</p>
                <p className="typo-body text-text-primary">
                  {renderTextWithHighlights(feedback.userAnswer, feedback.wordComparisons, true)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="typo-body-sm text-text-secondary">{t('dictation.correctAnswer')}</p>
                <p className="typo-body text-text-primary">
                  {renderTextWithHighlights(feedback.correctAnswer, feedback.wordComparisons, false)}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isAnswerChecked && isCorrect && !isLastPrompt && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl gradient-primary px-8 py-3 text-base font-semibold text-white shadow-glow-primary-light transition-chill hover-scale hover:shadow-glow-primary"
              >
                {t('dictation.nextQuestion')}
              </button>
            </div>
          )}
          {isAnswerChecked && isCorrect && isLastPrompt && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl gradient-primary px-8 py-3 text-base font-semibold text-white shadow-glow-primary-light transition-chill hover-scale hover:shadow-glow-primary"
              >
                {t('dictation.backToDashboard')}
              </button>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DictationScreen
