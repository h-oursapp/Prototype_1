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
    // role="img" is load-bearing: aria-label on a plain <div> has no role to attach to, so
    // assistive tech drops it and the tile becomes an unlabelled blank.
    return (
      <div className="square-tile" role="img" aria-label={label}>
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
