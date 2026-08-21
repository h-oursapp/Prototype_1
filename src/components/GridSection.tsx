import { useFittingRows } from '../hooks/useFittingRows'
import type { Offer } from '../data/mockOffers'
import type { GridSize } from '../settings/types'
import { PagedGrid } from './PagedGrid'
import { RatingBadge } from './RatingBadge'
import { SquareTile } from './SquareTile'
import { MAX_STARS } from './StarRating'
import { WorthBadge } from './WorthBadge'
import './GridSection.css'

interface GridSectionProps {
  /** Not displayed (TODO #3 drops the visible "Ads" label) — just the grid's accessible name,
   *  same job `gridLabel` does anywhere else PagedGrid is used. */
  heading: string
  offers: Offer[]
  gridSize: GridSize
  onSelectOffer: (offer: Offer) => void
}

/** Home's Ads grid (Appkarte §3, reworked by TODO #3): a fixed, non-scrollable grid of square
 *  tiles, sized to fill whatever page height Home actually has rather than being forced into a
 *  square frame — "as many rows as the page fits". Columns still come from the grid-size setting,
 *  same as ever; `useFittingRows` measures the space this section is given and works out rows,
 *  the same split Inventory's own grid uses (TODO #9) and for the same reason: a tall viewport
 *  should show more rows, not just bigger ones.
 *
 *  Offers beyond that capacity aren't paged through here — overflow is Search's job (Home's new
 *  corner button and its matching swipe both lead there), not this grid's, so `reserveBottomPx={0}`
 *  is passed to `useFittingRows`: there's no pager row to leave room for. PagedGrid is still what
 *  renders the grid itself (square cells, empty-slot padding when there are too few offers to
 *  fill it) — its own pager just never gets the chance to appear, since the slice below is always
 *  already capped at one page's worth.
 *
 *  "Show the worth of the item offers on Home" (a later, un-numbered session): an item-kind offer's
 *  tile now also carries a `WorthBadge`, pinned to the opposite corner from `RatingBadge` — skill
 *  offers don't get one, since worth is an item-only concept (mockInventory.ts's own
 *  `InventoryItem.worth` comment). There's no separate `worth` field on `Offer` to read for it:
 *  Márk's own words, "the offer has a price attribute but that should be replaced with the items
 *  worth" — `hours` (its own doc comment: "the listed price in hours") already *is* an item offer's
 *  worth in hours, so the badge just reads that number rather than a second one invented to agree
 *  with it. */
export function GridSection({ heading, offers, gridSize, onSelectOffer }: GridSectionProps) {
  const { containerRef, rows } = useFittingRows(gridSize, gridSize, 0)
  const visibleOffers = offers.slice(0, gridSize * rows)

  return (
    <section className="grid-section">
      <div className="grid-section__area" ref={containerRef}>
        <PagedGrid
          items={visibleOffers}
          getKey={(offer) => offer.id}
          columns={gridSize}
          rows={rows}
          gridLabel={heading}
          renderTile={(offer) => {
            const isItem = offer.kind === 'item'
            const worthSuffix = isItem ? `, worth ${offer.hours}h` : ''
            return (
              <SquareTile
                label={`${offer.title}, rated ${offer.rating} out of ${MAX_STARS}${worthSuffix}`}
                onClick={() => onSelectOffer(offer)}
                overlay={<span className="grid-section__tile-name">{offer.title}</span>}
              >
                <span className="square-tile__icon" aria-hidden="true">
                  {offer.icon}
                </span>
                <RatingBadge value={offer.rating} />
                {isItem && <WorthBadge hours={offer.hours} />}
              </SquareTile>
            )
          }}
        />
      </div>
    </section>
  )
}
