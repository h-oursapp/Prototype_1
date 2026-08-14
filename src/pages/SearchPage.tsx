import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { SquareTile } from '../components/SquareTile'
import type { Offer } from '../data/mockOffers'
import { MOCK_ADS } from '../data/mockOffers'
import { adDetail } from '../routes'
import { useSettings } from '../settings/useSettings'
import './SearchPage.css'

/** §4: one page, two toggleable views. The map view is the default because the card lists it
 *  first and it is the one that answers "what is near me". */
type SearchView = 'map' | 'text'

type KindFilter = 'all' | 'skill' | 'item'

const VIEW_OPTIONS: { value: SearchView; label: string }[] = [
  { value: 'map', label: 'Map' },
  { value: 'text', label: 'Text search' },
]

const KIND_FILTER_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'skill', label: 'Skills' },
  { value: 'item', label: 'Items' },
]

/** Title-only matching: the mock descriptions would make hits look arbitrary at prototype size,
 *  and the card doesn't say what the search covers. */
function matchesQuery(offer: Offer, query: string): boolean {
  return offer.title.toLowerCase().includes(query.trim().toLowerCase())
}

function matchesKind(offer: Offer, kindFilter: KindFilter): boolean {
  return kindFilter === 'all' || offer.kind === kindFilter
}

function findMatches(query: string, kindFilter: KindFilter): Offer[] {
  return MOCK_ADS.filter((offer) => matchesKind(offer, kindFilter) && matchesQuery(offer, query))
}

/** Offers with no distance sort to the end rather than to the front. */
function byDistance(a: Offer, b: Offer): number {
  return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
}

function distanceLabel(offer: Offer): string {
  return offer.distanceKm === undefined ? 'Distance unknown' : `${offer.distanceKm} km away`
}

interface NearbyListProps {
  offers: Offer[]
  onSelectOffer: (offer: Offer) => void
}

/** The half of the map view that is real: the same filtered hits, nearest first. */
function NearbyList({ offers, onSelectOffer }: NearbyListProps) {
  return (
    <ul className="search-page__nearby-list">
      {offers.map((offer) => (
        <li key={offer.id}>
          <button type="button" className="search-page__hit" onClick={() => onSelectOffer(offer)}>
            <span className="search-page__hit-title">
              <span aria-hidden="true">{offer.icon}</span> {offer.title}
            </span>
            <span className="search-page__hit-meta">
              {offer.hours} h · {distanceLabel(offer)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Stands in for the map itself. A real map needs a tile provider and a location source, both out
 *  of scope for the prototype, so this occupies the space §4 gives the map and says plainly that
 *  it is not wired up rather than quietly rendering nothing. */
function MapPlaceholder() {
  return (
    <div className="search-page__map">
      <p className="search-page__map-badge">Map — not wired up</p>
      <p className="page-note">
        §4 puts a map on about half the screen. Map tiles and the location source (device location
        or the user&apos;s address) are out of scope for the prototype; the hits beside this panel
        are real and sorted by distance.
      </p>
    </div>
  )
}

interface ResultsGridProps {
  offers: Offer[]
  columns: number
  onSelectOffer: (offer: Offer) => void
}

/** The text-search view's results, in the same square boxes the rest of the app uses. */
function ResultsGrid({ offers, columns, onSelectOffer }: ResultsGridProps) {
  return (
    <ul className="search-page__results" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {offers.map((offer) => (
        <li key={offer.id} className="search-page__result">
          <SquareTile label={`${offer.title}, ${offer.hours} hours`} onClick={() => onSelectOffer(offer)}>
            <span className="search-page__result-tile">
              <span className="search-page__result-icon" aria-hidden="true">
                {offer.icon}
              </span>
              <span className="search-page__result-title">{offer.title}</span>
              <span className="search-page__result-meta">{distanceLabel(offer)}</span>
            </span>
          </SquareTile>
        </li>
      ))}
    </ul>
  )
}

/** Search page (Appkarte §4): one page with a shared search bar and filter row, and two
 *  toggleable views underneath — a map beside a list of nearby hits, or a results grid.
 *
 *  Search text and the kind filter live above the view toggle, so switching views keeps whatever
 *  you searched for — that shared state is what makes it one page rather than two.
 *
 *  Everything except the map panel is real: the query and the filter narrow MOCK_ADS, and the
 *  nearby list is sorted by the mocked distances. */
export function SearchPage() {
  const navigate = useNavigate()
  const { gridSize } = useSettings()
  const [view, setView] = useState<SearchView>('map')
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')

  const matches = findMatches(query, kindFilter)
  const openAdDetail = (offer: Offer) => navigate(adDetail(offer.id))

  return (
    <PageShell title="Search">
      <div className="search-page">
        <div className="search-page__controls">
          <label className="search-page__search" htmlFor="search-page-query">
            Search
            <input
              id="search-page-query"
              className="search-page__field"
              type="search"
              value={query}
              placeholder="Skills, items, anything"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <OptionGroup legend="Show" options={KIND_FILTER_OPTIONS} selected={kindFilter} onSelect={setKindFilter} />
          <OptionGroup legend="View" options={VIEW_OPTIONS} selected={view} onSelect={setView} />

          <p className="search-page__count">
            {matches.length} {matches.length === 1 ? 'result' : 'results'}
          </p>
        </div>

        {matches.length === 0 && <p className="page-note">No offers match this search.</p>}

        {view === 'map' ? (
          <div className="search-page__map-view">
            <div className="search-page__nearby">
              <h2 className="page-section__heading">Nearby</h2>
              <NearbyList offers={[...matches].sort(byDistance)} onSelectOffer={openAdDetail} />
            </div>
            <MapPlaceholder />
          </div>
        ) : (
          <ResultsGrid offers={matches} columns={gridSize} onSelectOffer={openAdDetail} />
        )}
      </div>
    </PageShell>
  )
}
