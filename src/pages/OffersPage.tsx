import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { PagedGrid } from '../components/PagedGrid'
import { SearchBar } from '../components/SearchBar'
import { SquareTile } from '../components/SquareTile'
import type { Offer } from '../data/mockOffers'
import { MOCK_YOUR_OFFERS } from '../data/mockOffers'
import { useFittingRows } from '../hooks/useFittingRows'
import { ROUTES, adDetail } from '../routes'
import { useSettings } from '../settings/useSettings'
import './OffersPage.css'

/** One slot of the Offers grid: either the add-more prompt or one of your actual offers. A
 *  discriminated union rather than a sentinel `Offer` keeps the prompt distinct from real data
 *  instead of a fake id string that could collide with one. */
type OfferSlot = { kind: 'add' } | { kind: 'offer'; offer: Offer }

function slotKey(slot: OfferSlot): string {
  return slot.kind === 'add' ? 'add-prompt' : slot.offer.id
}

/** Same substring-on-title match Inventory's own search bar uses (TODO #9) — simple by design,
 *  nothing fancier asked for here. */
function matchesQuery(offer: Offer, query: string): boolean {
  return offer.title.toLowerCase().includes(query.trim().toLowerCase())
}

/** Offers page (Appkarte §4, reworked by TODO #16): your own listings, skill and item offers
 *  mixed into one grid instead of split into a skill section and an item section — TODO #16's
 *  "remove the one of the skill offers section" / "make the item offers fill up the screen, mix
 *  it with skill offers" — so `MOCK_YOUR_OFFERS` is handed over exactly as it already comes
 *  (mixed kinds, no filtering by `OfferKind`), and the old "Item offers" heading is gone with it.
 *
 *  Reuses the fill-the-page-then-page-the-rest machinery Home/Inventory already use
 *  (`useFittingRows` + `PagedGrid`, TODO #3/#9) instead of the fixed N×2-per-section grid this
 *  page used to hand-roll: columns come from the grid-size setting, rows from whatever height is
 *  actually left under the header, and a short last page still pads out with visibly empty
 *  slots for free — TODO #16's "if the page is not full still show the empty grid spaces".
 *  Paging itself ("keep the paging") is still PagedGrid's own pager, just its 'floating-dots'
 *  variant: small dots pinned to the bottom of the viewport instead of a "← Page N of M →" row
 *  after the grid, per direct feedback. Since that pager no longer sits in-flow after the grid,
 *  `useFittingRows` is told there's no in-flow pager row to leave room for (`reserveBottomPx={0}`,
 *  the same argument Home's GridSection passes for the same reason) — the dots instead land in
 *  the bottom padding every page already reserves for the floating nav bar (PageShell.css), which
 *  is otherwise empty whenever the nav bar itself is collapsed to its corner button.
 *
 *  The add-more prompt moved from "the last free box on the last page" to "the grid's very first
 *  slot, always on page 1" (TODO #16: "put the add offer option into the first square of the
 *  grid") — done by making it entry 0 of the sequence handed to PagedGrid, rather than something
 *  bolted on after real offers run out.
 *
 *  A plain text search sits above the grid, narrowing which offers fill it — the add-more prompt
 *  stays put through a search rather than being just another thing that can match or not, since
 *  it isn't one of your offers to begin with. */
export function OffersPage() {
  const navigate = useNavigate()
  const { gridSize } = useSettings()
  const { containerRef, rows } = useFittingRows(gridSize, gridSize, 0)
  const [query, setQuery] = useState('')

  const openAdDetail = (offer: Offer) => navigate(adDetail(offer.id))
  const openAdCreate = () => navigate(ROUTES.adCreate)

  const matches = MOCK_YOUR_OFFERS.filter((offer) => matchesQuery(offer, query))
  const slots: OfferSlot[] = [{ kind: 'add' }, ...matches.map((offer) => ({ kind: 'offer' as const, offer }))]

  return (
    <PageShell title="Your offers">
      <div className="offers-page">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search your offers"
          ariaLabel="Search your offers"
        />

        {query.trim() !== '' && matches.length === 0 && <p className="page-note">No offers match your search.</p>}

        <div className="offers-page__grid-area" ref={containerRef}>
          <PagedGrid
            items={slots}
            getKey={slotKey}
            columns={gridSize}
            rows={rows}
            gridLabel="Your offers"
            pagerVariant="floating-dots"
            renderTile={(slot) =>
              slot.kind === 'add' ? (
                <SquareTile label="Add a new offer" onClick={openAdCreate}>
                  <span className="offers-page__tile offers-page__tile--add">
                    <span className="offers-page__tile-icon" aria-hidden="true">
                      +
                    </span>
                    <span className="offers-page__tile-title">Add a new offer</span>
                  </span>
                </SquareTile>
              ) : (
                <SquareTile
                  label={`${slot.offer.title}, ${slot.offer.hours} hours`}
                  onClick={() => openAdDetail(slot.offer)}
                >
                  <span className="offers-page__tile">
                    <span className="offers-page__tile-icon" aria-hidden="true">
                      {slot.offer.icon}
                    </span>
                    <span className="offers-page__tile-title">{slot.offer.title}</span>
                    <span className="offers-page__tile-hours">{slot.offer.hours} h</span>
                  </span>
                </SquareTile>
              )
            }
          />
        </div>
      </div>
    </PageShell>
  )
}
