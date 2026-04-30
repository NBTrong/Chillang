import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../context/LanguageContext'
import VocabularyScreen from './VocabularyScreen'
import {
  listVocabulary,
  deleteVocabularyItem,
  markVocabularyReviewed,
} from '../services/supabaseApi'

vi.mock('../services/supabaseApi', () => ({
  listVocabulary: vi.fn(),
  deleteVocabularyItem: vi.fn(),
  markVocabularyReviewed: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}))

const mockedList = vi.mocked(listVocabulary)
const mockedDelete = vi.mocked(deleteVocabularyItem)
const mockedReview = vi.mocked(markVocabularyReviewed)

const renderScreen = (ui: ReactNode) =>
  render(
    <MemoryRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </MemoryRouter>,
  )

const sampleItems = [
  {
    id: 'v-1',
    word: 'fascinating',
    ipa: '/ˈfæsɪneɪtɪŋ/',
    definition: 'extremely interesting',
    translation: 'sự thú vị',
    context_sentence: 'It was fascinating.',
    mastery_level: 'new' as const,
    due_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    review_count: 0,
    last_reviewed_at: null,
    source_text: 'It was fascinating.',
  },
  {
    id: 'v-2',
    word: 'serendipity',
    ipa: '/ˌsɛrənˈdɪpɪti/',
    definition: 'pleasant surprise',
    translation: 'tình cờ may mắn',
    context_sentence: 'A pure serendipity.',
    mastery_level: 'learning' as const,
    due_at: null,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    review_count: 1,
    last_reviewed_at: null,
    source_text: 'A pure serendipity.',
  },
]

beforeEach(() => {
  mockedList.mockReset()
  mockedDelete.mockReset()
  mockedReview.mockReset()
})

describe('VocabularyScreen', () => {
  it('shows loading skeleton initially', () => {
    mockedList.mockReturnValueOnce(new Promise(() => {}) as never)
    renderScreen(<VocabularyScreen />)
    expect(screen.getByTestId('vocabulary-loading')).toBeInTheDocument()
  })

  it('renders list of words after listVocabulary resolves', async () => {
    mockedList.mockResolvedValueOnce(sampleItems as never)
    renderScreen(<VocabularyScreen />)

    expect(await screen.findByText('fascinating')).toBeInTheDocument()
    expect(screen.getByText('serendipity')).toBeInTheDocument()
    expect(screen.getByText('sự thú vị')).toBeInTheDocument()
  })

  it('shows empty state when list is empty', async () => {
    mockedList.mockResolvedValueOnce([])
    renderScreen(<VocabularyScreen />)
    expect(await screen.findByTestId('vocabulary-empty')).toBeInTheDocument()
  })

  it('shows error state + retry when listVocabulary rejects', async () => {
    mockedList.mockRejectedValueOnce(new Error('boom'))
    renderScreen(<VocabularyScreen />)

    const retry = await screen.findByRole('button', { name: /retry/i })
    expect(retry).toBeInTheDocument()

    mockedList.mockResolvedValueOnce(sampleItems as never)
    await userEvent.click(retry)

    expect(await screen.findByText('fascinating')).toBeInTheDocument()
  })

  it('delete flow: click x, confirm, deleteVocabularyItem called, card disappears', async () => {
    mockedList.mockResolvedValueOnce(sampleItems as never)
    mockedDelete.mockResolvedValueOnce(undefined)
    renderScreen(<VocabularyScreen />)

    await screen.findByText('fascinating')
    const card = screen.getByTestId('vocab-card-v-1')
    const deleteBtn = within(card).getByRole('button', { name: /delete/i })
    await userEvent.click(deleteBtn)

    const confirmBtn = await screen.findByRole('button', { name: /confirm/i })
    await userEvent.click(confirmBtn)

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('v-1'))
    await waitFor(() =>
      expect(screen.queryByTestId('vocab-card-v-1')).not.toBeInTheDocument(),
    )
  })

  it('delete cancel: clicking cancel does not call deleteVocabularyItem', async () => {
    mockedList.mockResolvedValueOnce(sampleItems as never)
    renderScreen(<VocabularyScreen />)

    await screen.findByText('fascinating')
    const card = screen.getByTestId('vocab-card-v-1')
    await userEvent.click(within(card).getByRole('button', { name: /delete/i }))

    const cancelBtn = await screen.findByRole('button', { name: /cancel/i })
    await userEvent.click(cancelBtn)

    expect(mockedDelete).not.toHaveBeenCalled()
    expect(screen.getByTestId('vocab-card-v-1')).toBeInTheDocument()
  })

  it('enter review mode "Review All": first card word shown, translation hidden', async () => {
    mockedList.mockResolvedValueOnce(sampleItems as never)
    renderScreen(<VocabularyScreen />)

    await screen.findByText('fascinating')
    await userEvent.click(screen.getByRole('button', { name: /review all/i }))

    expect(await screen.findByTestId('review-card')).toBeInTheDocument()
    expect(screen.getByTestId('review-progress')).toHaveTextContent('1 / 2')
    expect(screen.queryByTestId('review-back')).not.toBeInTheDocument()
  })

  it('clicking Reveal shows translation/ipa and Known + Unknown buttons', async () => {
    mockedList.mockResolvedValueOnce(sampleItems as never)
    renderScreen(<VocabularyScreen />)

    await screen.findByText('fascinating')
    await userEvent.click(screen.getByRole('button', { name: /review all/i }))

    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }))

    expect(screen.getByTestId('review-back')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^known/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unknown/i })).toBeInTheDocument()
  })

  it('clicking Known calls markVocabularyReviewed and advances to next card', async () => {
    mockedList.mockResolvedValueOnce(sampleItems as never)
    mockedReview.mockResolvedValue(undefined)
    renderScreen(<VocabularyScreen />)

    await screen.findByText('fascinating')
    await userEvent.click(screen.getByRole('button', { name: /review all/i }))
    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }))
    await userEvent.click(screen.getByRole('button', { name: /^known/i }))

    await waitFor(() =>
      expect(mockedReview).toHaveBeenCalledWith('v-1', 'known'),
    )
    await waitFor(() =>
      expect(screen.getByTestId('review-progress')).toHaveTextContent('2 / 2'),
    )
  })

  it('completing all cards shows done summary; Back to list returns to list', async () => {
    mockedList.mockResolvedValueOnce(sampleItems as never)
    mockedReview.mockResolvedValue(undefined)
    renderScreen(<VocabularyScreen />)

    await screen.findByText('fascinating')
    await userEvent.click(screen.getByRole('button', { name: /review all/i }))

    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }))
    await userEvent.click(screen.getByRole('button', { name: /^known/i }))

    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }))
    await userEvent.click(screen.getByRole('button', { name: /unknown/i }))

    const summary = await screen.findByTestId('review-done')
    expect(summary).toHaveTextContent('1')

    await userEvent.click(screen.getByRole('button', { name: /back to list/i }))
    expect(await screen.findByText('fascinating')).toBeInTheDocument()
    expect(screen.queryByTestId('review-done')).not.toBeInTheDocument()
  })
})
