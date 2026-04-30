import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from '../context/LanguageContext'
import {
  translateWord,
  saveWordToVocabulary,
  type TranslationResult,
} from '../services/supabaseApi'

export type TranslationPopupProps = {
  word: string
  contextSentence?: string
  position: { top: number; left: number }
  sourceVideoId?: string
  onClose: () => void
}

type Status = 'loading' | 'ready' | 'error'

const TranslationSkeleton = () => (
  <div data-testid="translation-popup-loading" className="space-y-3" aria-busy="true">
    <div className="h-7 w-2/3 rounded-md bg-bg-secondary animate-pulse" />
    <div className="h-4 w-1/3 rounded-md bg-bg-secondary animate-pulse" />
    <div className="h-4 w-full rounded-md bg-bg-secondary animate-pulse" />
    <div className="h-4 w-5/6 rounded-md bg-bg-secondary animate-pulse" />
  </div>
)

export function TranslationPopup({
  word,
  contextSentence,
  position,
  sourceVideoId,
  onClose,
}: TranslationPopupProps) {
  const { t } = useTranslation()
  const popupRef = useRef<HTMLDivElement>(null)

  const [status, setStatus] = useState<Status>('loading')
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchTranslation = useCallback(async () => {
    setStatus('loading')
    setErrorMsg(null)
    try {
      const data = await translateWord({
        word,
        context: contextSentence,
        targetLanguage: 'vi',
      })
      setResult(data)
      setStatus('ready')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Translation failed')
      setStatus('error')
    }
  }, [word, contextSentence])

  useEffect(() => {
    setResult(null)
    setSaved(false)
    void fetchTranslation()
  }, [fetchTranslation])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (popupRef.current && popupRef.current.contains(target)) return
      if (target instanceof Element && target.closest('[data-translation-popup]')) return
      onClose()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [onClose])

  const handleAdd = async () => {
    if (!result) return
    setSaving(true)
    try {
      await saveWordToVocabulary({
        word: result.word || word,
        translation: result.translation,
        ipa: result.ipa ?? null,
        context_sentence: contextSentence ?? null,
        source_text: contextSentence ?? null,
        video_id: sourceVideoId ?? null,
      })
      setSaved(true)
    } catch {
      // leave the button enabled to allow retry
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={popupRef}
      data-translation-popup
      role="dialog"
      aria-label={t('translation.dialogLabel')}
      className="fixed w-[calc(100vw-3rem)] bg-bg-tertiary border border-border-primary rounded-2xl p-4 shadow-chill-dark z-50 md:w-[420px] md:p-6"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-12 min-w-0">
          {status === 'ready' && result ? (
            <>
              <h3 className="text-2xl font-bold text-text-primary break-words">
                {result.word || word}
              </h3>
              {result.ipa && (
                <p className="text-accent-primary text-base mt-1">{result.ipa}</p>
              )}
            </>
          ) : (
            <h3 className="text-2xl font-bold text-text-primary break-words">{word}</h3>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('translation.close')}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-text-secondary hover:text-text-primary hover:bg-interactive-hover rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {status === 'loading' && <TranslationSkeleton />}

      {status === 'error' && (
        <div className="space-y-3">
          <p className="text-text-secondary text-sm">
            {errorMsg || t('translation.error')}
          </p>
          <button
            type="button"
            onClick={() => void fetchTranslation()}
            className="px-4 py-2 rounded-xl bg-accent-primary text-white text-sm hover:bg-interactive-hover transition-colors"
          >
            {t('translation.retry')}
          </button>
        </div>
      )}

      {status === 'ready' && result && (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary mb-1">
              {t('translation.translation')}
            </p>
            <p className="text-text-primary text-lg leading-relaxed">
              {result.translation}
            </p>
          </div>

          {result.definition && (
            <p className="text-text-secondary text-sm leading-relaxed border-l-2 border-accent-primary pl-4">
              {result.definition}
            </p>
          )}

          {saved ? (
            <button
              type="button"
              disabled
              aria-label={t('translation.added')}
              className="w-full px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium cursor-not-allowed"
            >
              {t('translation.added')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving}
              aria-label={t('translation.add')}
              className="w-full px-4 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-medium hover:bg-interactive-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? t('translation.loading') : t('translation.add')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default TranslationPopup
