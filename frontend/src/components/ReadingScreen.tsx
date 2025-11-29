import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchVideoByYoutubeId,
  fetchReadingSegments,
  fetchVocabularyByVideoId,
  type VideoRecord,
  type ReadingSegment,
  type VocabularyItem,
} from '../services/supabaseApi'

type DictionaryEntry = {
  word: string
  pronunciation: string
  partOfSpeech: string
  definition: string
  example: string
}

// Helper function to convert vocabulary items to dictionary entries
const vocabularyToDictionary = (vocabItems: VocabularyItem[]): Record<string, DictionaryEntry> => {
  const entries: Record<string, DictionaryEntry> = {}
  vocabItems.forEach((item) => {
    const normalized = item.word.toLowerCase().replace(/[^a-z]/g, '')
    entries[normalized] = {
      word: item.word,
      pronunciation: item.ipa || '',
      partOfSpeech: 'Word', // Default since schema doesn't have partOfSpeech
      definition: item.definition || item.translation || 'No definition available.',
      example: item.context_sentence || '',
    }
  })
  return entries
}

const ReadingScreen = () => {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [video, setVideo] = useState<VideoRecord | null>(null)
  const [readingSegments, setReadingSegments] = useState<ReadingSegment[]>([])
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!videoId) {
      setError('Video ID không hợp lệ')
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
          setError('Không tìm thấy video')
          setIsLoading(false)
          return
        }
        setVideo(videoData)

        // Fetch reading segments and vocabulary in parallel
        const [segments, vocabulary] = await Promise.all([
          fetchReadingSegments(videoData.id).catch(() => [] as ReadingSegment[]),
          fetchVocabularyByVideoId(videoData.id).catch(() => [] as VocabularyItem[]),
        ])

        setReadingSegments(segments)
        setVocabularyItems(vocabulary)
      } catch (err) {
        console.error('Failed to load data', err)
        setError('Không thể tải dữ liệu')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [videoId])

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (selectedWord && !target.closest('[data-dictionary-popup]')) {
        setSelectedWord(null)
        setPopupPosition(null)
      }
    }

    if (selectedWord) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [selectedWord])

  const handleWordClick = (word: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const normalized = word.toLowerCase().replace(/[^a-z]/g, '')
    if (dictionaryEntries[normalized]) {
      setSelectedWord(normalized)
      
      // Tính toán vị trí popup gần từ được click
      const buttonRect = event.currentTarget.getBoundingClientRect()
      const popupWidth = 420
      const popupHeight = 300 // Ước tính chiều cao
      const spacing = 16
      
      // Ưu tiên hiển thị bên phải, nếu không đủ chỗ thì hiển thị bên trái
      let left = buttonRect.right + spacing
      if (left + popupWidth > window.innerWidth - 24) {
        left = buttonRect.left - popupWidth - spacing
      }
      
      // Ưu tiên hiển thị phía trên, nếu không đủ chỗ thì hiển thị phía dưới
      let top = buttonRect.top - popupHeight / 2 + buttonRect.height / 2
      if (top < 24) {
        top = buttonRect.bottom + spacing
      } else if (top + popupHeight > window.innerHeight - 24) {
        top = window.innerHeight - popupHeight - 24
      }
      
      setPopupPosition({ top, left })
    }
  }


  const handlePlayAudio = () => {
    // TODO: Implement audio playback
    console.log('Play audio for:', selectedWord)
  }

  const handleBookmark = () => {
    // TODO: Implement bookmark functionality
    console.log('Bookmark word:', selectedWord)
  }

  // Convert vocabulary items to dictionary entries
  const dictionaryEntries = vocabularyToDictionary(vocabularyItems)
  const selectedEntry = selectedWord ? dictionaryEntries[selectedWord] : null

  // Tokenize text to identify words
  const tokenizeText = (text: string) => {
    return text.match(/\w+|[^\w\s]+|\s+/g) ?? [text]
  }

  const renderTextWithHighlights = (text: string) => {
    const tokens = tokenizeText(text)
    return tokens.map((token, index) => {
      if (/^\s+$/.test(token)) {
        return <span key={index}>{token}</span>
      }

      const normalized = token.toLowerCase().replace(/[^a-z]/g, '')
      const hasDefinition = dictionaryEntries[normalized]
      const isSelected = selectedWord === normalized

      if (!hasDefinition) {
        return <span key={index}>{token}</span>
      }

      return (
        <button
          key={index}
          type="button"
          onClick={(e) => handleWordClick(normalized, e)}
          className={`inline transition-colors underline decoration-2 underline-offset-2 ${
            isSelected
              ? 'text-accent-primary font-semibold decoration-accent-primary'
              : 'text-accent-primary hover:text-accent-primary-hover cursor-pointer decoration-accent-primary/60'
          }`}
        >
          {token}
        </button>
      )
    })
  }

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

  const difficultyLabel = video ? formatDifficulty(video.difficulty_level) : 'Intermediate English'

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent-primary/30 border-t-accent-primary mx-auto" />
          <p className="text-text-secondary">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-error mb-4">{error || 'Không tìm thấy video'}</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border border-border-primary bg-bg-secondary px-6 py-3 typo-body-sm font-semibold text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col text-text-primary">
      {/* Content Container - dùng padding mặc định của Layout */}
      <div className="flex-1 pb-24 w-full">
        {/* Breadcrumb Navigation */}
        <nav className="mb-12 flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            Home
          </button>
          <span className="text-text-tertiary">/</span>
          <button
            type="button"
            onClick={() => navigate(`/${videoId}/dash`)}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            {difficultyLabel}
          </button>
          <span className="text-text-tertiary">/</span>
          <span className="text-text-primary">Reading Comprehension</span>
        </nav>

        {/* Main Content */}
        {/* Title */}
        <h1 className="typo-title text-center mb-16 leading-tight text-text-primary" style={{ fontSize: 'clamp(2rem, 1.8rem + 1vw, 2.8rem)' }}>
          {video.title || 'Reading Comprehension'}
        </h1>

        {/* Paragraphs */}
        {readingSegments.length === 0 ? (
          <div className="rounded-xl border border-border-primary bg-bg-secondary p-8 text-center">
            <p className="typo-body text-text-secondary">
              Chưa có nội dung đọc cho video này. Vui lòng tạo reading segments trước.
            </p>
          </div>
        ) : (
          <p className="text-text-primary leading-relaxed" style={{ fontSize: '1.375rem', lineHeight: '2.0', textIndent: '2em' }}>
            {readingSegments.map((segment, index) => {
              const text = segment.original_text
              // Thêm khoảng trắng giữa các segments nếu cần
              const needsSpace = index > 0 && !text.startsWith(' ') && !text.startsWith('\n')
              return (
                <span key={segment.id || index}>
                  {needsSpace && ' '}
                  {renderTextWithHighlights(text)}
                </span>
              )
            })}
          </p>
        )}
      </div>

      {/* Dictionary Definition Box */}
      {selectedEntry && popupPosition && (
        <div 
          data-dictionary-popup
          className="fixed w-[420px] max-w-[calc(100vw-3rem)] bg-bg-tertiary border border-border-primary rounded-2xl p-6 shadow-chill-dark z-50"
          style={{ 
            top: `${popupPosition.top}px`, 
            left: `${popupPosition.left}px` 
          }}
        >
          {/* Header with icons */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 pr-14">
              <h3 className="text-3xl font-bold text-text-primary mb-2.5">{selectedEntry.word}</h3>
              <p className="text-accent-primary text-base mb-1.5">{selectedEntry.pronunciation}</p>
              <p className="text-text-primary text-sm font-medium">{selectedEntry.partOfSpeech}</p>
            </div>
            <div className="flex items-center gap-2.5 absolute top-6 right-6">
              <button
                type="button"
                onClick={handlePlayAudio}
                className="p-2.5 text-text-primary hover:text-accent-primary hover:bg-interactive-hover rounded-lg transition-colors"
                aria-label="Play pronunciation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleBookmark}
                className="p-2.5 text-text-primary hover:text-accent-primary hover:bg-interactive-hover rounded-lg transition-colors"
                aria-label="Bookmark word"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Definition */}
          <p className="text-text-primary text-base mb-5 leading-relaxed">{selectedEntry.definition}</p>

          {/* Example */}
          <div className="border-l-2 border-accent-primary pl-5 pt-1">
            <p className="text-text-primary italic text-base leading-relaxed">"{selectedEntry.example}"</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReadingScreen
