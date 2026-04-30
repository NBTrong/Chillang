import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { LanguageProvider } from '../context/LanguageContext'
import { TranslationPopup } from './TranslationPopup'
import { translateWord, saveWordToVocabulary } from '../services/supabaseApi'

vi.mock('../services/supabaseApi', () => ({
  translateWord: vi.fn(),
  saveWordToVocabulary: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}))

const mockedTranslateWord = vi.mocked(translateWord)
const mockedSaveWord = vi.mocked(saveWordToVocabulary)

const baseProps = {
  word: 'fascinating',
  contextSentence: 'This was a fascinating discovery.',
  position: { top: 200, left: 100 },
  sourceVideoId: 'vid-123',
  onClose: vi.fn(),
}

const renderWithProvider = (ui: ReactNode) =>
  render(<LanguageProvider>{ui}</LanguageProvider>)

beforeEach(() => {
  mockedTranslateWord.mockReset()
  mockedSaveWord.mockReset()
  baseProps.onClose = vi.fn()
})

describe('TranslationPopup', () => {
  it('shows loading state while translateWord is pending', async () => {
    type TR = { word: string; translation: string }
    let resolve!: (v: TR) => void
    mockedTranslateWord.mockReturnValueOnce(
      new Promise<TR>((r) => {
        resolve = r
      }) as never,
    )

    renderWithProvider(<TranslationPopup {...baseProps} />)

    expect(screen.getByTestId('translation-popup-loading')).toBeInTheDocument()
    resolve({ word: 'fascinating', translation: 'sự thú vị' })
    await waitFor(() =>
      expect(screen.queryByTestId('translation-popup-loading')).not.toBeInTheDocument(),
    )
  })

  it('renders translation result fields after resolution', async () => {
    mockedTranslateWord.mockResolvedValueOnce({
      word: 'fascinating',
      ipa: '/ˈfæsɪneɪtɪŋ/',
      translation: 'sự thú vị',
      definition: 'extremely interesting',
    })

    renderWithProvider(<TranslationPopup {...baseProps} />)

    expect(await screen.findByText('fascinating')).toBeInTheDocument()
    expect(screen.getByText('/ˈfæsɪneɪtɪŋ/')).toBeInTheDocument()
    expect(screen.getByText('sự thú vị')).toBeInTheDocument()
  })

  it('calls translateWord with targetLanguage vi and the contextSentence', async () => {
    mockedTranslateWord.mockResolvedValueOnce({
      word: 'fascinating',
      translation: 'sự thú vị',
    })

    renderWithProvider(<TranslationPopup {...baseProps} />)

    await waitFor(() =>
      expect(mockedTranslateWord).toHaveBeenCalledWith({
        word: 'fascinating',
        context: 'This was a fascinating discovery.',
        targetLanguage: 'vi',
      }),
    )
  })

  it('shows error + Retry button on rejection; Retry recalls translateWord', async () => {
    mockedTranslateWord.mockRejectedValueOnce(new Error('boom'))
    renderWithProvider(<TranslationPopup {...baseProps} />)

    const retry = await screen.findByRole('button', { name: /retry/i })
    expect(retry).toBeInTheDocument()

    mockedTranslateWord.mockResolvedValueOnce({
      word: 'fascinating',
      translation: 'sự thú vị',
    })
    await userEvent.click(retry)

    await waitFor(() => expect(mockedTranslateWord).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('sự thú vị')).toBeInTheDocument()
  })

  it('clicking Add to Collection calls saveWordToVocabulary with the right payload', async () => {
    mockedTranslateWord.mockResolvedValueOnce({
      word: 'fascinating',
      ipa: '/ˈfæsɪneɪtɪŋ/',
      translation: 'sự thú vị',
    })
    mockedSaveWord.mockResolvedValueOnce({ id: 'v-1', word: 'fascinating' } as never)

    renderWithProvider(<TranslationPopup {...baseProps} />)

    const addBtn = await screen.findByRole('button', { name: /add to collection/i })
    await userEvent.click(addBtn)

    await waitFor(() => expect(mockedSaveWord).toHaveBeenCalledTimes(1))
    expect(mockedSaveWord).toHaveBeenCalledWith(
      expect.objectContaining({
        word: 'fascinating',
        translation: 'sự thú vị',
        ipa: '/ˈfæsɪneɪtɪŋ/',
        context_sentence: 'This was a fascinating discovery.',
        source_text: 'This was a fascinating discovery.',
        video_id: 'vid-123',
      }),
    )
  })

  it('after save, button shows Added and is disabled', async () => {
    mockedTranslateWord.mockResolvedValueOnce({
      word: 'fascinating',
      translation: 'sự thú vị',
    })
    mockedSaveWord.mockResolvedValueOnce({ id: 'v-1', word: 'fascinating' } as never)

    renderWithProvider(<TranslationPopup {...baseProps} />)

    const addBtn = await screen.findByRole('button', { name: /add to collection/i })
    await userEvent.click(addBtn)

    const added = await screen.findByRole('button', { name: /added/i })
    expect(added).toBeDisabled()
  })

  it('pressing Escape calls onClose', async () => {
    mockedTranslateWord.mockResolvedValueOnce({
      word: 'fascinating',
      translation: 'sự thú vị',
    })
    const onClose = vi.fn()
    renderWithProvider(<TranslationPopup {...baseProps} onClose={onClose} />)

    await screen.findByText('fascinating')
    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
