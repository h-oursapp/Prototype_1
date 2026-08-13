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

/** A fixed, non-scrollable offers grid (Ads or Your offers) with a corner arrow to the full page. */
export function GridSection({ heading, offers, gridSize, openFullLabel, onOpenFull, onSelectOffer }: GridSectionProps) {
  return (
    <section className="grid-section">
      <header className="grid-section__header">
        <h2>{heading}</h2>
        <button type="button" className="grid-section__corner-arrow" onClick={onOpenFull} aria-label={openFullLabel}>
          <span aria-hidden="true">↗</span>
        </button>
      </header>

      <div className="grid-section__grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {offers.map((offer) => (
          <SquareTile key={offer.id} label={offer.title} onClick={() => onSelectOffer(offer)}>
            <span className="square-tile__icon" aria-hidden="true">
              {offer.icon}
            </span>
            <span className="square-tile__title">{offer.title}</span>
          </SquareTile>
        ))}
      </div>
    </section>
  )
}
