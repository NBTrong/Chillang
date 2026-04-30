import { useEffect, useState, useCallback } from 'react'
import {
  listVocabulary,
  deleteVocabularyItem,
  markVocabularyReviewed,
  type VocabularyItem,
} from '../services/supabaseApi'
import { useTranslation } from '../context/LanguageContext'

type Mode = 'list' | 'review' | 'done'
type Outcome = 'known' | 'unknown'

const masteryStyles: Record<VocabularyItem['mastery_level'], string> = {
  new: 'bg-bg-tertiary text-text-secondary',
  learning: 'bg-accent-primary/10 text-accent-primary',
  hard: 'bg-error/10 text-error',
  mastered: 'bg-success/10 text-success',
}

const VocabularyScreen = () => {
  const { t } = useTranslation()
  const [items, setItems] = useState<VocabularyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('list')
  const [reviewQueue, setReviewQueue] = useState<VocabularyItem[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [knownCount, setKnownCount] = useState(0)
  const [unknownCount, setUnknownCount] = useState(0)
  const [pendingDelete, setPendingDelete] = useState<VocabularyItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await listVocabulary()
      setItems(data)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading vocabulary', err)
      setError(t('vocabulary.error'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const masteryLabel = (level: VocabularyItem['mastery_level']) => {
    switch (level) {
      case 'new':
        return t('vocabulary.masteryNew')
      case 'learning':
        return t('vocabulary.masteryLearning')
      case 'hard':
        return t('vocabulary.masteryHard')
      case 'mastered':
        return t('vocabulary.masteryMastered')
    }
  }

  const dueItems = items.filter((it) => {
    if (!it.due_at) return true
    return new Date(it.due_at).getTime() <= Date.now()
  })

  const startReview = (queue: VocabularyItem[]) => {
    if (queue.length === 0) return
    setReviewQueue(queue)
    setReviewIndex(0)
    setRevealed(false)
    setKnownCount(0)
    setUnknownCount(0)
    setMode('review')
  }

  const handleReviewAll = () => {
    startReview([...items])
  }

  const handleReviewDue = async () => {
    try {
      const due = await listVocabulary({ dueOnly: true })
      const sorted = [...due].sort((a, b) => {
        const aT = a.due_at ? new Date(a.due_at).getTime() : 0
        const bT = b.due_at ? new Date(b.due_at).getTime() : 0
        return aT - bT
      })
      startReview(sorted)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('listVocabulary({ dueOnly }) failed; falling back', err)
      startReview([...dueItems])
    }
  }

  const handleAction = async (outcome: Outcome) => {
    const current = reviewQueue[reviewIndex]
    if (!current) return
    try {
      await markVocabularyReviewed(current.id, outcome)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error marking vocabulary reviewed', err)
    }
    if (outcome === 'known') {
      setKnownCount((c) => c + 1)
    } else {
      setUnknownCount((c) => c + 1)
    }
    const next = reviewIndex + 1
    if (next >= reviewQueue.length) {
      setMode('done')
    } else {
      setReviewIndex(next)
      setRevealed(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setIsDeleting(true)
    try {
      await deleteVocabularyItem(pendingDelete.id)
      setItems((prev) => prev.filter((it) => it.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error deleting vocabulary item', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExitReview = () => {
    setMode('list')
    setReviewQueue([])
    setReviewIndex(0)
    setRevealed(false)
  }

  if (isLoading) {
    return (
      <div data-testid="vocabulary-loading" className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-2xl bg-bg-tertiary" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-bg-tertiary"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border-primary bg-bg-secondary p-8 text-center shadow-chill-dark">
        <p className="text-text-secondary">{error}</p>
        <button
          type="button"
          className="rounded-2xl bg-accent-primary px-5 py-2 text-sm font-semibold text-text-inverse hover:bg-interactive-hover"
          onClick={() => void load()}
        >
          {t('vocabulary.retry')}
        </button>
      </div>
    )
  }

  if (mode === 'review') {
    const current = reviewQueue[reviewIndex]
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div
            data-testid="review-progress"
            className="text-sm font-medium text-text-secondary"
          >
            {reviewIndex + 1} / {reviewQueue.length}
          </div>
          <button
            type="button"
            onClick={handleExitReview}
            className="rounded-2xl border border-border-primary px-4 py-2 text-sm text-text-secondary hover:bg-interactive-hover"
          >
            {t('vocabulary.exitReview')}
          </button>
        </div>

        {current && (
          <div
            data-testid="review-card"
            className="flex flex-col items-center gap-4 rounded-2xl border border-border-primary bg-bg-secondary p-8 text-center shadow-chill-dark"
          >
            <div className="text-3xl font-bold text-text-primary md:text-4xl">
              {current.word}
            </div>
            {current.context_sentence && (
              <p className="text-sm italic text-text-tertiary">
                {current.context_sentence}
              </p>
            )}
            {!current.context_sentence && current.source_text && (
              <p className="text-sm italic text-text-tertiary">
                {current.source_text}
              </p>
            )}

            {revealed && (
              <div
                data-testid="review-back"
                className="mt-2 flex w-full flex-col gap-2 border-t border-border-divider pt-4 text-left"
              >
                {current.ipa && (
                  <div className="text-sm text-text-secondary">
                    {current.ipa}
                  </div>
                )}
                {current.translation && (
                  <div className="text-lg font-semibold text-accent-primary">
                    {current.translation}
                  </div>
                )}
                {current.definition && (
                  <div className="text-sm text-text-secondary">
                    {current.definition}
                  </div>
                )}
              </div>
            )}

            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-4 rounded-2xl bg-accent-primary px-6 py-2 text-sm font-semibold text-text-inverse hover:bg-interactive-hover"
              >
                {t('vocabulary.reveal')}
              </button>
            ) : (
              <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => void handleAction('unknown')}
                  className="rounded-2xl border border-error/40 bg-error/10 px-6 py-2 text-sm font-semibold text-error hover:bg-error/20"
                >
                  {t('vocabulary.unknown')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleAction('known')}
                  className="rounded-2xl border border-success/40 bg-success/10 px-6 py-2 text-sm font-semibold text-success hover:bg-success/20"
                >
                  {t('vocabulary.known')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (mode === 'done') {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border-primary bg-bg-secondary p-8 text-center shadow-chill-dark">
        <h2 className="text-2xl font-bold text-text-primary">
          {t('vocabulary.reviewDone')}
        </h2>
        <p data-testid="review-done" className="text-text-secondary">
          {knownCount} {t('vocabulary.knownLabel')}, {unknownCount}{' '}
          {t('vocabulary.unknownLabel')}
        </p>
        <button
          type="button"
          onClick={handleExitReview}
          className="rounded-2xl bg-accent-primary px-6 py-2 text-sm font-semibold text-text-inverse hover:bg-interactive-hover"
        >
          {t('vocabulary.backToList')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
            {t('vocabulary.title')}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {items.length} {t('vocabulary.count')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleReviewDue()}
            disabled={dueItems.length === 0}
            className="rounded-2xl border border-border-primary px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-interactive-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('vocabulary.reviewDue')} ({dueItems.length})
          </button>
          <button
            type="button"
            onClick={handleReviewAll}
            disabled={items.length === 0}
            className="rounded-2xl bg-accent-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-interactive-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('vocabulary.reviewAll')}
          </button>
        </div>
      </header>

      {items.length === 0 ? (
        <div
          data-testid="vocabulary-empty"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-primary bg-bg-secondary p-10 text-center"
        >
          <p className="text-text-secondary">{t('vocabulary.empty')}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              data-testid={`vocab-card-${item.id}`}
              className="relative flex flex-col gap-2 rounded-2xl border border-border-primary bg-bg-secondary p-4 shadow-chill-dark"
            >
              <button
                type="button"
                aria-label={`${t('vocabulary.delete')} ${item.word}`}
                onClick={() => setPendingDelete(item)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary hover:bg-interactive-hover hover:text-text-primary"
              >
                ×
              </button>
              <div className="pr-8 text-xl font-bold text-text-primary">
                {item.word}
              </div>
              {item.ipa && (
                <div className="text-xs text-text-tertiary">{item.ipa}</div>
              )}
              {item.translation && (
                <div className="text-sm text-text-secondary">
                  {item.translation}
                </div>
              )}
              <div className="mt-auto pt-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${masteryStyles[item.mastery_level]}`}
                >
                  {masteryLabel(item.mastery_level)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl border border-border-primary bg-bg-secondary p-6 shadow-chill-dark"
          >
            <h2 className="text-lg font-semibold text-text-primary">
              {t('vocabulary.deleteConfirmTitle')}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {t('vocabulary.deleteConfirmBody')} &quot;{pendingDelete.word}
              &quot;?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={isDeleting}
                className="rounded-2xl border border-border-primary px-4 py-2 text-sm font-medium text-text-secondary hover:bg-interactive-hover"
              >
                {t('vocabulary.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className="rounded-2xl bg-error px-4 py-2 text-sm font-semibold text-text-inverse hover:opacity-90 disabled:opacity-50"
              >
                {t('vocabulary.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VocabularyScreen
