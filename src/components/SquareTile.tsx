import type { ReactNode } from 'react'
import './SquareTile.css'

interface SquareTileProps {
  label: string
  children?: ReactNode
  onClick?: () => void
}

/** A square grid cell with a small straight cut on each corner (no rounding). */
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
