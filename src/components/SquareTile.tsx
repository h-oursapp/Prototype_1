import type { ReactNode } from 'react'
import './SquareTile.css'

interface SquareTileProps {
  label: string
  children?: ReactNode
  onClick?: () => void
}

/** A grid cell (bordered, so the grid lines stay visible) containing a square shape with a small
 *  straight cut on each corner. The square is sized to the largest square that fits the cell —
 *  whichever of the cell's width/height is smaller — so it stays a true square at any grid size,
 *  even when a row of cells ends up wider or taller than it is square. */
export function SquareTile({ label, children, onClick }: SquareTileProps) {
  const shape = <span className="square-tile__shape">{children}</span>

  if (!onClick) {
    return (
      <div className="square-tile" aria-label={label}>
        {shape}
      </div>
    )
  }

  return (
    <button type="button" className="square-tile square-tile--clickable" onClick={onClick} aria-label={label}>
      {shape}
    </button>
  )
}
