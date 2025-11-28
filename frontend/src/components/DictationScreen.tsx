import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type FeedbackState = {
  userAnswer: string
  correctAnswer: string
  incorrectWord: string
  correctWord: string
} | null

const DictationScreen = () => {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const [currentQuestion, setCurrentQuestion] = useState(5)
  const totalQuestions = 20
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState>({
    userAnswer: 'The quick brown fox jumpss over the lazy dog.',
    correctAnswer: 'The quick brown fox jumps over the lazy dog.',
    incorrectWord: 'jumpss',
    correctWord: 'jumps',
  })
  const [showFeedback, setShowFeedback] = useState(true)

  const progress = (currentQuestion / totalQuestions) * 100

  const handleCheckAnswer = () => {
    // This would normally check the answer against the correct one
    // For now, we'll just show feedback if it's not already shown
    if (!showFeedback) {
      setShowFeedback(true)
    }
  }

  const handleReplay = () => {
    // Replay audio logic
    console.log('Replay audio')
  }

  const handleHint = () => {
    // Show hint logic
    console.log('Show hint')
  }

  const handleSkip = () => {
    // Skip to next question
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1)
      setUserInput('')
      setShowFeedback(false)
      setFeedback(null)
    }
  }

  const handleClose = () => {
    navigate(`/${videoId}/dash`)
  }

  const highlightText = (text: string, highlightWord: string, isCorrect: boolean) => {
    const parts = text.split(new RegExp(`(${highlightWord})`, 'gi'))
    return (
      <span>
        {parts.map((part, index) => {
          if (part.toLowerCase() === highlightWord.toLowerCase()) {
            return (
              <span
                key={index}
                className={isCorrect ? 'text-accent-secondary font-semibold' : 'text-error font-semibold'}
              >
                {part}
              </span>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </span>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border-primary bg-bg-secondary px-6 py-4 shadow-chill-sm">
        <h1 className="typo-title text-text-primary">Dictation: Lesson 1 - Part 3</h1>
        <button
          type="button"
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border-primary bg-bg-tertiary text-xl text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale"
          aria-label="Close"
        >
          ×
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-3xl space-y-8">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between typo-body-sm text-text-secondary">
              <span className="font-medium">Câu {currentQuestion}/{totalQuestions}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
              <div
                className="h-full rounded-full gradient-secondary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Feedback Section */}
          {showFeedback && feedback && (
            <div className="space-y-4 rounded-xl border border-border-accent bg-bg-secondary p-6 shadow-chill-md transition-chill">
              <div className="space-y-2">
                <p className="typo-body-sm text-text-secondary">Your answer:</p>
                <p className="typo-body text-text-primary">
                  {highlightText(feedback.userAnswer, feedback.incorrectWord, false)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="typo-body-sm text-text-secondary">Correct answer:</p>
                <p className="typo-body text-text-primary">
                  {highlightText(feedback.correctAnswer, feedback.correctWord, true)}
                </p>
              </div>
            </div>
          )}

          {/* Input Section */}
          <div className="relative">
            <div className="relative rounded-2xl border border-border-primary bg-bg-secondary p-6 shadow-chill-sm transition-chill focus-within:border-border-accent focus-within:shadow-chill-md">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type what you hear..."
                className="w-full resize-none bg-transparent typo-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
                rows={4}
              />
              
              {/* Audio Control Buttons */}
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
                <button
                  type="button"
                  onClick={handleReplay}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border-primary bg-bg-tertiary text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale"
                  aria-label="Replay"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleHint}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border-primary bg-bg-tertiary text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale"
                  aria-label="Hint"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border-primary bg-bg-tertiary text-text-primary transition-chill hover:bg-interactive-hover hover:border-border-accent hover-scale"
                  aria-label="Skip"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Check Answer Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCheckAnswer}
              className="rounded-xl gradient-primary px-8 py-3 text-base font-semibold text-white shadow-glow-primary-light transition-chill hover-scale hover:shadow-glow-primary"
            >
              Check Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DictationScreen

