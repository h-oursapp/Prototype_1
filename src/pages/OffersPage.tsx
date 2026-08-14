import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { SquareTile } from '../components/SquareTile'
import type { Offer, OfferKind } from '../data/mockOffers'
import { MOCK_YOUR_OFFERS } from '../data/mockOffers'
import { ROUTES, adDetail } from '../routes'
import type { GridSize } from '../settings/types'
import { useSettings } from '../settings/useSettings'
import './OffersPage.css'

/** §4 assumes a section holds 6 boxes. Two rows times the Settings grid density (default 3 per
 *  row) reproduces that exactly at the default, and keeps the page honoring the user's density
 *  setting at every other value. §10 still lists the exact grid tuning as open. */
const ROWS_PER_PAGE = 2

function offersOfKind(kind: OfferKind): Offer[] {
  return MOCK_YOUR_OFFERS.filter((offer) => offer.kind === kind)
}

interface OfferSectionProps {
  heading: string
  offers: Offer[]
  /** Label of the box that prompts you to add more — also its accessible name. */
  addPromptLabel: string
  columns: GridSize
  onSelectOffer: (offer: Offer) => void
  onAddMore: () => void
}

/** One page-flipped section of the Offers page (skill offers or item offers).
 *
 *  Each section owns its own page index, so flipping one doesn't move the other.
 *
 *  §4's "with fewer than 6 entries, one grid box becomes a prompt to add more" is implemented by
 *  treating that prompt as the last entry of the section's sequence: it drops into the first free
 *  box on the last page, and gets a page of its own if the offers happen to fill every page
 *  exactly — so the prompt is always reachable rather than disappearing once you have enough
 *  offers. With fewer entries than one page holds, that is exactly what the card describes. */
function OfferSection({ heading, offers, addPromptLabel, columns, onSelectOffer, onAddMore }: OfferSectionProps) {
  const [requestedPage, setRequestedPage] = useState(0)

  const pageSize = columns * ROWS_PER_PAGE
  // The +1 is the add-more prompt, which occupies a box like any offer does.
  const pageCount = Math.ceil((offers.length + 1) / pageSize)
  // Clamped rather than stored back, so changing the grid density in Settings can't strand the
  // section on a page that no longer exists.
  const pageIndex = Math.min(requestedPage, pageCount - 1)
  const firstOnPage = pageIndex * pageSize
  const pageOffers = offers.slice(firstOnPage, firstOnPage + pageSize)
  // A free box on this page means the prompt's slot in the sequence falls here.
  const showsAddPrompt = pageOffers.length < pageSize

  return (
    <section className="page-section offers-page__section">
      <h2 className="page-section__heading">{heading}</h2>

      <ul className="offers-page__grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {pageOffers.map((offer) => (
          <li key={offer.id} className="offers-page__cell">
            <SquareTile label={`${offer.title}, ${offer.hours} hours`} onClick={() => onSelectOffer(offer)}>
              <span className="offers-page__tile">
                <span className="offers-page__tile-icon" aria-hidden="true">
                  {offer.icon}
                </span>
                <span className="offers-page__tile-title">{offer.title}</span>
                <span className="offers-page__tile-hours">{offer.hours} h</span>
              </span>
            </SquareTile>
          </li>
        ))}

        {showsAddPrompt && (
          <li className="offers-page__cell">
            <SquareTile label={addPromptLabel} onClick={onAddMore}>
              <span className="offers-page__tile offers-page__tile--add">
                <span className="offers-page__tile-icon" aria-hidden="true">
                  +
                </span>
                <span className="offers-page__tile-title">{addPromptLabel}</span>
              </span>
            </SquareTile>
          </li>
        )}
      </ul>

      <div className="offers-page__pager">
        <button
          type="button"
          className="offers-page__flip"
          onClick={() => setRequestedPage(pageIndex - 1)}
          disabled={pageIndex === 0}
          aria-label={`Previous page of ${heading.toLowerCase()}`}
        >
          <span aria-hidden="true">←</span>
        </button>

        <p className="offers-page__page-indicator" aria-live="polite">
          Page {pageIndex + 1} of {pageCount}
        </p>

        <button
          type="button"
          className="offers-page__flip"
          onClick={() => setRequestedPage(pageIndex + 1)}
          disabled={pageIndex === pageCount - 1}
          aria-label={`Next page of ${heading.toLowerCase()}`}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

/** Offers page (Appkarte §4): your own listings, split into skill offers and item offers, each
 *  section flipped a page at a time rather than scrolled continuously.
 *
 *  Home's GridSection is deliberately not reused here: it is Home's fixed N×N section with a
 *  corner arrow that opens *this* page, and it caps itself at one screenful. This page needs
 *  paged N×2 grids and an extra prompt box, so it composes SquareTile — the shared box — itself.
 *
 *  Page-flipping is real local state (see OfferSection); only the pictures are stand-ins, since
 *  the mock offers carry an emoji rather than an uploaded photo. */
export function OffersPage() {
  const navigate = useNavigate()
  const { gridSize } = useSettings()

  const openAdDetail = (offer: Offer) => navigate(adDetail(offer.id))
  const openAdCreate = () => navigate(ROUTES.adCreate)

  return (
    <PageShell title="Your offers">
      <div className="offers-page">
        <OfferSection
          heading="Skill offers"
          offers={offersOfKind('skill')}
          addPromptLabel="Add more skill offers"
          columns={gridSize}
          onSelectOffer={openAdDetail}
          onAddMore={openAdCreate}
        />
        <OfferSection
          heading="Item offers"
          offers={offersOfKind('item')}
          addPromptLabel="Add more item offers"
          columns={gridSize}
          onSelectOffer={openAdDetail}
          onAddMore={openAdCreate}
        />

        <p className="page-note">
          A page holds {gridSize * ROWS_PER_PAGE} boxes, following the grid density in Settings.
          §10 lists the exact grid tuning as still open, so this is not a final number.
        </p>
      </div>
    </PageShell>
  )
}
