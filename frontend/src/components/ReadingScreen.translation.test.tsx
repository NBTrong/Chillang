import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    title: 'Test Reading',
    difficulty_level: 'B1',
  })),
  fetchReadingSegments: vi.fn(async () => [
    {
      id: 'seg-1',
      original_text: 'A fascinating discovery has many implications.',
      starts_at_ms: 0,
      ends_at_ms: 2000,
    },
  ]),
  fetchVocabularyByVideoId: vi.fn(async () => [
    {
      id: 'vocab-1',
      word: 'discovery',
      ipa: '/dɪˈskʌv.ər.i/',
      definition: 'an act of finding something',
      translation: 'sự khám phá',
      context_sentence: 'A fascinating discovery has many implications.',
    },
  ]),
  translateWord: vi.fn(),
  saveWordToVocabulary: vi.fn(async () => ({ id: 'v-saved-1' })),
}))

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}))

import ReadingScreen from './ReadingScreen'
import { saveWordToVocabulary } from '../services/supabaseApi'

const renderWithProvider = (ui: ReactNode) =>
  render(<LanguageProvider>{ui}</LanguageProvider>)

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
  vi.mocked(saveWordToVocabulary).mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('ReadingScreen — translation popup wiring', () => {
  it('wraps the reading passage region with a SelectableTextHost (data-selectable-text-host)', async () => {
    renderWithProvider(<ReadingScreen />)

    // Wait for the dictionary-known word "discovery" to be rendered as a button.
    // This implies the reading segments have been loaded and tokenized.
    await screen.findByRole('button', { name: 'discovery' })

    const host = document.querySelector('[data-selectable-text-host]')
    expect(host).not.toBeNull()
    expect(host!.textContent).toContain('A fascinating discovery has many implications.')
  })

  it('handleBookmark calls saveWordToVocabulary with the selected dictionary word', async () => {
    renderWithProvider(<ReadingScreen />)

    const wordBtn = await screen.findByRole('button', { name: 'discovery' })
    await userEvent.click(wordBtn)

    const bookmarkBtn = await screen.findByRole('button', { name: /bookmark/i })
    await userEvent.click(bookmarkBtn)

    await waitFor(() =>
      expect(saveWordToVocabulary).toHaveBeenCalledTimes(1),
    )
    expect(saveWordToVocabulary).toHaveBeenCalledWith(
      expect.objectContaining({
        word: 'discovery',
        translation: 'sự khám phá',
        ipa: '/dɪˈskʌv.ər.i/',
        video_id: 'video-row-1',
      }),
    )
  })
})
