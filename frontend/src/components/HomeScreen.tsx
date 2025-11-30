import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTranslation } from '../context/LanguageContext'

const extractYoutubeId = (url: string) => {
  const pattern =
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})|v=([\w-]{6,})/
  const match = url.match(pattern)
  return match?.[1] || match?.[2] || 'new-session'
}

type TranscriptResponse = {
  transcript: string
  videoUuid: string
  sessionId: string
  youtubeVideoId: string
}

const HomeScreen = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [videoUrl, setVideoUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!videoUrl.trim()) return

    const videoId = extractYoutubeId(videoUrl.trim())
    if (videoId === 'new-session') {
      setErrorMessage(t('home.invalidUrl'))
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { data, error } = await supabase.functions.invoke<TranscriptResponse | undefined>('fetch-youtube-caption', {
        body: { videoId },
      })

      if (error) {
        setErrorMessage(t('errors.noCaption'))
        setIsProcessing(false)
        return
      }

      if (!data?.transcript || !data?.youtubeVideoId) {
        setErrorMessage(t('errors.noCaption'))
        setIsProcessing(false)
        return
      }

      setVideoUrl('')
      navigate(`/${data.youtubeVideoId}/dash`)
    } catch (err) {
      console.error('Failed to fetch transcript', err)
      setErrorMessage(t('errors.noCaption'))
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Hero copy trên, input bên dưới */}
        <div className="space-y-3">
          <h1 className="typo-display text-text-primary">
            {t('home.title')}
          </h1>
          <p className="typo-body mx-auto max-w-xl text-text-secondary">
            {t('home.subtitle')}
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
              placeholder={t('home.inputPlaceholder')}
              className="flex-1 border-none bg-transparent text-base text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-xl text-white shadow-glow-primary-light transition-chill hover-scale hover:shadow-glow-primary disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
                aria-label={t('home.submitButton')}
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
              {t('home.processing')}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-left text-sm text-red-400">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomeScreen

