import { useRef, type PointerEvent } from 'react'
import { isSwipeUp } from '../utils/swipe'
import './SwipeUpHint.css'

interface SwipeUpHintProps {
  /** Default swipe-up target is Wallet; reassignable later in Settings (not in this prototype). */
  onTrigger: () => void
}

export function SwipeUpHint({ onTrigger }: SwipeUpHintProps) {
  const startY = useRef<number | null>(null)

  const handlePointerDown = (event: PointerEvent) => {
    startY.current = event.clientY
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (startY.current !== null && isSwipeUp(startY.current, event.clientY)) {
      onTrigger()
    }
    startY.current = null
  }

  return (
    <div
      className="swipe-up-hint"
      role="button"
      tabIndex={0}
      aria-label="Open Wallet"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={onTrigger}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onTrigger()
      }}
    >
      <span aria-hidden="true">︿</span>
      <span className="swipe-up-hint__text">Swipe up for Wallet</span>
    </div>
  )
}
