import type { Offer } from '../data/mockOffers'
import type { GridSize } from '../settings/types'
import { SquareTile } from './SquareTile'
import './GridSection.css'

interface GridSectionProps {
  heading: string
  offers: Offer[]
  gridSize: GridSize
  openFullLabel: string
  onOpenFull: () => void
  onSelectOffer: (offer: Offer) => void
}

/** A fixed, non-scrollable section (Ads or Your offers) with a corner arrow to the full page.
 *  Always an N×N grid of picture-only square tiles, N being the grid size setting — there's no
 *  fixed item count, it scales with the setting (1x1, 2x2, 3x3, 4x4, ...).
 *
 *  The grid frame itself is locked to a square (the largest that fits the space it's given), so
 *  its N equal columns and N equal rows are square cells by construction — offers stay locked to
 *  the same size and the same distance apart, and only the frame's overall size (not its shape)
 *  responds to available space. */
export function GridSection({ heading, offers, gridSize, openFullLabel, onOpenFull, onSelectOffer }: GridSectionProps) {
  const visibleOffers = offers.slice(0, gridSize * gridSize)

  return (
    <section className="grid-section">
      <header className="grid-section__header">
        <h2>{heading}</h2>
        <button type="button" className="grid-section__corner-arrow" onClick={onOpenFull} aria-label={openFullLabel}>
          <span aria-hidden="true">↗</span>
        </button>
      </header>

      <div className="grid-section__frame">
        <div
          className="grid-section__grid"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)` }}
        >
          {visibleOffers.map((offer) => (
            <SquareTile key={offer.id} label={offer.title} onClick={() => onSelectOffer(offer)}>
              <span className="square-tile__icon" aria-hidden="true">
                {offer.icon}
              </span>
            </SquareTile>
          ))}
        </div>
      </div>
    </section>
  )
}
