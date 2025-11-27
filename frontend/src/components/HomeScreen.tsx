import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

const extractYoutubeId = (url: string) => {
  const pattern =
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})|v=([\w-]{6,})/
  const match = url.match(pattern)
  return match?.[1] || match?.[2] || 'new-session'
}

const HomeScreen = () => {
  const navigate = useNavigate()
  const [videoUrl, setVideoUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const processingTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (processingTimer.current) {
        window.clearTimeout(processingTimer.current)
      }
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!videoUrl.trim()) return

    setIsProcessing(true)
    const videoId = extractYoutubeId(videoUrl.trim())

    processingTimer.current = window.setTimeout(() => {
      processingTimer.current = null
      setIsProcessing(false)
      setVideoUrl('')
      navigate(`/${videoId}/dash`)
    }, 900)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Hero copy trên, input bên dưới */}
        <div className="space-y-3">
          <h1 className="typo-display text-text-primary">
            Bạn muốn học gì hôm nay?
          </h1>
          <p className="typo-body mx-auto max-w-xl text-text-secondary">
            Dán link một video YouTube và bắt đầu một phiên học mới.
          </p>
        </div>

        {/* Main input */}
        <div className="space-y-4">
          <form
            onSubmit={handleSubmit}
            className="relative mx-auto flex w-full max-w-2xl items-center gap-4 rounded-[32px] border border-border-primary bg-bg-secondary/90 px-6 py-3 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur-lg"
          >
            <input
              type="url"
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="Dán link YouTube video vào đây..."
              className="flex-1 border-none bg-transparent text-base text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary text-xl text-white transition hover:bg-accent-primary-hover disabled:cursor-wait disabled:bg-accent-primary/70"
                aria-label="Gửi link video"
              >
                {isProcessing ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {isProcessing && (
            <div className="text-sm font-medium text-accent-primary">
              Đang để AI chuẩn bị lớp học của bạn...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomeScreen

