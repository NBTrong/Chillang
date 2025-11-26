import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type Question = {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  userAnswer?: number
  feedback: string
  timestamp: string
}

type TranscriptEntry = {
  timestamp: string
  text: string
  highlighted?: boolean
}

const questions: Question[] = [
  {
    id: 'q1',
    question: 'What is the main topic discussed in the first minute of the video?',
    options: [
      'The history of computer programming.',
      'The ethical implications of AI.',
      'Recent advancements in neural networks.',
      'Quantum computing breakthroughs.',
    ],
    correctAnswer: 2,
    userAnswer: 0,
    feedback: 'Your answer was incorrect. The video at [0:12] specifically mentions "recent advancements in neural networks".',
    timestamp: '0:12',
  },
  {
    id: 'q2',
    question: 'According to the speaker, what is a primary challenge for AI development?',
    options: [
      'Lack of processing power.',
      'Acquiring large, unbiased datasets.',
      'High cost of research.',
      'Public skepticism and fear.',
    ],
    correctAnswer: 1,
    userAnswer: 1,
    feedback: 'Correct! The speaker mentions this at [0:30].',
    timestamp: '0:30',
  },
]

const transcriptEntries: TranscriptEntry[] = [
  { timestamp: '0:05', text: "Welcome back to Tech Forward, where we explore the cutting edge of innovation." },
  { timestamp: '0:12', text: "Today, we're diving deep into the recent advancements in neural networks that are reshaping our world.", highlighted: true },
  { timestamp: '0:21', text: "These aren't just incremental updates; they represent a quantum leap in machine intelligence." },
  { timestamp: '0:30', text: "One of the biggest challenges has always been acquiring large, unbiased datasets...", highlighted: true },
  { timestamp: '0:45', text: "...but new techniques in synthetic data generation are proving to be a game-changer." },
]

