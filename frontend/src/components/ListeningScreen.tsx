import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchVideoByYoutubeId,
  fetchStudySessionByVideoId,
  fetchListeningQuiz,
  fetchReadingSegments,
  updateStudySession,
  generateMoreQuestions,
  type VideoRecord,
  type StudySessionRecord,
  type ListeningQuizQuestion,
  type ReadingSegment,
} from '../services/supabaseApi'
import { useTranslation } from '../context/LanguageContext'

// Helper to get YouTube embed URL with proper origin for PWA
const getYouTubeEmbedUrl = (videoId: string, additionalParams: string = '') => {
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : ''
  const baseParams = `rel=0&modestbranding=1&playsinline=1&origin=${encodeURIComponent(origin)}`
  const params = additionalParams ? `${baseParams}&${additionalParams}` : baseParams
  return `https://www.youtube.com/embed/${videoId}?${params}`
}

type Question = {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  userAnswer?: number
  feedback: string
  timestamp: string
  referenceStartMs: number | null
  referenceEndMs: number | null
}

type TranscriptEntry = {
  timestamp: string
  text: string
  highlighted?: boolean
  startMs: number | null
  endMs: number | null
}

// YouTube IFrame API types
declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
  
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace YT {
    class Player {
      constructor(id: string | HTMLElement, options?: PlayerOptions)
      getCurrentTime(): number
      seekTo(seconds: number, allowSeekAhead?: boolean): void
      destroy(): void
    }

    interface PlayerOptions {
      events?: {
        onReady?: (event: OnReadyEvent) => void
        onStateChange?: () => void
      }
    }

    interface OnReadyEvent {
      target: Player
    }
  }
}

