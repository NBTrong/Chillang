import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { LanguageProvider } from '../context/LanguageContext'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ videoId: 'abc' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('../services/supabaseApi', () => ({
  fetchVideoByYoutubeId: vi.fn(async () => ({
    id: 'video-row-1',
    youtube_video_id: 'abc',
    title: 'Test Video',
    difficulty_level: 'B1',
  })),
  fetchStudySessionByVideoId: vi.fn(async () => ({
    id: 'session-1',
    listening_high_score: null,
  })),
  fetchListeningQuiz: vi.fn(async () => null),
  fetchReadingSegments: vi.fn(async () => [
    {
      id: 'seg-1',
      original_text: 'A fascinating discovery happened today.',
      starts_at_ms: 0,
      ends_at_ms: 2000,
    },
  ]),
  updateStudySession: vi.fn(),
  generateMoreQuestions: vi.fn(),
  translateWord: vi.fn(),
  saveWordToVocabulary: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}))

import ListeningScreen from './ListeningScreen'

const renderWithProvider = (ui: ReactNode) =>
  render(<LanguageProvider>{ui}</LanguageProvider>)

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
  // jsdom doesn't ship ResizeObserver; ListeningScreen uses it for layout sync.
  if (typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver === 'undefined') {
    class StubResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = StubResizeObserver
  }
  // ListeningScreen tries to inject the YouTube IFrame API by inserting before
  // the first <script> tag. jsdom has none, so seed one to avoid an unhandled
  // null-deref. The script is inert (src='').
  if (document.getElementsByTagName('script').length === 0) {
    const seed = document.createElement('script')
    document.head.appendChild(seed)
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('ListeningScreen — translation popup wiring', () => {
  it('wraps the transcript region with a SelectableTextHost (data-selectable-text-host)', async () => {
    renderWithProvider(<ListeningScreen />)

    await waitFor(() => {
      const host = document.querySelector('[data-selectable-text-host]')
      expect(host).not.toBeNull()
      expect(host!.textContent).toContain('A fascinating discovery happened today.')
    })
  })
})
