import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type Sentence = {
  id: string
  text: string
  translation: string
}

type Section = {
  id: string
  timestamp: string
  label: string
  sentences: Sentence[]
}

const readingSections: Section[] = [
  {
    id: 'intro',
    timestamp: '0:15',
    label: 'INTRO HOOK',
    sentences: [
      {
        id: 's1',
        text: 'This is the main content area where the full script of the video is displayed, formatted like an elegant article to keep you focused.',
        translation: 'Đây là khu vực chính hiển thị toàn bộ transcript, được trình bày như một bài báo để bạn dễ tập trung.',
      },
      {
        id: 's2',
        text: 'When you tap on a sentence, it will highlight and a mini audio player appears so you can shadow the pronunciation immediately.',
        translation: 'Khi bạn chạm vào một câu, câu đó sẽ được highlight và một mini player hiện ra để bạn luyện phát âm ngay lập tức.',
      },
    ],
  },
  {
    id: 'interaction',
    timestamp: '0:32',
    label: 'INTERACTIVE READING',
    sentences: [
      {
        id: 's3',
        text: 'Each word is a potential learning opportunity, so tapping on a tricky term like consumption instantly opens the dictionary drawer.',
        translation: 'Mỗi từ đều là một cơ hội học, vì vậy khi chạm vào những từ khó như consumption, ngăn từ điển sẽ bật lên ngay.',
      },
      {
        id: 's4',
        text: 'You can save the definition to your flashcards, hear the audio, and keep the flow without leaving the reading zone.',
        translation: 'Bạn có thể lưu nghĩa vào flashcard, nghe audio và tiếp tục đọc mà không rời khỏi màn hình.',
      },
    ],
  },
  {
    id: 'focus',
    timestamp: '0:58',
    label: 'FOCUS TOOLS',
    sentences: [
      {
        id: 's5',
        text: 'Font controls, bilingual toggles, and the AI summary sit on top so the interface remains minimal but incredibly powerful.',
        translation: 'Các điều khiển font, nút song ngữ và AI summary nằm phía trên để giao diện tối giản nhưng vẫn cực mạnh.',
      },
      {
        id: 's6',
        text: 'This focused environment keeps pronunciation, comprehension, and reviewing tools within a single pane.',
        translation: 'Không gian tập trung này giữ mọi công cụ phát âm, đọc hiểu và ôn lại ngay trong một khung.',
      },
    ],
  },
  {
    id: 'benefits',
    timestamp: '1:12',
    label: 'LEARNING BENEFITS',
    sentences: [
      {
        id: 's7',
        text: 'Learners move from passive consumption to active recall with confidence, guided by timestamps for quick navigation.',
        translation: 'Người học chuyển từ tiếp nhận thụ động sang ghi nhớ chủ động đầy tự tin, được dẫn dắt bằng các mốc thời gian.',
      },
      {
        id: 's8',
        text: 'The result is a deeply effective and enjoyable language learning environment that feels as responsive as an AI chat.',
        translation: 'Kết quả là môi trường học ngôn ngữ hiệu quả và thú vị, phản hồi nhanh như một cuộc trò chuyện với AI.',
      },
    ],
  },
]

const summaryHighlights = [
  'AI surfaces key insights from the video so you can skim before deep reading.',
  'Frictionless dictionary lookups and flashcard saves keep momentum.',
  'Timeline markers help you jump to any scene while staying in reading mode.',
]

const dictionaryEntries: Record<
  string,
  { type: string; pronunciation: string; meaning: string; example: string }
> = {
  consumption: {
    type: 'NOUN',
    pronunciation: '/kən\'sʌmp∫n/',
    meaning: 'The action of using up a resource.',
    example: 'Active listening replaces passive consumption of subtitles.',
  },
  pronunciation: {
    type: 'noun',
    pronunciation: '/prəˌnʌn.siˈeɪ.ʃən/',
    meaning: 'The way in which a word or letter is said.',
    example: 'Shadowing improves your pronunciation quickly.',
  },
  interface: {
    type: 'noun',
    pronunciation: '/ˈɪn.tə.feɪs/',
    meaning: 'A system that enables separate elements to work together.',
    example: 'The interface keeps controls close to the reading surface.',
  },
  summary: {
    type: 'noun',
    pronunciation: '/ˈsʌm.ər.i/',
    meaning: 'A short statement of the main ideas of a text.',
    example: 'Read the AI summary to preview the lesson.',
  },
}

const timelineMarkers = readingSections.map((section) => ({
  id: section.id,
  time: section.timestamp,
  label: section.label,
  description: section.sentences[0]?.text.slice(0, 70).concat('…'),
}))

const tokenizeSentence = (sentence: string) => sentence.match(/\w+|[^\w\s]+|\s+/g) ?? [sentence]