const ListeningScreen = () => {
  const { t } = useTranslation()
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const [autoScroll] = useState(true)
  const [showTranscript, setShowTranscript] = useState(true)
  
  // Data states
  const [video, setVideo] = useState<VideoRecord | null>(null)
  const [session, setSession] = useState<StudySessionRecord | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Quiz states
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Refs for height synchronization
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const transcriptContainerRef = useRef<HTMLDivElement>(null)
  const transcriptScrollRef = useRef<HTMLDivElement>(null)
  const youtubePlayerRef = useRef<YT.Player | null>(null)
  const youtubeIframeRef = useRef<HTMLIFrameElement | null>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  // Memoize YouTube embed URL to ensure origin is set correctly
  const youtubeEmbedUrl = useMemo(() => {
    if (!video) return ''
    return getYouTubeEmbedUrl(video.youtube_video_id, 'enablejsapi=1')
  }, [video])

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatMsToTimestamp = (ms: number | null): string => {
    if (ms === null) return '0:00'
    const totalSeconds = Math.floor(ms / 1000)
    return formatTime(totalSeconds)
  }

  // Transform database question to component question
  const transformQuestion = (dbQuestion: ListeningQuizQuestion): Question => {
    // Combine correct option and distractors, shuffle them
    const allOptions = [dbQuestion.correct_option, ...dbQuestion.distractors]
    // Shuffle to randomize order
    const shuffled = [...allOptions].sort(() => Math.random() - 0.5)
    const correctAnswerIndex = shuffled.indexOf(dbQuestion.correct_option)
    
    // Build feedback message
    const timestampStr = dbQuestion.reference_start_ms 
      ? formatMsToTimestamp(dbQuestion.reference_start_ms)
      : ''
    let feedback = dbQuestion.explanation || ''
    if (timestampStr && !feedback.includes('[')) {
      feedback = feedback || `The answer can be found at [${timestampStr}].`
    }

    return {
      id: dbQuestion.id,
      question: dbQuestion.prompt,
      options: shuffled,
      correctAnswer: correctAnswerIndex,
      feedback,
      timestamp: timestampStr,
      referenceStartMs: dbQuestion.reference_start_ms,
      referenceEndMs: dbQuestion.reference_end_ms,
    }
  }

  // Transform reading segments to transcript entries
  const transformTranscript = (segments: ReadingSegment[]): TranscriptEntry[] => {
    return segments.map((segment, index) => {
      const startMs = segment.starts_at_ms
      // Calculate endMs: use segment's ends_at_ms, or next segment's startMs, or default duration
      let endMs: number | null = segment.ends_at_ms
      if (endMs === null && index < segments.length - 1 && segments[index + 1].starts_at_ms !== null) {
        endMs = segments[index + 1].starts_at_ms
      } else if (endMs === null && startMs !== null) {
        // Default to 2 seconds duration if no end time
        endMs = startMs + 2000
      }

      return {
        timestamp: formatMsToTimestamp(startMs),
        text: segment.original_text,
        highlighted: false, // Will be set dynamically based on video time
        startMs,
        endMs,
      }
    })
  }

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

        // Fetch session and quiz in parallel
        const [sessionData, segments] = await Promise.all([
          fetchStudySessionByVideoId(videoData.id),
          fetchReadingSegments(videoData.id).catch(() => [] as ReadingSegment[]),
        ])

        if (!sessionData) {
          setError(t('errors.sessionNotFound'))
          setIsLoading(false)
          return
        }
        setSession(sessionData)

        // Fetch quiz
        try {
          const quizData = await fetchListeningQuiz(sessionData.id)
          
          if (!quizData) {
            // No quiz found - this is okay, just show empty state
            setQuestions([])
          // Still show transcript if available
          const transformedTranscript = transformTranscript(segments)
            setTranscriptEntries(transformedTranscript)
          } else {
            const { questions: dbQuestions } = quizData
            
            // Transform questions
            const transformedQuestions = dbQuestions.map((q) => transformQuestion(q))
            setQuestions(transformedQuestions)

          // Transform transcript
          const transformedTranscript = transformTranscript(segments)
            setTranscriptEntries(transformedTranscript)

            // Set initial score from session if available
            if (sessionData.listening_high_score !== null) {
              setScore(sessionData.listening_high_score)
              setIsSubmitted(true) // If there's a high score, assume quiz was already submitted
            }
          }
        } catch (quizError) {
          console.error('Failed to load quiz:', quizError)
          // Don't set error, just show empty quiz state
          setQuestions([])
          const transformedTranscript = transformTranscript(segments)
          setTranscriptEntries(transformedTranscript)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(t('errors.dataLoadError'))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [videoId, t])

  // Sync transcript height with video height (only on desktop where they're side-by-side)
  useEffect(() => {
    if (!video || !showTranscript) return

    const syncHeight = () => {
      // Only sync on desktop (lg breakpoint, 1024px+)
      if (window.innerWidth < 1024) {
        // On mobile/tablet, remove height constraint
        if (transcriptContainerRef.current) {
          transcriptContainerRef.current.style.height = ''
          transcriptContainerRef.current.style.maxHeight = ''
        }
        return true
      }

      if (videoContainerRef.current && transcriptContainerRef.current) {
        const videoHeight = videoContainerRef.current.offsetHeight
        // Only sync if video has a valid height (greater than 0)
        if (videoHeight > 0) {
          transcriptContainerRef.current.style.height = `${videoHeight}px`
          transcriptContainerRef.current.style.maxHeight = `${videoHeight}px`
          return true // Successfully synced
        }
      }
      return false // Not synced yet
    }

    // Try to sync immediately
    const synced = syncHeight()
    
    // If not synced, use interval to keep trying
    let intervalId: number | null = null
    if (!synced) {
      intervalId = window.setInterval(() => {
        if (syncHeight()) {
          // Successfully synced, clear interval
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
        }
      }, 50) // Check every 50ms
    }

    // Also try after delays to catch late-loading videos
    const timeoutId1 = setTimeout(() => {
      syncHeight()
    }, 100)
    
    const timeoutId2 = setTimeout(() => {
      syncHeight()
      // Clear interval after final attempt
      if (intervalId) {
        clearInterval(intervalId)
      }
    }, 1000)

    window.addEventListener('resize', syncHeight)
    
    // Use ResizeObserver for more accurate tracking
    let resizeObserver: ResizeObserver | null = null
    const videoContainer = videoContainerRef.current
    const setupObserver = () => {
      const container = videoContainerRef.current
      if (container) {
        resizeObserver = new ResizeObserver((entries) => {
          // Only sync if the observed element has a valid height
          for (const entry of entries) {
            if (entry.contentRect.height > 0) {
              syncHeight()
              // Clear interval once ResizeObserver is working
              if (intervalId) {
                clearInterval(intervalId)
                intervalId = null
              }
            }
          }
        })
        resizeObserver.observe(container)
      } else {
        // Retry observer setup if container not ready
        setTimeout(setupObserver, 100)
      }
    }
    setupObserver()

    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      if (intervalId) {
        clearInterval(intervalId)
      }
      window.removeEventListener('resize', syncHeight)
      if (resizeObserver && videoContainer) {
        resizeObserver.unobserve(videoContainer)
      }
    }
  }, [video, showTranscript])

  // Load YouTube IFrame API and initialize player
  useEffect(() => {
    if (!video) return

    const initPlayer = (retryCount = 0) => {
      // Don't retry if player is already initialized
      if (youtubePlayerRef.current) {
        console.log('Player already initialized, skipping')
        return
      }

      // Use ref first, fallback to getElementById
      const iframe = youtubeIframeRef.current || (document.getElementById('youtube-player') as HTMLIFrameElement)
      
      if (!iframe) {
        if (retryCount < 10) {
          console.log('Iframe not found, retrying...', retryCount)
          setTimeout(() => initPlayer(retryCount + 1), 300)
        }
        return
      }

      if (!window.YT || !window.YT.Player) {
        if (retryCount < 10) {
          console.log('YT API not loaded yet, retrying...', retryCount)
          setTimeout(() => initPlayer(retryCount + 1), 300)
        }
        return
      }

      // Don't initialize if already initialized
      if (youtubePlayerRef.current) {
        console.log('Player already exists, skipping initialization')
        return
      }

      try {
        // Check if iframe has src and is visible
        if (!iframe.src || iframe.offsetWidth === 0 || iframe.offsetHeight === 0) {
          if (retryCount < 10) {
            console.log('Iframe not ready yet, retrying...', retryCount)
            setTimeout(() => initPlayer(retryCount + 1), 300)
          }
          return
        }

        // Store iframe reference
        youtubeIframeRef.current = iframe

        // Initialize player - YT.Player will wrap the existing iframe
        youtubePlayerRef.current = new window.YT.Player('youtube-player', {
          events: {
            onReady: () => {
              console.log('YouTube player ready')
              setIsPlayerReady(true)
            },
            onStateChange: () => {
              // Player state changed (playing, paused, etc.)
            },
          },
        })
        console.log('YouTube player initialized successfully')
      } catch (error) {
        console.error('Error initializing YouTube player:', error)
        // Retry if failed
        if (retryCount < 5) {
          setTimeout(() => initPlayer(retryCount + 1), 500)
        }
      }
    }

    // Load YouTube IFrame API script if not already loaded
    if (!window.YT) {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (!existingScript) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      }

      // Wait for API to be ready
      const originalOnReady = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube IFrame API ready')
        if (originalOnReady) originalOnReady()
        // Wait a bit more for iframe to be ready
        setTimeout(() => initPlayer(0), 500)
      }
    } else {
      // API already loaded, wait for iframe to be ready
      console.log('YouTube IFrame API already loaded')
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

  // Track video time and update transcript highlights
  useEffect(() => {
    if (!isPlayerReady || !youtubePlayerRef.current || transcriptEntries.length === 0) {
      console.log('Waiting for player or transcript:', {
        isPlayerReady,
        hasPlayer: !!youtubePlayerRef.current,
        transcriptLength: transcriptEntries.length
      })
      return
    }

    console.log('Starting highlight tracking', {
      transcriptEntries: transcriptEntries.length,
      firstEntry: transcriptEntries[0]
    })

    const updateHighlights = () => {
      try {
        if (!youtubePlayerRef.current) {
          // Fallback: try to get time from iframe using postMessage
          if (youtubeIframeRef.current?.contentWindow) {
            youtubeIframeRef.current.contentWindow.postMessage('{"event":"command","func":"getCurrentTime","args":""}', '*')
          }
          return
        }
        
        const currentTime = youtubePlayerRef.current.getCurrentTime()
        if (isNaN(currentTime) || currentTime < 0) return
        
        const currentTimeMs = Math.floor(currentTime * 1000)

        // Update transcript entries with highlights
        setTranscriptEntries((prevEntries) => {
          if (prevEntries.length === 0) return prevEntries

          // Find the segment that should be highlighted
          // Only one segment should be highlighted at a time
          // If multiple segments match (overlap), choose the one with startMs closest to currentTime
          let highlightedIndex = -1
          let closestStartMs = -1

          prevEntries.forEach((entry, index) => {
            if (entry.startMs !== null && entry.startMs !== undefined) {
              // Use endMs if available, otherwise use next segment's startMs or default duration
              let endMs: number
              if (entry.endMs !== null && entry.endMs !== undefined) {
                endMs = entry.endMs
              } else if (index < prevEntries.length - 1 && prevEntries[index + 1].startMs !== null) {
                endMs = prevEntries[index + 1].startMs!
              } else {
                // Default to 2 seconds duration if no end time
                endMs = entry.startMs + 2000
              }
              
              // Check if current time is within this segment's range
              if (currentTimeMs >= entry.startMs && currentTimeMs < endMs) {
                // If this is the first match, or this segment started more recently
                if (highlightedIndex === -1 || entry.startMs > closestStartMs) {
                  highlightedIndex = index
                  closestStartMs = entry.startMs
                }
              }
            }
          })

          // Only update if highlight changed to avoid unnecessary re-renders
          const needsUpdate = prevEntries.some((entry, index) => 
            entry.highlighted !== (index === highlightedIndex)
          )

          if (!needsUpdate) return prevEntries

          // Update all entries - only highlight the selected one
          const updated = prevEntries.map((entry, index) => ({
            ...entry,
            highlighted: index === highlightedIndex,
          }))

          // Auto-scroll to highlighted entry
          if (autoScroll && transcriptScrollRef.current && highlightedIndex >= 0) {
            const highlightedElement = transcriptScrollRef.current.children[highlightedIndex] as HTMLElement
            if (highlightedElement) {
              console.log('Scrolling to highlighted segment:', highlightedIndex)
              highlightedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
            } else {
              console.warn('Highlighted element not found at index:', highlightedIndex)
            }
          }

          return updated
        })
      } catch (error) {
        // Player might not be ready yet
        console.error('Error getting video time:', error)
      }
    }

    // Update every 100ms for smoother highlighting
    const intervalId = setInterval(updateHighlights, 100)

    return () => {
      clearInterval(intervalId)
    }
  }, [autoScroll, isPlayerReady, video, transcriptEntries.length])

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    if (isSubmitted) return // Don't allow changes after submission
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }))
  }

  // Handle transcript segment click - seek video to that time
  const handleSegmentClick = (startMs: number | null) => {
    if (!startMs || !youtubePlayerRef.current || !isPlayerReady) {
      return
    }

    try {
      const seconds = startMs / 1000
      youtubePlayerRef.current.seekTo(seconds, true)
    } catch (error) {
      console.error('Failed to seek video:', error)
    }
  }

  // Handle quiz submission
  const handleSubmit = async () => {
    if (isSubmitted) return

    // Calculate score
    let correctCount = 0
    questions.forEach((q) => {
      const userAnswer = userAnswers[q.id]
      if (userAnswer !== undefined && userAnswer === q.correctAnswer) {
        correctCount++
      }
    })

    const newScore = questions.length > 0 
      ? Math.round((correctCount / questions.length) * 100)
      : 0

    setScore(newScore)
    setIsSubmitted(true)

    // Update session high score if this is higher
    if (session && (session.listening_high_score === null || newScore > session.listening_high_score)) {
      try {
        await updateStudySession(session.id, {
          listening_high_score: newScore,
        })
        setSession((prev) => 
          prev ? { ...prev, listening_high_score: newScore } : null
        )
      } catch (err) {
        console.error('Failed to update high score:', err)
      }
    }
  }

  // Handle generate more questions
  const handleGenerateMore = async () => {
    if (!session || isGenerating) return

    try {
      setIsGenerating(true)
      const result = await generateMoreQuestions(session.id)
      
      if (result?.success) {
        // Reload quiz to get new questions
        const quizData = await fetchListeningQuiz(session.id)
        if (quizData) {
          const { questions: dbQuestions } = quizData
          const transformedQuestions = dbQuestions.map((q) => transformQuestion(q))
          setQuestions(transformedQuestions)
          // Reset user answers for new questions
          setUserAnswers({})
        }
      }
    } catch (err) {
      console.error('Failed to generate more questions:', err)
      alert(t('errors.generateQuestionsError'))
    } finally {
      setIsGenerating(false)
    }
  }

  // Format difficulty for breadcrumb
  // const formatDifficulty = (level: string | null): string => {
  //   if (!level) return t('difficulty.B1')
  //   const levelMap: Record<string, string> = {
  //     A1: t('difficulty.A1'),
  //     A2: t('difficulty.A2'),
  //     B1: t('difficulty.B1'),
  //     B2: t('difficulty.B2'),
  //     C1: t('difficulty.C1'),
  //     C2: t('difficulty.C2'),
  //     custom: t('difficulty.custom'),
  //   }
  //   return levelMap[level] || t('difficulty.B1')
  // }

  // const difficultyLabel = video ? formatDifficulty(video.difficulty_level) : t('difficulty.B1')

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent-primary/30 border-t-accent-primary mx-auto" />
          <p className="text-text-secondary">{t('listening.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-error mb-4">{error || t('errors.videoNotFound')}</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border border-border-primary bg-bg-secondary px-6 py-3 typo-body-sm font-semibold text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale"
          >
            {t('common.backToHome')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col text-text-primary">
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 overflow-hidden typo-body-sm text-text-secondary">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-shrink-0 transition-chill hover:text-accent-primary whitespace-nowrap"
          >
            {t('listening.home')}
          </button>
          <span className="flex-shrink-0">/</span>
          <button
            type="button"
            onClick={() => navigate(`/${videoId}/dash`)}
            className="truncate transition-chill hover:text-accent-primary min-w-0"
          >
            Dash
          </button>
          <span className="flex-shrink-0">/</span>
          <span className="truncate text-text-primary min-w-0">{t('listening.comprehension')}</span>
        </div>

        {/* Title and Instruction */}
        <div className="mb-6">
          <h2 className="mb-2 typo-title text-text-primary">{video.title || t('listening.comprehension')}</h2>
          <p className="typo-body text-text-secondary">
            {t('listening.instruction')}
          </p>
        </div>

        {/* Video and Transcript Section */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          {/* Video Player */}
          <div 
            ref={videoContainerRef}
            className="relative w-full overflow-hidden rounded-xl border border-border-primary bg-bg-secondary shadow-chill-md transition-chill" 
            style={{ aspectRatio: '16/9' }}
          >
            <iframe
              id="youtube-player"
              ref={youtubeIframeRef}
              src={youtubeEmbedUrl}
              title={video.title || 'YouTube video player'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              className="absolute inset-0 h-full w-full"
            />
          </div>

          {/* Transcript Panel */}
          <div 
            ref={transcriptContainerRef}
            className="flex w-full flex-col transition-chill relative rounded-xl lg:w-auto"
          >
            <div 
              ref={transcriptScrollRef}
              className="flex-1 space-y-2 overflow-y-auto typo-body min-h-0 max-h-80 transition-all duration-300 rounded-lg lg:max-h-none"
            >
              {transcriptEntries.map((entry, index) => (
                <div
                  key={index}
                  onClick={() => handleSegmentClick(entry.startMs)}
                  className={`rounded-lg p-2 transition-all duration-200 ease-in-out cursor-pointer md:p-3 ${
                    !showTranscript ? 'blur-md select-none pointer-events-none' : ''
                  } ${
                    entry.highlighted
                      ? 'border border-border-accent bg-accent-primary-light/20 text-accent-primary shadow-chill-sm'
                      : 'border border-transparent bg-bg-tertiary text-text-secondary hover:bg-interactive-hover hover:border-border-accent'
                  }`}
                  style={{
                    transitionProperty: 'background-color, border-color, color, box-shadow, filter',
                  }}
                >
                  <span className={`typo-caption transition-colors duration-200 ${
                    entry.highlighted ? 'text-accent-primary/70' : 'text-text-tertiary'
                  }`}>[{entry.timestamp}]</span>{' '}
                  <span className={`transition-all duration-200 ${
                    entry.highlighted ? 'font-medium' : ''
                  }`}>{entry.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="mb-8 flex flex-wrap items-center gap-2 md:gap-3">
          {isSubmitted && score !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-border-accent bg-accent-secondary/10 px-4 py-2 shadow-chill-sm md:gap-4 md:px-6 md:py-3">
              <p className="typo-caption text-text-tertiary">{t('listening.result')}</p>
              <p className="typo-title leading-none text-accent-secondary">{score}/100</p>
            </div>
          )}
          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(userAnswers).length === 0 || questions.length === 0}
              className="rounded-lg border border-accent-primary bg-accent-primary px-4 py-2 typo-body-sm font-semibold text-white transition-chill hover:bg-accent-primary/90 hover-scale disabled:opacity-50 disabled:cursor-not-allowed md:px-6 md:py-3"
            >
              {t('listening.submitAnswers')}
            </button>
          )}
          {isSubmitted && (
            <button
              onClick={() => {
                setIsSubmitted(false)
                setUserAnswers({})
                setScore(null)
              }}
              className="rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 typo-body-sm font-semibold text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale md:px-6 md:py-3"
            >
              {t('listening.tryAgain')}
            </button>
          )}
          {!isSubmitted && (
            <button
              onClick={handleGenerateMore}
              disabled={isGenerating}
              className="rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 typo-body-sm font-semibold text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale disabled:opacity-50 disabled:cursor-not-allowed md:px-6 md:py-3"
            >
              {isGenerating 
                ? t('listening.generating')
                : questions.length === 0 
                  ? t('listening.generateQuestions')
                  : t('listening.generateMore')}
            </button>
          )}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="rounded-lg border border-border-primary bg-bg-secondary px-4 py-2 typo-body-sm font-semibold text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale md:px-6 md:py-3"
          >
            {showTranscript ? t('listening.hideTranscript') : t('listening.showTranscript')}
          </button>
        </div>

        {/* Questions Section */}
        {questions.length === 0 ? (
          <div className="rounded-xl border border-border-primary bg-bg-secondary p-8 text-center">
            <p className="typo-body text-text-secondary mb-4">
              {t('listening.noQuestions')}
            </p>
            <p className="typo-body-sm text-text-tertiary">
              {t('listening.noQuestionsMessage')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q) => {
              const userAnswer = userAnswers[q.id]
              const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer
              const isIncorrect = userAnswer !== undefined && userAnswer !== q.correctAnswer

              return (
                <div key={q.id} className="rounded-xl border border-border-primary bg-bg-secondary p-6 shadow-chill-sm transition-chill hover:shadow-chill-md">
                  <h3 className="mb-4 typo-subtitle font-semibold text-text-primary">{q.question}</h3>
                  <div className="space-y-3">
                    {q.options.map((option, index) => {
                      const isSelected = userAnswer === index
                      const isCorrectOption = index === q.correctAnswer
                      let optionStyle = 'border-border-primary bg-bg-tertiary text-text-secondary'

                      if (isSubmitted) {
                        if (isSelected && isCorrect) {
                          optionStyle = 'border-accent-secondary bg-accent-secondary/10 text-accent-secondary'
                        } else if (isSelected && isIncorrect) {
                          optionStyle = 'border-error bg-error/10 text-error'
                        } else if (isCorrectOption && isIncorrect) {
                          optionStyle = 'border-accent-secondary/50 bg-accent-secondary/5 text-accent-secondary'
                        }
                      } else if (isSelected) {
                        optionStyle = 'border-accent-primary bg-accent-primary-light/20 text-accent-primary'
                      }

                      return (
                        <label
                          key={index}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-chill ${optionStyle} ${
                            !isSubmitted && !isSelected ? 'hover:bg-interactive-hover hover:border-border-accent hover-scale' : ''
                          } ${isSubmitted ? 'cursor-default' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(q.id, index)}
                            disabled={isSubmitted}
                            className="sr-only"
                          />
                          <div className="mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-current">
                            {isSelected && (
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${
                                  isSubmitted
                                    ? isCorrect
                                      ? 'bg-accent-secondary shadow-glow-primary-light'
                                      : 'bg-error'
                                    : 'bg-accent-primary'
                                }`}
                              />
                            )}
                          </div>
                          <span className="flex-1 typo-body-sm">{option}</span>
                        </label>
                      )
                    })}
                  </div>
                  {isSubmitted && (isCorrect || isIncorrect) && (
                    <div
                      className={`mt-4 rounded-lg border p-4 transition-chill ${
                        isCorrect 
                          ? 'border-border-accent bg-accent-secondary/10 text-accent-secondary shadow-chill-sm' 
                          : 'border-error/30 bg-error/5 text-error'
                      }`}
                    >
                      <p className="typo-body-sm">
                        {isCorrect ? t('listening.correct') : t('listening.incorrect')}
                        {q.feedback}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ListeningScreen

