import { useMemo, useState } from 'react'

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
    label: 'Intro hook',
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
    label: 'Interactive reading',
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
    label: 'Focus tools',
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
    label: 'Learning benefits',
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
    type: 'noun',
    pronunciation: '/kənˈsʌmp.ʃən/',
    meaning: 'The act of using something such as fuel, energy, or time.',
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
  const [fontSize, setFontSize] = useState<'md' | 'lg'>('md')
  const [showTranslation, setShowTranslation] = useState(false)
  const [showSummary, setShowSummary] = useState(true)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [activeSentenceId, setActiveSentenceId] = useState(readingSections[0].sentences[0].id)

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
    <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,_1fr)_280px]">
      <section className="flex flex-col rounded-[32px] border border-[#111425] bg-gradient-to-b from-[#080a13] to-[#05060c] p-6 shadow-[0px_20px_70px_rgba(5,6,12,0.7)] md:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#7f88a9]">Reading Mode</p>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-[34px]">The Future of Personalized Learning</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#a2a9c7]">
              Focused reading workspace with AI-powered lookups, audio snippets, and bilingual controls.
            </p>
          </div>
          <button
            type="button"
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              showSummary ? 'bg-white text-[#05060a]' : 'border border-white/30 text-white hover:border-white/70'
            }`}
            onClick={() => setShowSummary((prev) => !prev)}
          >
            ✨ AI Summary
          </button>
        </header>

        <div className="mt-8 rounded-2xl border border-[#161a2a] bg-[#070914]/80 p-4 text-sm text-[#c2c8e0] sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="rounded-2xl bg-[#10142a] px-3 py-1 text-xs font-semibold text-[#8fb6ff]">Difficulty · B1</span>
            <span className="text-xs text-[#7f88a9]">742 words · 6m 40s</span>
          </div>
          <div className="mt-3 flex items-center gap-2 sm:mt-0">
            <button
              type="button"
              className={`rounded-xl border px-3 py-1 text-xs font-semibold ${
                fontSize === 'md' ? 'border-[#3c6afe] text-white' : 'border-transparent text-[#9aa1bd]'
              }`}
              onClick={() => setFontSize('md')}
            >
              Aa
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-1 text-xs font-semibold ${
                fontSize === 'lg' ? 'border-[#3c6afe] text-white' : 'border-transparent text-[#9aa1bd]'
              }`}
              onClick={() => setFontSize('lg')}
            >
              A+
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-1 text-xs font-semibold ${
                showTranslation ? 'border-[#3c6afe] text-white' : 'border-transparent text-[#9aa1bd]'
              }`}
              onClick={() => setShowTranslation((prev) => !prev)}
            >
              VI • EN
            </button>
          </div>
        </div>

        {showSummary && (
          <div className="mt-6 rounded-2xl border border-[#161a2a] bg-[#0a0e1d]/80 p-5 text-sm text-[#d5d9ec]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f88a9]">Quick digest</p>
            <ul className="mt-4 space-y-3 text-sm text-[#c8d0f0]">
              {summaryHighlights.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#6f80ff]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {readingSections.map((section) => (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-[#5e6584]">
                <span className="rounded-full border border-[#1c2136] px-3 py-1 text-[10px] text-white/70">{section.timestamp}</span>
                <span>{section.label}</span>
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
                      className={`rounded-3xl border px-5 py-4 transition ${
                        isActive ? 'border-[#3c6afe] bg-[#0f1530]/70 shadow-[0_0_30px_rgba(60,106,254,0.25)]' : 'border-transparent bg-[#0b0f1d]/70 hover:border-[#1d2340]'
                      }`}
                    >
                      <p className={`text-left leading-relaxed text-[#e3e8ff] ${fontSizeClass}`}>
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
                                isSelectedWord ? 'bg-[#3c6afe]/30 text-white' : 'hover:bg-[#1b2138]'
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
                        <p className="mt-3 text-left text-sm text-[#7f88a9]">{sentence.translation}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {activeSentence && (
          <div className="mt-8 rounded-3xl border border-[#161a2a] bg-[#060916]/90 p-5 text-sm text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#7f88a9]">Mini Player</p>
                <p className="mt-2 text-base text-[#f7f8ff]">{activeSentence.text}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#21263a] bg-[#0c1224] text-lg">⏮</button>
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#05060a] text-xl">▶</button>
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#21263a] bg-[#0c1224] text-lg">⏭</button>
              </div>
            </div>
            <div className="mt-4 h-1 w-full rounded-full bg-[#1a2037]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#3c6afe] to-[#8c6afc]" style={{ width: '62%' }} />
            </div>
          </div>
        )}
      </section>

      <aside className="hidden rounded-[32px] border border-[#111425] bg-[#050711]/90 p-6 text-sm text-white lg:flex lg:flex-col">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.35em] text-[#7f88a9]">Timestamps</p>
          <span className="text-xs text-[#7f88a9]">Auto-sync</span>
        </div>
        <div className="mt-6 space-y-4">
          {timelineMarkers.map((marker) => {
            const isActive = marker.id === activeSectionId
            return (
              <button
                key={marker.id}
                type="button"
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  isActive ? 'border-[#3c6afe] bg-[#0f1530]/80' : 'border-transparent bg-[#070b1b]/80 hover:border-[#1d2340]'
                }`}
                onClick={() => {
                  const firstSentence = readingSections.find((section) => section.id === marker.id)?.sentences[0]
                  if (firstSentence) {
                    handleSentenceSelect(firstSentence.id)
                  }
                }}
              >
                <div className="flex items-center justify-between text-xs text-[#9aa1bd]">
                  <span>{marker.time}</span>
                  {isActive && <span className="h-2 w-2 rounded-full bg-[#33f399]" />}
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{marker.label}</p>
                <p className="mt-1 text-xs text-[#8d94b6]">{marker.description}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-auto rounded-2xl border border-[#161a2a] bg-[#070b1b]/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7f88a9]">Contextual tools</p>
          <ul className="mt-3 space-y-2 text-sm text-[#cbd2f4]">
            <li>• Auto-scroll to current audio</li>
            <li>• Regenerate practice questions</li>
            <li>• Save tricky phrases to review later</li>
          </ul>
        </div>
      </aside>

      {selectedEntry && (
        <div className="fixed bottom-6 left-1/2 z-20 w-[min(480px,90vw)] -translate-x-1/2 rounded-[28px] border border-[#161a2a] bg-[#05060c]/95 p-6 backdrop-blur-xl shadow-[0_30px_120px_rgba(5,6,12,0.95)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#7f88a9]">Dictionary</p>
              <div className="mt-2 flex items-center gap-3">
                <h3 className="text-2xl font-semibold text-white capitalize">{selectedWord}</h3>
                <span className="rounded-xl bg-[#0f1430] px-3 py-1 text-xs text-[#8fb6ff]">{selectedEntry.type}</span>
              </div>
              <p className="mt-2 text-sm text-[#9aa1bd]">{selectedEntry.pronunciation}</p>
            </div>
            <button type="button" onClick={() => setSelectedWord(null)} className="text-2xl text-[#7f88a9]">
              ×
            </button>
          </div>
          <p className="mt-4 text-sm text-[#d5d9ec]">{selectedEntry.meaning}</p>
          <p className="mt-2 text-xs text-[#8d94b6]">Example: {selectedEntry.example}</p>
          <div className="mt-4 flex items-center gap-2">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-[#05060a]">
              <span>➕</span> Add to Flashcard
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1d2340] bg-[#0b0f1d] text-lg text-white">
              🔊
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReadingScreen

