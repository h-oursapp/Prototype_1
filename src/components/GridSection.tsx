import type { Offer } from '../data/mockOffers'
import type { GridSize } from '../settings/types'
import { SquareTile } from './SquareTile'
import { StarRating } from './StarRating'
import './GridSection.css'

interface GridSectionProps {
  heading: string
  offers: Offer[]
  gridSize: GridSize
  openFullLabel: string
  onOpenFull: () => void
  onSelectOffer: (offer: Offer) => void
  /** Which side the corner arrow sits on, and which way it points (TODO #3). The heading always
   *  sits centered between the two possible arrow slots, so it reads the same regardless of which
   *  side is in use. MainPage pairs each side with a matching swipe direction: a left arrow with a
   *  left-to-right swipe, a right arrow with a right-to-left swipe. */
  arrowSide: 'left' | 'right'
  /** Reserves the grid's last cell for a "create new offer" tile. Only Your offers passes this —
   *  Ads are other people's listings, there's nothing here to create. The tile lands right after
   *  the last real offer if there's room, or takes over the very last cell once the grid is
   *  already full (TODO #3: "after the last of your offers, or in the last grid space"). */
  onCreateNew?: () => void
  createLabel?: string
}

/** A fixed, non-scrollable section (Ads or Your offers) with a corner arrow to the full page.
 *  Always an N×N grid of square tiles, N being the grid size setting — there's no fixed item
 *  count, it scales with the setting (1x1, 2x2, 3x3, 4x4, ...). Each tile shows the offer's name
 *  and rating overlaid on its picture (TODO #3), the same convention SkillsPage uses for its own
 *  tiles.
 *
 *  The grid frame itself is locked to a square (the largest that fits the space it's given), so
 *  its N equal columns and N equal rows are square cells by construction — offers stay locked to
 *  the same size and the same distance apart, and only the frame's overall size (not its shape)
 *  responds to available space. */
export function GridSection({
  heading,
  offers,
  gridSize,
  openFullLabel,
  onOpenFull,
  onSelectOffer,
  arrowSide,
  onCreateNew,
  createLabel,
}: GridSectionProps) {
  const capacity = gridSize * gridSize
  const visibleOffers = offers.slice(0, onCreateNew ? capacity - 1 : capacity)
  const arrowIcon = arrowSide === 'left' ? '←' : '→'

  return (
    <section className="grid-section">
      <header className={`grid-section__header grid-section__header--arrow-${arrowSide}`}>
        {arrowSide === 'left' && (
          <button type="button" className="grid-section__corner-arrow" onClick={onOpenFull} aria-label={openFullLabel}>
            <span aria-hidden="true">{arrowIcon}</span>
          </button>
        )}
        <h2>{heading}</h2>
        {arrowSide === 'right' && (
          <button type="button" className="grid-section__corner-arrow" onClick={onOpenFull} aria-label={openFullLabel}>
            <span aria-hidden="true">{arrowIcon}</span>
          </button>
        )}
      </header>

      <div className="grid-section__frame">
        <div
          className="grid-section__grid"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)` }}
        >
          {visibleOffers.map((offer) => (
            <SquareTile
              key={offer.id}
              label={offer.title}
              onClick={() => onSelectOffer(offer)}
              overlay={
                <>
                  <span className="grid-section__tile-name">{offer.title}</span>
                  <StarRating value={offer.rating} subject={`${offer.title}'s rating`} />
                </>
              }
            >
              <span className="square-tile__icon" aria-hidden="true">
                {offer.icon}
              </span>
            </SquareTile>
          ))}

          {onCreateNew && (
            <SquareTile label={createLabel ?? 'Create new offer'} onClick={onCreateNew}>
              <span className="square-tile__icon" aria-hidden="true">
                +
              </span>
            </SquareTile>
          )}
        </div>
      </div>
    </section>
  )
}
