import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const videoStats = {
  title: 'The Art of Storytelling: How to Captivate Your Audience',
  totalVocabulary: 256,
  difficulty: 'B2 Intermediate',
  cover: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80',
}

const modes = [
  {
    id: 'reading',
    title: 'Reading Comprehension',
    subtitle: 'Đọc hiểu & Tra từ vựng',
    metricLabel: 'Progress',
    metricValue: '75%',
    accentColor: '#4ade80',
    footer: (
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#4ade80]" style={{ width: '75%' }} />
      </div>
    ),
  },
  {
    id: 'listening',
    title: 'Listening Comprehension',
    subtitle: 'Nghe & Làm bài tập Quiz',
    metricLabel: 'High Score',
    metricValue: '92/100',
    accentColor: '#60a5fa',
  },
  {
    id: 'dictation',
    title: 'Dictation',
    subtitle: 'Luyện nghe & Chép chính tả',
    metricLabel: 'Completed',
    metricValue: '15/28 Sentences',
    accentColor: '#fbbf24',
  },
]

const VideoDashboard = () => {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const titleRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    // Tự động focus vào title của video khi màn hình được mở
    titleRef.current?.focus()
  }, [])

  const handleModeClick = (modeId: string) => {
    navigate(`/${videoId}/${modeId}`)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 text-text-primary">
      {/* Header with back button */}

      {/* Current Video Section */}
      <div className="space-y-6">
        <div className="w-full">
          <div
            className="relative w-full overflow-hidden rounded-[32px] border border-border-primary shadow-[0_20px_80px_rgba(0,0,0,0.25)] bg-bg-secondary"
            style={{ aspectRatio: '16/9' }}
          >
            <img
              src={videoStats.cover}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="typo-title text-text-primary outline-none"
        >
          {videoStats.title}
        </h1>

        {/* Description */}
        <p className="typo-body text-text-secondary">
          AI đã phân tích transcript của video này và tạo lộ trình học phù hợp. Hãy chọn một chế độ bên dưới để tiếp tục nhé.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-text-secondary">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>12 phút</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-text-secondary">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Personalized by AI</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border-primary bg-bg-secondary px-5 py-6 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">TOTAL VOCABULARY</p>
          <p className="mt-3 text-4xl font-bold text-text-primary">{videoStats.totalVocabulary}</p>
        </div>
        <div className="rounded-xl border border-border-primary bg-bg-secondary px-5 py-6 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">AI DIFFICULTY</p>
          <p className="mt-3 text-2xl font-bold text-text-primary">{videoStats.difficulty}</p>
        </div>
      </div>

      {/* Mode Selection Section */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-text-tertiary">SELECT A MODE</p>
          <p className="mt-2 text-base text-text-secondary">Chọn chế độ để tiếp tục phiên học của bạn.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {modes.map((mode) => (
              <button
              key={mode.id}
              onClick={() => handleModeClick(mode.id)}
              className="group flex h-full flex-col rounded-xl border border-border-primary bg-bg-secondary p-5 text-left transition-all hover:border-border-primary/80 hover:bg-interactive-hover hover:shadow-lg"
            >
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-accent-primary">
                {mode.id === 'reading' && (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
                {mode.id === 'listening' && (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                )}
                {mode.id === 'dictation' && (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
              {mode.footer}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VideoDashboard

