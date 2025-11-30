import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchVideoByYoutubeId,
  fetchStudySessionByVideoId,
  countVocabularyByVideo,
  fetchReadingSegments,
  type VideoRecord,
  type StudySessionRecord,
} from '../services/supabaseApi'
import { useTranslation } from '../context/LanguageContext'

const VideoDashboard = () => {
  const { t } = useTranslation()
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const modeSectionRef = useRef<HTMLDivElement | null>(null)

  const [video, setVideo] = useState<VideoRecord | null>(null)
  const [session, setSession] = useState<StudySessionRecord | null>(null)
  const [vocabularyCount, setVocabularyCount] = useState<number>(0)
  const [totalSegments, setTotalSegments] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highlightedMode, setHighlightedMode] = useState<string | null>(null)

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

        const videoData = await fetchVideoByYoutubeId(videoId)

        if (!videoData) {
          setError(t('errors.videoNotFound'))
          setIsLoading(false)
          return
        }

        setVideo(videoData)
        
        // Debug: log video title
        console.log('Video title:', videoData.title)

        const [sessionData, vocabCount, segments] = await Promise.all([
          fetchStudySessionByVideoId(videoData.id),
          countVocabularyByVideo(videoData.id),
          fetchReadingSegments(videoData.id).catch(() => []),
        ])

        setSession(sessionData)
        setVocabularyCount(vocabCount)
        setTotalSegments(segments.length)
      } catch (err) {
        console.error('Failed to load video data', err)
        setError(t('errors.dataLoadError'))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [videoId, t])

  // Auto-scroll from top to bottom when video is loaded (only on first visit to any video)
  useEffect(() => {
    if (!isLoading && video && !error) {
      // Check if auto-scroll has already been shown (for any video)
      const storageKey = 'videoDashboardAutoScroll_shown'
      const hasShownAutoScroll = localStorage.getItem(storageKey) === 'true'

      if (hasShownAutoScroll) {
        return // Skip auto-scroll if already shown
      }

      const highlightTimers: number[] = []
      let isCleanedUp = false

      // Wait a bit for content to render
      const timer = setTimeout(() => {
        const startPosition = 0
        const endPosition = document.documentElement.scrollHeight - window.innerHeight
        const duration = 1000 // 1 second
        const startTime = performance.now()

        const animateScroll = (currentTime: number) => {
          if (isCleanedUp) return

          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1)

          // Ease-in function: slow at start, fast at end
          const easeIn = (t: number) => {
            return t * t * t // cubic ease-in
          }

          const currentPosition = startPosition + (endPosition - startPosition) * easeIn(progress)
          window.scrollTo(0, currentPosition)

          if (progress < 1) {
            requestAnimationFrame(animateScroll)
          } else {
            // After scroll completes, start highlighting modes
            const modeIds = ['reading', 'listening', 'dictation']

            modeIds.forEach((modeId, index) => {
              // Start highlight at index * 500ms
              const highlightTimer = window.setTimeout(() => {
                if (isCleanedUp) return
                console.log(`[Highlight] Starting: ${modeId} at index ${index}`)
                setHighlightedMode(modeId)
                // Scroll to mode card if needed
                const modeButton = document.querySelector(`[data-mode-id="${modeId}"]`) as HTMLElement
                if (modeButton) {
                  modeButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
                // Remove highlight after 0.5s, but only if this is still the highlighted mode
                const removeTimer = window.setTimeout(() => {
                  if (isCleanedUp) return
                  console.log(`[Highlight] Removing: ${modeId}`)
                  setHighlightedMode((prev) => {
                    // Only remove if this mode is still highlighted
                    if (prev === modeId) {
                      return null
                    }
                    return prev
                  })

                  // After the last mode is removed, save to localStorage
                  if (modeId === modeIds[modeIds.length - 1]) {
                    localStorage.setItem(storageKey, 'true')
                  }
                }, 500)
                highlightTimers.push(removeTimer)
              }, index * 500)
              highlightTimers.push(highlightTimer)
            })
          }
        }

        // Scroll to top first, then start auto-scroll
        window.scrollTo(0, 0)
        setTimeout(() => {
          if (!isCleanedUp) {
            requestAnimationFrame(animateScroll)
          }
        }, 300)
      }, 500)

      return () => {
        isCleanedUp = true
        clearTimeout(timer)
        highlightTimers.forEach((t) => clearTimeout(t))
        setHighlightedMode(null)
      }
    }
  }, [isLoading, video, error])

  const handleModeClick = (modeId: string) => {
    navigate(`/${videoId}/${modeId}`)
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (t('language.vietnamese') === 'Tiếng Việt') {
      return secs > 0 ? `${mins} phút ${secs} giây` : `${mins} phút`
    }
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }

  const readingProgress = session ? Math.round(session.reading_progress * 100) : 0
  const listeningScore = session?.listening_high_score ?? null
  const dictationCompleted = session?.dictation_completed ?? 0

  const formatDifficulty = (level: string | null): string => {
    if (!level) return 'Chưa đánh giá'
    const levelMap: Record<string, string> = {
      A1: 'A1 Beginner',
      A2: 'A2 Elementary',
      B1: 'B1 Intermediate',
      B2: 'B2 Upper Intermediate',
      C1: 'C1 Advanced',
      C2: 'C2 Proficiency',
      custom: 'Custom',
    }
    return levelMap[level] || level
  }

  const modes = [
    {
      id: 'reading',
      title: t('dashboard.readingTitle'),
      subtitle: t('dashboard.readingSubtitle'),
      metricLabel: t('dashboard.progress'),
      metricValue: `${readingProgress}%`,
      progress: readingProgress,
    },
    {
      id: 'listening',
      title: t('dashboard.listeningTitle'),
      subtitle: t('dashboard.listeningSubtitle'),
      metricLabel: t('dashboard.highScore'),
      metricValue: listeningScore !== null ? `${listeningScore}/100` : t('dashboard.noScore'),
    },
    {
      id: 'dictation',
      title: t('dashboard.dictationTitle'),
      subtitle: t('dashboard.dictationSubtitle'),
      metricLabel: t('dashboard.completed'),
      metricValue:
        totalSegments > 0 ? `${dictationCompleted}/${totalSegments} ${t('dashboard.sentences')}` : t('dashboard.noData'),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent-primary/30 border-t-accent-primary mx-auto" />
          <p className="text-text-secondary">{t('dashboard.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-400">{error || t('errors.videoNotFound')}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary/90"
          >
            {t('common.backToHome')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 text-text-primary">
      {/* Current Video Section */}
      <div className="space-y-6">
        <div className="w-full">
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-border-primary shadow-chill-lg bg-bg-secondary transition-chill hover:shadow-chill-dark"
            style={{ aspectRatio: '16/9' }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${video.youtube_video_id}?rel=0&modestbranding=1`}
              title={video.title || 'YouTube video player'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>

        {/* Title */}
        <h1 ref={titleRef} tabIndex={-1} className="typo-title text-text-primary outline-none">
          {video.title || 'YOUTUBE VIDEO'}
        </h1>

        {/* Action Buttons */}
        {video.duration_seconds && (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-text-secondary transition-chill hover:bg-interactive-hover">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{formatDuration(video.duration_seconds)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border-primary bg-bg-secondary px-5 py-6 shadow-chill-sm transition-chill hover:shadow-chill-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">{t('dashboard.totalVocabulary')}</p>
          {vocabularyCount > 0 ? (
            <p className="mt-3 text-4xl font-bold text-text-primary">{vocabularyCount}</p>
          ) : (
            <p className="mt-3 text-lg font-medium text-text-tertiary">{t('dashboard.noVocabulary')}</p>
          )}
        </div>
        <div className="rounded-lg border border-border-primary bg-bg-secondary px-5 py-6 shadow-chill-sm transition-chill hover:shadow-chill-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">{t('dashboard.aiDifficulty')}</p>
          <p className="mt-3 text-2xl font-bold text-text-primary">
            {formatDifficulty(video.difficulty_level)}
          </p>
        </div>
      </div>

      {/* Mode Selection Section */}
      <div className="space-y-4 outline-none" ref={modeSectionRef} tabIndex={-1}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-tertiary">{t('dashboard.selectMode')}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modes.map((mode) => (
            <button
              key={mode.id}
              data-mode-id={mode.id}
              onClick={() => handleModeClick(mode.id)}
              className={`group flex h-full flex-col rounded-lg border p-5 text-left transition-chill hover-scale hover:border-border-accent hover:bg-interactive-hover hover:shadow-chill-md ${
                highlightedMode === mode.id
                  ? 'border-accent-primary bg-interactive-hover shadow-chill-md scale-105'
                  : 'border-border-primary bg-bg-secondary'
              }`}
            >
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-primary-light/20 text-accent-primary transition-chill group-hover:bg-accent-primary-light/30">
                {mode.id === 'reading' && (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                )}
                {mode.id === 'listening' && (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                )}
                {mode.id === 'dictation' && (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                )}
              </div>

              {/* Title and Subtitle */}
              <div className="mt-5 space-y-1">
                <p className="text-lg font-semibold text-text-primary">{mode.title}</p>
                <p className="text-sm text-text-secondary">{mode.subtitle}</p>
              </div>

              {/* Metric */}
              <div className="mt-auto pt-4 text-sm">
                <span className="text-text-tertiary">{mode.metricLabel}:</span>{' '}
                <span className="font-semibold text-text-primary">{mode.metricValue}</span>
              </div>

              {/* Progress bar for reading mode */}
              {mode.id === 'reading' && mode.progress !== undefined && (
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
                  <div
                    className="h-full rounded-full gradient-secondary transition-all duration-500"
                    style={{ width: `${mode.progress}%` }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VideoDashboard

