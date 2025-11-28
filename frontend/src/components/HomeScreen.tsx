import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const extractYoutubeId = (url: string) => {
  const pattern =
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})|v=([\w-]{6,})/
  const match = url.match(pattern)
  return match?.[1] || match?.[2] || 'new-session'
}

const NO_CAPTION_ERROR = 'Video này không có caption'

type TranscriptResponse = {
  transcript: string
  videoUuid: string
  sessionId: string
  youtubeVideoId: string
}

const HomeScreen = () => {
  const navigate = useNavigate()
  const [videoUrl, setVideoUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [sessionInfo, setSessionInfo] = useState<TranscriptResponse | null>(null)
  const processingTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (processingTimer.current) {
        window.clearTimeout(processingTimer.current)
      }
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!videoUrl.trim()) return

    const videoId = extractYoutubeId(videoUrl.trim())
    if (videoId === 'new-session') {
      setErrorMessage('Link YouTube không hợp lệ.')
      return
    }

    setIsProcessing(true)
    setTranscript(null)
    setSessionInfo(null)
    setErrorMessage(null)
    setActiveVideoId(videoId)

    try {
      const { data, error } = await supabase.functions.invoke<TranscriptResponse | undefined>('fetch-youtube-caption', {
        body: { videoId },
      })

      if (error) {
        const message = error.message || 'Không thể lấy transcript, vui lòng thử lại.'
        setErrorMessage(message.includes(NO_CAPTION_ERROR) ? NO_CAPTION_ERROR : message)
        return
      }

      if (!data?.transcript) {
        setErrorMessage(NO_CAPTION_ERROR)
        return
      }

      setTranscript(data.transcript)
      setSessionInfo(data)
      setVideoUrl('')
    } catch (err) {
      console.error('Failed to fetch transcript', err)
      setErrorMessage('Không thể lấy transcript, vui lòng thử lại.')
    } finally {
    processingTimer.current = window.setTimeout(() => {
      processingTimer.current = null
      setIsProcessing(false)
      }, 300)
    }
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
            className="relative mx-auto flex w-full max-w-2xl items-center gap-4 rounded-2xl border border-border-primary bg-bg-secondary/90 px-6 py-4 shadow-chill-md backdrop-blur-lg transition-chill hover:shadow-chill-lg"
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
                className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-xl text-white shadow-glow-primary-light transition-chill hover-scale hover:shadow-glow-primary disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
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
            <div className="animate-pulse-chill text-sm font-medium text-accent-primary">
              Đang để AI chuẩn bị lớp học của bạn...
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-left text-sm text-red-400">
              {errorMessage}
            </div>
          )}

          {sessionInfo && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 text-left text-sm text-green-300 shadow-chill-md">
              <p className="font-medium text-green-200">Transcript đã lưu vào thư viện học của bạn.</p>
              <p className="text-green-300/80">
                Session ID: <span className="font-mono text-green-100">{sessionInfo.sessionId.slice(0, 8)}...</span>
              </p>
              <button
                type="button"
                onClick={() => navigate(`/${sessionInfo.youtubeVideoId}/dash`)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-100 transition hover:bg-green-500/30"
              >
                Mở Video Dashboard
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {transcript && (
            <div className="space-y-3 rounded-2xl border border-border-primary/70 bg-bg-secondary/80 p-6 text-left shadow-chill-md">
              <div>
                <p className="text-xs uppercase tracking-widest text-text-tertiary">
                  Transcript được lấy từ YouTube
                </p>
                <p className="text-sm text-text-secondary">
                  Video ID: <span className="font-mono text-text-primary">{activeVideoId}</span>
                </p>
              </div>
              <div className="max-h-[360px] overflow-y-auto rounded-xl bg-bg-primary/60 p-4 text-left text-sm leading-relaxed text-text-primary shadow-inner">
                <pre className="whitespace-pre-wrap font-sans">{transcript}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomeScreen

