import type { ReactNode } from 'react'
import './SquareTile.css'

interface SquareTileProps {
  label: string
  children?: ReactNode
  onClick?: () => void
}

/** One cell of a grid. Cells are already square by construction (GridSection locks the whole
 *  grid frame to a square), so the tile just fills its cell — no extra sizing math here. Carries
 *  the same small straight corner cut as the rest of the app's chamfered look. */
export function SquareTile({ label, children, onClick }: SquareTileProps) {
  if (!onClick) {
    return (
      <div className="square-tile" aria-label={label}>
        {children}
      </div>
    )
  }

  return (
    <button type="button" className="square-tile square-tile--clickable" onClick={onClick} aria-label={label}>
      {children}
    </button>
  )
}
