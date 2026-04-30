import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { LanguageProvider } from '../context/LanguageContext'
import { SelectableTextHost } from './SelectableTextHost'
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

const renderWithProvider = (ui: ReactNode) =>
  render(<LanguageProvider>{ui}</LanguageProvider>)

function makeRect(): DOMRect {
  return {
    top: 100,
    left: 50,
    bottom: 120,
    right: 150,
    width: 100,
    height: 20,
    x: 50,
    y: 100,
    toJSON: () => ({}),
  } as DOMRect
}

function setSelection(opts: { text: string; container: HTMLElement }) {
  const range = {
    startContainer: opts.container,
    endContainer: opts.container,
    commonAncestorContainer: opts.container,
    getBoundingClientRect: () => makeRect(),
    getClientRects: () => [makeRect()],
  }
  const sel = {
    toString: () => opts.text,
    rangeCount: opts.text ? 1 : 0,
    isCollapsed: !opts.text,
    getRangeAt: () => range,
    removeAllRanges: vi.fn(),
  }
  vi.spyOn(window, 'getSelection').mockReturnValue(sel as unknown as Selection)
  return sel
}

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
  mockedTranslateWord.mockReset()
  vi.mocked(saveWordToVocabulary).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('SelectableTextHost', () => {
  it('does not render TranslationPopup when there is no selection', () => {
    renderWithProvider(
      <SelectableTextHost sourceVideoId="vid-1">
        <p>Some transcript content here.</p>
      </SelectableTextHost>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders TranslationPopup with the selected word and contextSentence after a mouseup', async () => {
    mockedTranslateWord.mockResolvedValue({
      word: 'fascinating',
      translation: 'sự thú vị',
    })

    const { container } = renderWithProvider(
      <SelectableTextHost sourceVideoId="vid-1">
        <p>This is a fascinating sentence.</p>
      </SelectableTextHost>,
    )

    const p = container.querySelector('p') as HTMLElement
    setSelection({ text: 'fascinating', container: p })

    await act(async () => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    await waitFor(() =>
      expect(mockedTranslateWord).toHaveBeenCalledWith(
        expect.objectContaining({
          word: 'fascinating',
          context: 'This is a fascinating sentence.',
          targetLanguage: 'vi',
        }),
      ),
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render TranslationPopup when suppressed=true even if a selection happens', async () => {
    const { container } = renderWithProvider(
      <SelectableTextHost sourceVideoId="vid-1" suppressed>
        <p>This is a fascinating sentence.</p>
      </SelectableTextHost>,
    )

    const p = container.querySelector('p') as HTMLElement
    setSelection({ text: 'fascinating', container: p })

    await act(async () => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockedTranslateWord).not.toHaveBeenCalled()
  })

  it('calls onSelectionOpen when a free-text selection produces a popup', async () => {
    mockedTranslateWord.mockResolvedValue({
      word: 'fascinating',
      translation: 'sự thú vị',
    })

    const onSelectionOpen = vi.fn()
    const { container } = renderWithProvider(
      <SelectableTextHost sourceVideoId="vid-1" onSelectionOpen={onSelectionOpen}>
        <p>This is a fascinating sentence.</p>
      </SelectableTextHost>,
    )

    const p = container.querySelector('p') as HTMLElement
    setSelection({ text: 'fascinating', container: p })

    await act(async () => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    await waitFor(() => expect(onSelectionOpen).toHaveBeenCalled())
  })
})
