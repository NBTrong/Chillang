import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---- Mock the supabase client ---------------------------------------------
// Build a fluent chain mock. Each leaf returns a configurable result.
type LeafResult = { data: unknown; error: unknown }

interface MockState {
  // Leaf results — set per-test via the helpers below.
  maybeSingleResult: LeafResult
  singleResult: LeafResult
  selectArrayResult: LeafResult
  updateResult: LeafResult
  invokeResult: LeafResult
  sessionResult: { data: { session: { user: { id: string } } | null } | null }

  // Spies for assertions on what was passed.
  fromSpy: SpyFn
  selectSpy: SpyFn
  insertSpy: SpyFn
  updateSpy: SpyFn
  eqSpy: SpyFn
  orSpy: SpyFn
  orderSpy: SpyFn
  maybeSingleSpy: SpyFn
  singleSpy: SpyFn
  invokeSpy: SpyFn
  getSessionSpy: SpyFn
}

type SpyFn = ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>

const state: MockState = {
  maybeSingleResult: { data: null, error: null },
  singleResult: { data: null, error: null },
  selectArrayResult: { data: [], error: null },
  updateResult: { data: null, error: null },
  invokeResult: { data: null, error: null },
  sessionResult: { data: { session: { user: { id: 'user-123' } } } },
  fromSpy: vi.fn(),
  selectSpy: vi.fn(),
  insertSpy: vi.fn(),
  updateSpy: vi.fn(),
  eqSpy: vi.fn(),
  orSpy: vi.fn(),
  orderSpy: vi.fn(),
  maybeSingleSpy: vi.fn(),
  singleSpy: vi.fn(),
  invokeSpy: vi.fn(),
  getSessionSpy: vi.fn(),
}

const resetState = () => {
  state.maybeSingleResult = { data: null, error: null }
  state.singleResult = { data: null, error: null }
  state.selectArrayResult = { data: [], error: null }
  state.updateResult = { data: null, error: null }
  state.invokeResult = { data: null, error: null }
  state.sessionResult = { data: { session: { user: { id: 'user-123' } } } }
  state.fromSpy.mockReset()
  state.selectSpy.mockReset()
  state.insertSpy.mockReset()
  state.updateSpy.mockReset()
  state.eqSpy.mockReset()
  state.orSpy.mockReset()
  state.orderSpy.mockReset()
  state.maybeSingleSpy.mockReset()
  state.singleSpy.mockReset()
  state.invokeSpy.mockReset()
  state.getSessionSpy.mockReset()
}

vi.mock('../lib/supabaseClient', () => {
  const buildChain = (mode: 'select' | 'insert' | 'update') => {
    const chain: Record<string, unknown> = {}

    chain.select = (...args: unknown[]) => {
      state.selectSpy(...args)
      return chain
    }
    chain.insert = (...args: unknown[]) => {
      state.insertSpy(...args)
      return chain
    }
    chain.update = (...args: unknown[]) => {
      state.updateSpy(...args)
      return chain
    }
    chain.eq = (...args: unknown[]) => {
      state.eqSpy(...args)
      if (mode === 'update') {
        return Promise.resolve(state.updateResult)
      }
      return chain
    }
    chain.or = (...args: unknown[]) => {
      state.orSpy(...args)
      return chain
    }
    chain.order = (...args: unknown[]) => {
      state.orderSpy(...args)
      if (mode === 'select') {
        return Promise.resolve(state.selectArrayResult)
      }
      return chain
    }
    chain.maybeSingle = (...args: unknown[]) => {
      state.maybeSingleSpy(...args)
      return Promise.resolve(state.maybeSingleResult)
    }
    chain.single = (...args: unknown[]) => {
      state.singleSpy(...args)
      return Promise.resolve(state.singleResult)
    }
    chain.then = (resolve: (v: LeafResult) => unknown) => {
      if (mode === 'update') return Promise.resolve(state.updateResult).then(resolve)
      if (mode === 'select') return Promise.resolve(state.selectArrayResult).then(resolve)
      return Promise.resolve(state.singleResult).then(resolve)
    }
    return chain
  }

  return {
    supabase: {
      from: (table: string) => {
        state.fromSpy(table)
        const chain: Record<string, unknown> = {}
        chain.select = (...args: unknown[]) => {
          state.selectSpy(...args)
          return buildChain('select')
        }
        chain.insert = (...args: unknown[]) => {
          state.insertSpy(...args)
          return buildChain('insert')
        }
        chain.update = (...args: unknown[]) => {
          state.updateSpy(...args)
          return buildChain('update')
        }
        return chain
      },
      auth: {
        getSession: (...args: unknown[]) => {
          state.getSessionSpy(...args)
          return Promise.resolve(state.sessionResult)
        },
      },
      functions: {
        invoke: (...args: unknown[]) => {
          state.invokeSpy(...args)
          return Promise.resolve(state.invokeResult)
        },
      },
    },
  }
})

// Import AFTER vi.mock is registered.
import {
  translateWord,
  saveWordToVocabulary,
  listVocabulary,
  deleteVocabularyItem,
  markVocabularyReviewed,
} from './supabaseApi'

beforeEach(() => {
  resetState()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-04-30T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// translateWord
// ---------------------------------------------------------------------------
describe('translateWord', () => {
  it('invokes the translate-word edge function and returns data', async () => {
    state.invokeResult = {
      data: {
        word: 'serendipity',
        ipa: '/ˌsɛrənˈdɪpɪti/',
        translation: 'sự tình cờ may mắn',
        definition: 'a happy accident',
      },
      error: null,
    }

    const result = await translateWord({
      word: 'serendipity',
      context: 'a moment of pure serendipity',
      targetLanguage: 'vi',
    })

    expect(state.invokeSpy).toHaveBeenCalledWith('translate-word', {
      body: { word: 'serendipity', context: 'a moment of pure serendipity', targetLanguage: 'vi' },
    })
    expect(result).toMatchObject({ word: 'serendipity', translation: 'sự tình cờ may mắn' })
  })

  it('throws when invoke returns an error', async () => {
    state.invokeResult = { data: null, error: new Error('boom') }
    await expect(translateWord({ word: 'x' })).rejects.toThrow('boom')
  })
})

// ---------------------------------------------------------------------------
// saveWordToVocabulary
// ---------------------------------------------------------------------------
describe('saveWordToVocabulary', () => {
  it('inserts the word with owner_id from the current session and returns the row', async () => {
    state.singleResult = {
      data: {
        id: 'vocab-1',
        word: 'hello',
        translation: 'xin chào',
        mastery_level: 'new',
      },
      error: null,
    }

    const result = await saveWordToVocabulary({
      word: 'hello',
      translation: 'xin chào',
      ipa: '/həˈloʊ/',
      context_sentence: 'I said hello.',
      source_text: 'Hello world story',
    })

    expect(state.fromSpy).toHaveBeenCalledWith('vocabulary_items')
    expect(state.insertSpy).toHaveBeenCalledTimes(1)
    const insertArg = state.insertSpy.mock.calls[0][0] as Record<string, unknown>
    expect(insertArg).toMatchObject({
      word: 'hello',
      translation: 'xin chào',
      ipa: '/həˈloʊ/',
      context_sentence: 'I said hello.',
      source_text: 'Hello world story',
      owner_id: 'user-123',
    })
    expect(result).toMatchObject({ id: 'vocab-1', word: 'hello' })
  })

  it('throws when there is no session', async () => {
    state.sessionResult = { data: { session: null } }
    await expect(
      saveWordToVocabulary({ word: 'hi', translation: 'xin chào' })
    ).rejects.toThrow('User not authenticated')
  })

  it('propagates supabase insert errors', async () => {
    state.singleResult = { data: null, error: new Error('insert failed') }
    await expect(
      saveWordToVocabulary({ word: 'hi', translation: 'xin chào' })
    ).rejects.toThrow('insert failed')
  })
})

// ---------------------------------------------------------------------------
// listVocabulary
// ---------------------------------------------------------------------------
describe('listVocabulary', () => {
  it('returns the rows when called with no options', async () => {
    state.selectArrayResult = {
      data: [{ id: 'a', word: 'one' }, { id: 'b', word: 'two' }],
      error: null,
    }

    const result = await listVocabulary()

    expect(state.fromSpy).toHaveBeenCalledWith('vocabulary_items')
    expect(state.eqSpy).toHaveBeenCalledWith('is_deleted', false)
    expect(state.orderSpy).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(state.orSpy).not.toHaveBeenCalled()
    expect(result).toHaveLength(2)
  })

  it('applies the due_at filter when dueOnly is true', async () => {
    state.selectArrayResult = { data: [], error: null }

    await listVocabulary({ dueOnly: true })

    expect(state.orSpy).toHaveBeenCalledTimes(1)
    const orArg = state.orSpy.mock.calls[0][0] as string
    expect(orArg).toContain('due_at.lte.')
    expect(orArg).toContain('due_at.is.null')
  })

  it('propagates supabase errors', async () => {
    state.selectArrayResult = { data: null, error: new Error('select failed') }
    await expect(listVocabulary()).rejects.toThrow('select failed')
  })
})

// ---------------------------------------------------------------------------
// deleteVocabularyItem
// ---------------------------------------------------------------------------
describe('deleteVocabularyItem', () => {
  it('soft-deletes by setting is_deleted and deleted_at', async () => {
    state.updateResult = { data: null, error: null }

    await deleteVocabularyItem('vocab-9')

    expect(state.fromSpy).toHaveBeenCalledWith('vocabulary_items')
    expect(state.updateSpy).toHaveBeenCalledTimes(1)
    const payload = state.updateSpy.mock.calls[0][0] as Record<string, unknown>
    expect(payload).toMatchObject({
      is_deleted: true,
      deleted_at: '2026-04-30T12:00:00.000Z',
    })
    expect(state.eqSpy).toHaveBeenCalledWith('id', 'vocab-9')
  })

  it('propagates supabase errors', async () => {
    state.updateResult = { data: null, error: new Error('delete failed') }
    await expect(deleteVocabularyItem('vocab-9')).rejects.toThrow('delete failed')
  })
})

// ---------------------------------------------------------------------------
// markVocabularyReviewed
// ---------------------------------------------------------------------------
describe('markVocabularyReviewed', () => {
  it("known: bumps 'new' -> 'learning' and schedules due_at +0.5h", async () => {
    state.maybeSingleResult = {
      data: { id: 'v1', mastery_level: 'new', review_count: 0 },
      error: null,
    }
    state.updateResult = { data: null, error: null }

    await markVocabularyReviewed('v1', 'known')

    expect(state.maybeSingleSpy).toHaveBeenCalledTimes(1)
    expect(state.updateSpy).toHaveBeenCalledTimes(1)
    const payload = state.updateSpy.mock.calls[0][0] as Record<string, unknown>
    expect(payload.mastery_level).toBe('learning')
    expect(payload.review_count).toBe(1)
    expect(payload.last_reviewed_at).toBe('2026-04-30T12:00:00.000Z')
    expect(payload.due_at).toBe('2026-04-30T12:30:00.000Z')
  })

  it("known: bumps 'learning' -> 'hard' and schedules +1 day", async () => {
    state.maybeSingleResult = {
      data: { id: 'v2', mastery_level: 'learning', review_count: 3 },
      error: null,
    }

    await markVocabularyReviewed('v2', 'known')

    const payload = state.updateSpy.mock.calls[0][0] as Record<string, unknown>
    expect(payload.mastery_level).toBe('hard')
    expect(payload.review_count).toBe(4)
    expect(payload.due_at).toBe('2026-05-01T12:00:00.000Z')
  })

  it("known: bumps 'hard' -> 'mastered' and schedules +3 days", async () => {
    state.maybeSingleResult = {
      data: { id: 'v3', mastery_level: 'hard', review_count: 10 },
      error: null,
    }

    await markVocabularyReviewed('v3', 'known')

    const payload = state.updateSpy.mock.calls[0][0] as Record<string, unknown>
    expect(payload.mastery_level).toBe('mastered')
    expect(payload.due_at).toBe('2026-05-03T12:00:00.000Z')
  })

  it("known: caps at 'mastered' and schedules +7 days", async () => {
    state.maybeSingleResult = {
      data: { id: 'v4', mastery_level: 'mastered', review_count: 25 },
      error: null,
    }

    await markVocabularyReviewed('v4', 'known')

    const payload = state.updateSpy.mock.calls[0][0] as Record<string, unknown>
    expect(payload.mastery_level).toBe('mastered')
    expect(payload.due_at).toBe('2026-05-07T12:00:00.000Z')
    expect(new Date(payload.due_at as string).getTime()).toBeGreaterThan(
      new Date('2026-04-30T12:00:00Z').getTime()
    )
  })

  it("unknown: from 'mastered' resets to 'learning' and schedules +10 minutes", async () => {
    state.maybeSingleResult = {
      data: { id: 'v5', mastery_level: 'mastered', review_count: 5 },
      error: null,
    }

    await markVocabularyReviewed('v5', 'unknown')

    const payload = state.updateSpy.mock.calls[0][0] as Record<string, unknown>
    expect(payload.mastery_level).toBe('learning')
    expect(payload.review_count).toBe(6)
    expect(payload.last_reviewed_at).toBe('2026-04-30T12:00:00.000Z')
    expect(payload.due_at).toBe('2026-04-30T12:10:00.000Z')
  })

  it("unknown: from 'new' stays at 'new'", async () => {
    state.maybeSingleResult = {
      data: { id: 'v6', mastery_level: 'new', review_count: 0 },
      error: null,
    }

    await markVocabularyReviewed('v6', 'unknown')

    const payload = state.updateSpy.mock.calls[0][0] as Record<string, unknown>
    expect(payload.mastery_level).toBe('new')
    expect(payload.due_at).toBe('2026-04-30T12:10:00.000Z')
  })

  it('propagates supabase errors from the read', async () => {
    state.maybeSingleResult = { data: null, error: new Error('read failed') }
    await expect(markVocabularyReviewed('v9', 'known')).rejects.toThrow('read failed')
  })

  it('propagates supabase errors from the update', async () => {
    state.maybeSingleResult = {
      data: { id: 'v9', mastery_level: 'new', review_count: 0 },
      error: null,
    }
    state.updateResult = { data: null, error: new Error('update failed') }
    await expect(markVocabularyReviewed('v9', 'known')).rejects.toThrow('update failed')
  })
})
