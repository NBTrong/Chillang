import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export type TextSelectionState = {
  word: string
  contextSentence: string
  position: { top: number; left: number }
}

const MAX_SELECTION_LENGTH = 100
const POPUP_WIDTH = 420
const POPUP_HEIGHT = 320
const VIEWPORT_PADDING = 16
const POSITION_OFFSET = 12

const isSentenceLikeTag = (tag: string) =>
  tag === 'P' || tag === 'SPAN' || tag === 'LI' || tag === 'DIV' || tag === 'BLOCKQUOTE'

const findSentenceAncestor = (node: Node | null): HTMLElement | null => {
  let current: Node | null = node
  while (current) {
    if (current.nodeType === 1) {
      const el = current as HTMLElement
      if (isSentenceLikeTag(el.tagName)) {
        return el
      }
    }
    current = current.parentNode
  }
  return null
}

const clampPosition = (top: number, left: number) => {
  const maxLeft = Math.max(
    VIEWPORT_PADDING,
    window.innerWidth - POPUP_WIDTH - VIEWPORT_PADDING,
  )
  const maxTop = Math.max(
    VIEWPORT_PADDING,
    window.innerHeight - POPUP_HEIGHT - VIEWPORT_PADDING,
  )
  return {
    top: Math.min(Math.max(VIEWPORT_PADDING, top), maxTop),
    left: Math.min(Math.max(VIEWPORT_PADDING, left), maxLeft),
  }
}

export function useTextSelection(
  containerRef: RefObject<HTMLElement | null>,
): { selection: TextSelectionState | null; clear: () => void } {
  const [selection, setSelectionState] = useState<TextSelectionState | null>(null)

  const containerRefRef = useRef(containerRef)
  containerRefRef.current = containerRef

  const handleSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      setSelectionState(null)
      return
    }

    const word = sel.toString().trim()
    if (!word || word.length > MAX_SELECTION_LENGTH) {
      setSelectionState(null)
      return
    }

    const range = sel.getRangeAt(0)
    const container = containerRefRef.current.current
    if (!container) {
      setSelectionState(null)
      return
    }

    if (!container.contains(range.commonAncestorContainer as Node)) {
      setSelectionState(null)
      return
    }

    const ancestor =
      findSentenceAncestor(range.commonAncestorContainer) || container
    const contextSentence = (ancestor.textContent || '').trim()

    const rect =
      range.getBoundingClientRect() ||
      (range.getClientRects()[0] as DOMRect | undefined)

    const rawTop = rect ? rect.bottom + POSITION_OFFSET : 0
    const rawLeft = rect ? rect.left : 0
    const position = clampPosition(rawTop, rawLeft)

    setSelectionState({ word, contextSentence, position })
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('touchend', handleSelection)
    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('touchend', handleSelection)
    }
  }, [handleSelection])

  const clear = useCallback(() => {
    try {
      window.getSelection()?.removeAllRanges()
    } catch {
      // ignore
    }
    setSelectionState(null)
  }, [])

  return { selection, clear }
}
