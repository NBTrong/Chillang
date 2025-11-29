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
    <div className="flex flex-1 flex-col text-text-primary">
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 typo-body-sm text-text-secondary">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="transition-chill hover:text-accent-primary"
          >
            Home
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate(`/${videoId}/dash`)}
            className="transition-chill hover:text-accent-primary"
          >
            Intermediate English
          </button>
          <span>/</span>
          <span className="text-text-primary">Listening Comprehension</span>
        </div>

        {/* Title and Instruction */}
        <div className="mb-6">
          <h2 className="mb-2 typo-title text-text-primary">Tech Talk: The Future of AI</h2>
          <p className="typo-body text-text-secondary">
            Watch the video and answer the questions below to test your listening skills.
          </p>
        </div>

        {/* Video and Transcript Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_400px] lg:items-stretch">
          {/* Video Player */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border-primary bg-bg-secondary shadow-chill-md transition-chill">
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
                <div className="absolute inset-0 rounded-lg bg-accent-primary opacity-20 blur-2xl" />
                <div className="relative flex h-32 w-32 items-center justify-center rounded-lg border border-accent-primary/30 bg-gradient-to-br from-bg-tertiary to-bg-secondary text-4xl font-bold text-text-primary shadow-glow-primary">
                  AI
                </div>
              </div>
            </div>
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-2xl text-white shadow-glow-primary transition-chill hover-scale hover:shadow-glow-primary">
                ▶
              </button>
            </div>
            
            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-text-inverse">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
              <div className="mb-3 h-1.5 w-full rounded-full bg-text-inverse/20 overflow-hidden">
                <div 
                  className="h-full rounded-full gradient-secondary transition-all duration-300"
                  style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button className="flex h-9 w-9 items-center justify-center rounded-lg text-text-inverse transition-chill hover:bg-text-inverse/20 hover-scale">
                    🔊
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-lg text-text-inverse text-xs font-medium transition-chill hover:bg-text-inverse/20 hover-scale">
                    CC
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-lg text-text-inverse transition-chill hover:bg-text-inverse/20 hover-scale">
                    ⚙️
                  </button>
                </div>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-text-inverse transition-chill hover:bg-text-inverse/20 hover-scale">
                  ⛶
                </button>
              </div>
            </div>
          </div>

          {/* Transcript Panel */}
          {showTranscript && (
            <div className="flex flex-col rounded-xl border border-border-primary bg-bg-secondary p-4 shadow-chill-sm transition-chill">
              <div className="mb-4 flex items-center justify-between flex-shrink-0">
                <h3 className="typo-subtitle text-text-primary">Transcript</h3>
                <label className="flex items-center gap-2 typo-body-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="h-4 w-4 rounded border-border-primary bg-bg-secondary text-accent-primary"
                  />
                  Auto-scroll
                </label>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto typo-body-sm min-h-0">
                {transcriptEntries.map((entry, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-3 transition-chill ${
                      entry.highlighted
                        ? 'border border-border-accent bg-accent-primary-light/20 text-accent-primary shadow-chill-sm'
                        : 'bg-bg-tertiary text-text-secondary'
                    }`}
                  >
                    <span className="typo-caption text-text-tertiary">[{entry.timestamp}]</span>{' '}
                    <span className={entry.highlighted ? 'font-medium' : ''}>{entry.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 rounded-lg border border-border-accent bg-accent-secondary/10 px-6 py-3 shadow-chill-sm">
            <p className="typo-caption text-text-tertiary">Result</p>
            <p className="typo-title leading-none text-accent-secondary">{score}/{totalQuestions}</p>
          </div>
          <button
            onClick={() => navigate(`/${videoId}/dash`)}
            className="rounded-lg border border-border-primary bg-bg-secondary px-6 py-3 typo-body-sm font-semibold text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale"
          >
            Try Again
          </button>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="rounded-lg border border-border-primary bg-bg-secondary px-6 py-3 typo-body-sm font-semibold text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale"
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
                <div key={q.id} className="rounded-xl border border-border-primary bg-bg-secondary p-6 shadow-chill-sm transition-chill hover:shadow-chill-md">
                  <h3 className="mb-4 typo-subtitle font-semibold text-text-primary">{q.question}</h3>
                  <div className="space-y-3">
                    {q.options.map((option, index) => {
                      const isSelected = q.userAnswer === index
                      const isCorrectOption = index === q.correctAnswer
                      let optionStyle = 'border-border-primary bg-bg-tertiary text-text-secondary'

                      if (isSelected && isCorrect) {
                        optionStyle = 'border-accent-secondary bg-accent-secondary/10 text-accent-secondary'
                      } else if (isSelected && isIncorrect) {
                        optionStyle = 'border-error bg-error/10 text-error'
                      } else if (isCorrectOption && isIncorrect) {
                        optionStyle = 'border-accent-secondary/50 bg-accent-secondary/5 text-accent-secondary'
                      }

                      return (
                        <label
                          key={index}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-chill ${optionStyle} ${
                            !isSelected && !isCorrectOption ? 'hover:bg-interactive-hover hover:border-border-accent hover-scale' : ''
                          }`}
                        >
                          <div className="mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-current">
                            {isSelected && (
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${
                                  isCorrect ? 'bg-accent-secondary shadow-glow-primary-light' : 'bg-error'
                                }`}
                              />
                            )}
                          </div>
                          <span className="flex-1 typo-body-sm">{option}</span>
                        </label>
                      )
                    })}
                  </div>
                  {(isCorrect || isIncorrect) && (
                    <div
                      className={`mt-4 rounded-lg border p-4 transition-chill ${
                        isCorrect 
                          ? 'border-border-accent bg-accent-secondary/10 text-accent-secondary shadow-chill-sm' 
                          : 'border-error/30 bg-error/5 text-error'
                      }`}
                    >
                      <p className="typo-body-sm">
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

