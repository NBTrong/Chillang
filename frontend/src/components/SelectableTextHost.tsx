import { useEffect, useRef, type ReactNode } from 'react'
import { useTextSelection } from '../hooks/useTextSelection'
import { TranslationPopup } from './TranslationPopup'

export type SelectableTextHostProps = {
  children: ReactNode
  sourceVideoId?: string
  /**
   * When true, the inner translation popup is suppressed even if the user
   * makes a free-text selection. Useful when another popup (e.g. an existing
   * dictionary popup) is already open and we don't want them to stack.
   */
  suppressed?: boolean
  /**
   * Called when a free-text selection is made and the popup is about to open.
   * The host can use this to close any other concurrently-open popups.
   */
  onSelectionOpen?: () => void
  className?: string
}

export function SelectableTextHost({
  children,
  sourceVideoId,
  suppressed = false,
  onSelectionOpen,
  className,
}: SelectableTextHostProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { selection, clear } = useTextSelection(containerRef)

  // Notify the parent the first time a new selection produces a popup so the
  // parent can dismiss any other coexisting popups.
  const lastNotifiedKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (suppressed || !selection) {
      lastNotifiedKeyRef.current = null
      return
    }
    const key = `${selection.word}|${selection.contextSentence}`
    if (lastNotifiedKeyRef.current !== key) {
      lastNotifiedKeyRef.current = key
      onSelectionOpen?.()
    }
  }, [selection, suppressed, onSelectionOpen])

  const showPopup = !suppressed && selection !== null

  return (
    <>
      <div ref={containerRef} data-selectable-text-host className={className}>
        {children}
      </div>
      {showPopup && selection && (
        <TranslationPopup
          key={`${selection.word}|${selection.contextSentence}`}
          word={selection.word}
          contextSentence={selection.contextSentence}
          position={selection.position}
          sourceVideoId={sourceVideoId}
          onClose={clear}
        />
      )}
    </>
  )
}

export default SelectableTextHost