const ListeningScreen = () => {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const [autoScroll, setAutoScroll] = useState(true)
  const [showTranscript, setShowTranscript] = useState(true)
  const [currentTime] = useState(37) // 0:37 in seconds
  const totalDuration = 143 // 2:23 in seconds

  const score = 8
  const totalQuestions = 10

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-1 flex-col text-white">
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-sm text-[#9aa0b5]">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="transition hover:text-white"
          >
            Home
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate(`/${videoId}/dash`)}
            className="transition hover:text-white"
          >
            Intermediate English
          </button>
          <span>/</span>
          <span className="text-white">Listening Comprehension</span>
        </div>

        {/* Title and Instruction */}
        <div className="mb-6">
          <h2 className="mb-2 text-3xl font-bold text-white">Tech Talk: The Future of AI</h2>
          <p className="text-base text-[#9aa0b5]">
            Watch the video and answer the questions below to test your listening skills.
          </p>
        </div>

        {/* Video and Transcript Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Video Player */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0a0d15] border border-[#1a1f33]">
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233140ff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            
            {/* AI Logo with glow effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-[#3140ff] opacity-20 blur-2xl" />
                <div className="relative flex h-32 w-32 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1f33] to-[#0f1219] border border-[#3140ff]/30 text-4xl font-bold text-white shadow-[0_0_30px_rgba(49,64,255,0.5)]">
                  AI
                </div>
              </div>
            </div>
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl text-[#05060a] shadow-lg hover:bg-white/95 transition">
                ▶
              </button>
            </div>
            
            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-white">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
              <div className="mb-3 h-1.5 w-full rounded-full bg-white/20">
                <div 
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button className="flex h-9 w-9 items-center justify-center text-white hover:bg-white/10 rounded transition">
                    🔊
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center text-white hover:bg-white/10 rounded transition text-xs font-medium">
                    CC
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center text-white hover:bg-white/10 rounded transition">
                    ⚙️
                  </button>
                </div>
                <button className="flex h-9 w-9 items-center justify-center text-white hover:bg-white/10 rounded transition">
                  ⛶
                </button>
              </div>
            </div>
          </div>

          {/* Transcript Panel */}
          {showTranscript && (
            <div className="rounded-2xl border border-[#1a1f33] bg-[#0a0d15] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Transcript</h3>
                  <label className="flex items-center gap-2 text-xs text-[#9aa0b5]">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="h-4 w-4 rounded border-[#1a1f33] bg-[#0a0d15] text-[#3140ff]"
                    />
                    Auto-scroll
                  </label>
                </div>
                <div className="max-h-[500px] space-y-2 overflow-y-auto text-sm">
                  {transcriptEntries.map((entry, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-3 transition ${
                        entry.highlighted
                          ? 'bg-[#3140ff]/20 text-[#8fb6ff] border border-[#3140ff]/30'
                          : 'bg-[#0f1219] text-[#9aa0b5]'
                      }`}
                    >
                      <span className="text-xs text-[#7f859c]">[{entry.timestamp}]</span>{' '}
                      <span className={entry.highlighted ? 'font-medium' : ''}>{entry.text}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex items-center gap-4 rounded-xl border border-[#1a1f33] bg-[#0a0d15] px-6 py-3">
            <p className="text-xs uppercase tracking-wider text-[#9aa0b5]">Result</p>
            <p className="text-xl font-bold text-[#4ade80] leading-none">{score}/{totalQuestions}</p>
          </div>
          <button
            onClick={() => navigate(`/${videoId}/dash`)}
            className="rounded-xl border border-[#1a1f33] bg-[#0a0d15] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0f1219]"
          >
            Try Again
          </button>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="rounded-xl border border-[#1a1f33] bg-[#0a0d15] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0f1219]"
          >
            {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
          </button>
        </div>

        {/* Questions Section */}
        <div className="space-y-6">
          {questions.map((q) => {
              const isCorrect = q.userAnswer === q.correctAnswer
              const isIncorrect = q.userAnswer !== undefined && q.userAnswer !== q.correctAnswer

              return (
                <div key={q.id} className="rounded-2xl border border-[#1a1f33] bg-[#0a0d15] p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">{q.question}</h3>
                  <div className="space-y-3">
                    {q.options.map((option, index) => {
                      const isSelected = q.userAnswer === index
                      const isCorrectOption = index === q.correctAnswer
                      let optionStyle = 'border-[#1a1f33] bg-[#0f1219] text-[#9aa0b5]'

                      if (isSelected && isCorrect) {
                        optionStyle = 'border-[#4ade80] bg-[#17221b] text-[#4ade80]'
                      } else if (isSelected && isIncorrect) {
                        optionStyle = 'border-[#ef4444] bg-[#1f1717] text-[#ef4444]'
                      } else if (isCorrectOption && isIncorrect) {
                        optionStyle = 'border-[#4ade80]/50 bg-[#17221b]/50 text-[#4ade80]'
                      }

                      return (
                        <label
                          key={index}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${optionStyle} ${
                            !isSelected && !isCorrectOption ? 'hover:border-[#2a2f42] hover:bg-[#0f1219]' : ''
                          }`}
                        >
                          <div className="mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-current">
                            {isSelected && (
                              <div className={`h-2.5 w-2.5 rounded-full ${
                                isCorrect ? 'bg-[#4ade80]' : 'bg-[#ef4444]'
                              }`} />
                            )}
                          </div>
                          <span className="flex-1">{option}</span>
                        </label>
                      )
                    })}
                  </div>
                  {(isCorrect || isIncorrect) && (
                    <div
                      className={`mt-4 rounded-xl p-4 ${
                        isCorrect
                          ? 'bg-[#17221b]/50 border border-[#4ade80]/30 text-[#4ade80]'
                          : 'bg-[#1f1717]/50 border border-[#ef4444]/30 text-[#ef4444]'
                      }`}
                    >
                      <p className="text-sm">
                        {isCorrect ? '✓ ' : '✗ '}
                        {q.feedback}
                      </p>
                    </div>
                  )}
                </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ListeningScreen