const ReadingScreen = () => {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const [fontSize, setFontSize] = useState<'md' | 'lg'>('md')
  const [showTranslation, setShowTranslation] = useState(false)
  const [showSummary, setShowSummary] = useState(true)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [activeSentenceId, setActiveSentenceId] = useState(readingSections[0].sentences[0].id)
  const [autoSync, setAutoSync] = useState(true)

  const sentencesFlat = useMemo(
    () => readingSections.flatMap((section) => section.sentences.map((sentence) => ({ ...sentence, sectionId: section.id }))),
    []
  )

  const activeSentence = sentencesFlat.find((sentence) => sentence.id === activeSentenceId)
  const activeSectionId = activeSentence?.sectionId
  const selectedEntry = selectedWord ? dictionaryEntries[selectedWord] : undefined

  const handleSentenceSelect = (sentenceId: string) => {
    setActiveSentenceId(sentenceId)
  }

  const handleWordSelect = (word: string) => {
    const normalized = word.toLowerCase()
    if (dictionaryEntries[normalized]) {
      setSelectedWord(normalized)
    } else {
      setSelectedWord(null)
    }
  }

  const fontSizeClass = fontSize === 'lg' ? 'text-[18px]' : 'text-[16px]'

  return (
    <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,_1fr)_320px]">
      <section className="flex flex-col rounded-[32px] border border-border-primary bg-bg-secondary p-6 shadow-[0px_20px_70px_rgba(5,6,12,0.45)] md:p-10">
        {/* Navigation */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/${videoId}/dash`)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary transition hover:text-primary"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-medium text-text-tertiary">BACK TO DASHBOARD</span>
        </div>

        {/* Header */}
        <header className="mb-8">
          <p className="mb-4 typo-caption font-semibold text-text-tertiary">READING MODE</p>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="typo-title text-text-primary">The Future of Personalized Learning</h1>
              <p className="mt-3 max-w-2xl typo-body text-text-secondary">
                Focused reading workspace with AI-powered lookups, audio snippets, and bilingual controls.
              </p>
            </div>
            <button
              type="button"
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
                showSummary
                  ? 'bg-text-inverse text-bg-primary'
                  : 'border border-border-primary text-text-primary hover:bg-interactive-hover'
              }`}
              onClick={() => setShowSummary((prev) => !prev)}
            >
              <span>✨</span>
              <span>AI Summary</span>
            </button>
          </div>
        </header>

        {/* Metadata and Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-bg-tertiary px-3 py-1.5 typo-body-sm font-semibold text-accent-primary">Difficulty · B1</span>
            <span className="typo-body-sm text-text-secondary">742 words · 6m 40s</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                fontSize === 'md'
                  ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                  : 'border-border-primary text-text-secondary hover:bg-interactive-hover'
              }`}
              onClick={() => setFontSize('md')}
            >
              Aa
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                fontSize === 'lg'
                  ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                  : 'border-border-primary text-text-secondary hover:bg-interactive-hover'
              }`}
              onClick={() => setFontSize('lg')}
            >
              A+
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                showTranslation
                  ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                  : 'border-border-primary text-text-secondary hover:bg-interactive-hover'
              }`}
              onClick={() => setShowTranslation((prev) => !prev)}
            >
              VI · EN
            </button>
          </div>
        </div>

        {showSummary && (
          <div className="mb-8 rounded-2xl border border-border-primary bg-bg-tertiary/80 p-5">
            <p className="mb-4 typo-caption font-semibold text-text-tertiary">QUICK DIGEST</p>
            <ul className="space-y-3 typo-body-sm text-text-secondary">
              {summaryHighlights.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reading Content */}
        <div className="space-y-8">
          {readingSections.map((section) => (
            <div key={section.id} className="space-y-5">
              <div className="flex items-center gap-3 typo-caption text-text-tertiary">
                <span className="rounded-full border border-border-primary bg-bg-tertiary px-3 py-1 text-[10px] font-medium text-text-secondary">
                  {section.timestamp}
                </span>
                <span className="font-semibold">{section.label}</span>
              </div>
              <div className="space-y-4">
                {section.sentences.map((sentence) => {
                  const tokens = tokenizeSentence(sentence.text)
                  const isActive = sentence.id === activeSentenceId
                  return (
                    <div
                      key={sentence.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSentenceSelect(sentence.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleSentenceSelect(sentence.id)
                        }
                      }}
                      className={`cursor-pointer rounded-2xl border-2 px-6 py-5 transition ${
                        isActive
                          ? 'border-accent-primary bg-accent-primary/5 shadow-[0_0_20px_rgba(60,106,254,0.2)]'
                          : 'border-transparent bg-transparent hover:bg-interactive-hover'
                      }`}
                    >
                      <p className={`typo-body text-left leading-relaxed text-text-primary ${fontSizeClass}`}>
                        {tokens.map((token, index) => {
                          if (/^\s+$/.test(token)) {
                            return <span key={`${sentence.id}-${index}`}>{token}</span>
                          }

                          const normalized = token.toLowerCase().replace(/[^a-z]/g, '')
                          const entry = dictionaryEntries[normalized]
                          const isSelectedWord = selectedWord === normalized

                          if (!entry) {
                            return (
                              <span key={`${sentence.id}-${index}`} className="inline">
                                {token}
                              </span>
                            )
                          }

                          return (
                            <button
                              key={`${sentence.id}-${index}`}
                              type="button"
                              className={`relative inline-flex items-center rounded-md px-1.5 py-0.5 text-inherit transition ${
                                isSelectedWord ? 'bg-accent-primary/30 text-text-primary' : 'hover:bg-interactive-hover'
                              }`}
                              onClick={(event) => {
                                event.stopPropagation()
                                handleWordSelect(normalized)
                              }}
                            >
                              {token}
                            </button>
                          )
                        })}
                      </p>
                      {showTranslation && (
                        <p className="mt-3 text-left typo-body-sm text-text-secondary">{sentence.translation}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {activeSentence && (
          <div className="mt-8 rounded-3xl border border-border-primary bg-bg-tertiary/90 p-5 typo-body-sm text-text-primary">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1">
                <p className="typo-caption text-text-tertiary">Mini Player</p>
                <p className="mt-2 typo-body text-text-primary">{activeSentence.text}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-primary bg-bg-secondary text-lg transition hover:bg-interactive-hover">
                  ⏮
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-text-inverse text-bg-primary text-xl transition hover:bg-text-inverse/90">
                  ▶
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-primary bg-bg-secondary text-lg transition hover:bg-interactive-hover">
                  ⏭
                </button>
              </div>
            </div>
            <div className="mt-4 h-1 w-full rounded-full bg-border-divider">
              <div className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary" style={{ width: '62%' }} />
            </div>
          </div>
        )}
      </section>

      <aside className="hidden rounded-[32px] border border-border-primary bg-bg-secondary/90 p-6 typo-body-sm text-text-primary lg:flex lg:flex-col">
        <div className="mb-6 flex items-center justify-between">
          <p className="typo-caption font-semibold text-text-tertiary">TIMESTAMPS</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">Auto-sync</span>
            <button
              type="button"
              onClick={() => setAutoSync(!autoSync)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                autoSync ? 'bg-accent-primary' : 'bg-border-secondary'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-text-inverse transition-transform ${
                  autoSync ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto">
          {timelineMarkers.map((marker) => {
            const isActive = marker.id === activeSectionId
            return (
              <button
                key={marker.id}
                type="button"
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  isActive
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-border-primary bg-bg-secondary hover:bg-interactive-hover'
                }`}
                onClick={() => {
                  const firstSentence = readingSections.find((section) => section.id === marker.id)?.sentences[0]
                  if (firstSentence) {
                    handleSentenceSelect(firstSentence.id)
                  }
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg
                      className={`h-4 w-4 ${isActive ? 'text-accent-primary' : 'text-text-tertiary'}`}
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span className="typo-body-sm font-medium text-text-secondary">{marker.time}</span>
                  </div>
                  {isActive && <span className="h-2 w-2 rounded-full bg-success" />}
                </div>
                <p className="typo-subtitle font-semibold text-text-primary">{marker.label}</p>
                <p className="mt-1.5 typo-body-sm leading-relaxed text-text-secondary">{marker.description}</p>
              </button>
            )
          })}
        </div>
      </aside>

      {selectedEntry && (
        <div className="fixed bottom-6 left-1/2 z-20 w-[min(480px,90vw)] -translate-x-1/2 rounded-[28px] border border-border-primary bg-bg-secondary/95 p-6 backdrop-blur-xl shadow-[0_30px_120px_rgba(5,6,12,0.95)]">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h3 className="typo-title capitalize text-text-primary">{selectedWord}</h3>
                <span className="rounded-lg bg-bg-tertiary px-2.5 py-1 typo-body-sm font-medium uppercase text-accent-primary">
                  {selectedEntry.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <p className="typo-body-sm text-text-secondary">{selectedEntry.pronunciation}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWord(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-text-tertiary transition hover:bg-interactive-hover"
            >
              ×
            </button>
          </div>
          <p className="mb-3 typo-body-sm text-text-secondary">{selectedEntry.meaning}</p>
          <div className="mt-4 flex items-center gap-2">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-text-inverse px-4 py-3 text-sm font-semibold text-bg-primary transition hover:bg-text-inverse/90">
              <span>➕</span> 
              <span>Add to Flashcard</span>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-primary bg-bg-tertiary text-lg text-text-primary transition hover:bg-interactive-hover">
              🔊
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReadingScreen

