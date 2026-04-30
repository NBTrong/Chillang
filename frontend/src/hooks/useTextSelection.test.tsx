import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'
import { useTextSelection } from './useTextSelection'

// ---------------------------------------------------------------------------
// Helpers — stub window.getSelection() and Range.getBoundingClientRect()
// ---------------------------------------------------------------------------

type SelectionStub = {
  toString: () => string
  rangeCount: number
  isCollapsed: boolean
  getRangeAt: (i: number) => RangeStub
  removeAllRanges: () => void
}
type RangeStub = {
  startContainer: Node
  endContainer: Node
  commonAncestorContainer: Node
  getBoundingClientRect: () => DOMRect
  getClientRects: () => DOMRect[]
}

function makeRect(overrides: Partial<DOMRect> = {}): DOMRect {
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
    ...overrides,
  } as DOMRect
}

function setSelection(opts: {
  text: string
  container: HTMLElement
  rect?: DOMRect
}): SelectionStub {
  const range: RangeStub = {
    startContainer: opts.container,
    endContainer: opts.container,
    commonAncestorContainer: opts.container,
    getBoundingClientRect: () => opts.rect || makeRect(),
    getClientRects: () => [opts.rect || makeRect()],
  }
  const sel: SelectionStub = {
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
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

function renderWithContainer(html: string) {
  const wrapper = document.createElement('div')
  // Wrap caller html inside a host div so wrapper itself acts as the container
  // and inner elements (e.g. <p>) can be queried via querySelector.
  wrapper.innerHTML = `<div data-host>${html}</div>`
  document.body.appendChild(wrapper)
  const container = wrapper.firstElementChild as HTMLElement

  const { result } = renderHook(() => {
    const ref = useRef<HTMLElement>(container)
    return useTextSelection(ref)
  })
  return { result, container, wrapper }
}

describe('useTextSelection', () => {
  it('returns null initially', () => {
    const { result } = renderWithContainer('<p>Hello world.</p>')
    expect(result.current.selection).toBeNull()
  })

  it('returns selection on mouseup when text is inside the container', () => {
    const { result, container } = renderWithContainer('<p>Hello world.</p>')
    const p = container.querySelector('p') as HTMLParagraphElement
    setSelection({ text: 'Hello', container: p, rect: makeRect({ top: 200, left: 80 }) })

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    expect(result.current.selection).not.toBeNull()
    expect(result.current.selection!.word).toBe('Hello')
    expect(result.current.selection!.position.top).toBeGreaterThanOrEqual(0)
    expect(result.current.selection!.position.left).toBeGreaterThanOrEqual(0)
  })

  it('returns null when selection is outside the container', () => {
    const { result } = renderWithContainer('<p>Inside text.</p>')
    const outside = document.createElement('p')
    outside.textContent = 'Outside paragraph.'
    document.body.appendChild(outside)

    setSelection({ text: 'Outside', container: outside })

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    expect(result.current.selection).toBeNull()
  })

  it('returns null when selection is empty', () => {
    const { result, container } = renderWithContainer('<p>Some text.</p>')
    setSelection({ text: '   ', container: container.querySelector('p') as HTMLElement })

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    expect(result.current.selection).toBeNull()
  })

  it('returns null when selection is longer than 100 chars', () => {
    const { result, container } = renderWithContainer('<p>Lots of text here.</p>')
    const longText = 'a'.repeat(101)
    setSelection({ text: longText, container: container.querySelector('p') as HTMLElement })

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    expect(result.current.selection).toBeNull()
  })

  it('extracts contextSentence from the parent paragraph', () => {
    const { result, container } = renderWithContainer(
      '<p>This is a long sentence with the word fascinating in it.</p>'
    )
    const p = container.querySelector('p') as HTMLElement
    setSelection({ text: 'fascinating', container: p })

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    expect(result.current.selection).not.toBeNull()
    expect(result.current.selection!.contextSentence).toBe(
      'This is a long sentence with the word fascinating in it.'
    )
  })

  it('clear() resets state and calls removeAllRanges', () => {
    const { result, container } = renderWithContainer('<p>Hello world.</p>')
    const p = container.querySelector('p') as HTMLElement
    const sel = setSelection({ text: 'Hello', container: p })

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })
    expect(result.current.selection).not.toBeNull()

    act(() => {
      result.current.clear()
    })

    expect(result.current.selection).toBeNull()
    expect(sel.removeAllRanges).toHaveBeenCalled()
  })

  it('responds to touchend events too', () => {
    const { result, container } = renderWithContainer('<p>Hello world.</p>')
    const p = container.querySelector('p') as HTMLElement
    setSelection({ text: 'world', container: p })

    act(() => {
      document.dispatchEvent(new Event('touchend', { bubbles: true }))
    })

    expect(result.current.selection).not.toBeNull()
    expect(result.current.selection!.word).toBe('world')
  })
})
