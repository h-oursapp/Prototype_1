import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { SquareTile } from '../components/SquareTile'
import { StarRatingInput } from '../components/StarRatingInput'
import type { Offer } from '../data/mockOffers'
import { MOCK_ADS } from '../data/mockOffers'
import { adDetail } from '../routes'
import { useSettings } from '../settings/useSettings'
import './SearchPage.css'

/** §4: one page, two toggleable views — a map with the results grid underneath it (TODO #13.1),
 *  or the grid on its own. The view changer lives in the page header, opposite the title, so the
 *  search bar and filters above the results can stay small (TODO #13). */
type SearchView = 'map' | 'text'

type KindFilter = 'all' | 'skill' | 'item'

const KIND_FILTER_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'skill', label: 'Skills' },
  { value: 'item', label: 'Items' },
]

/** Upper bound of the range slider, in km. MOCK_ADS' farthest entry sits just inside this, so
 *  dragging to the end always means "no distance filter" rather than accidentally hiding
 *  something. */
const MAX_DISTANCE_KM = 10

const MAX_RATING = 5

/** Title-only matching: the mock descriptions would make hits look arbitrary at prototype size,
 *  and the card doesn't say what the search covers. */
function matchesQuery(offer: Offer, query: string): boolean {
  return offer.title.toLowerCase().includes(query.trim().toLowerCase())
}

function matchesKind(offer: Offer, kindFilter: KindFilter): boolean {
  return kindFilter === 'all' || offer.kind === kindFilter
}

/** An offer with no known distance passes regardless of the slider — the filter is about hiding
 *  things confirmed to be far, not punishing missing mock data. */
function matchesDistance(offer: Offer, maxDistanceKm: number): boolean {
  return maxDistanceKm >= MAX_DISTANCE_KM || offer.distanceKm === undefined || offer.distanceKm <= maxDistanceKm
}

function matchesMinRating(offer: Offer, minRating: number): boolean {
  return offer.rating >= minRating
}

function findMatches(query: string, kindFilter: KindFilter, maxDistanceKm: number, minRating: number): Offer[] {
  return MOCK_ADS.filter(
    (offer) =>
      matchesKind(offer, kindFilter) &&
      matchesQuery(offer, query) &&
      matchesDistance(offer, maxDistanceKm) &&
      matchesMinRating(offer, minRating),
  )
}

/** Offers with no distance sort to the end rather than to the front. */
function byDistance(a: Offer, b: Offer): number {
  return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
}

function distanceLabel(offer: Offer): string {
  return offer.distanceKm === undefined ? 'Distance unknown' : `${offer.distanceKm} km away`
}

/** "5★" — the compact badge TODO #13 wants in a tile's corner instead of a full star row, which
 *  has no room to spare at grid size. Works the same for a skill or an item offer, since both
 *  carry the one overall `rating` field. */
function ratingBadgeLabel(offer: Offer): string {
  return `${offer.rating}★`
}

function kindFilterLabel(kindFilter: KindFilter): string {
  return KIND_FILTER_OPTIONS.find((option) => option.value === kindFilter)?.label ?? 'All'
}

function distanceFilterLabel(maxDistanceKm: number): string {
  return maxDistanceKm >= MAX_DISTANCE_KM ? 'Any distance' : `Within ${maxDistanceKm} km`
}

function ratingFilterLabel(minRating: number): string {
  return minRating === 0 ? 'Any rating' : `Min ${minRating}★`
}

/** Stands in for the map itself. A real map needs a tile provider and a location source, both out
 *  of scope for the prototype, so this occupies the space §4 gives the map and says plainly that
 *  it is not wired up rather than quietly rendering nothing. */
function MapPlaceholder() {
  return (
    <div className="search-page__map">
      <p className="search-page__map-badge">Map — not wired up</p>
      <p className="page-note">
        Map tiles and the location source (device location or the user&apos;s address) are out of
        scope for the prototype; the results below are real and sorted by distance.
      </p>
    </div>
  )
}

interface ResultsGridProps {
  offers: Offer[]
  columns: number
  onSelectOffer: (offer: Offer) => void
}

/** The results grid, shared by both views (TODO #13.1) — the same square boxes the rest of the
 *  app uses, sized by the grid-size setting like Home and Inventory. */
function ResultsGrid({ offers, columns, onSelectOffer }: ResultsGridProps) {
  return (
    <ul className="search-page__results" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {offers.map((offer) => (
        <li key={offer.id} className="search-page__result">
          <SquareTile
            label={`${offer.title}, ${offer.hours} hours, rated ${offer.rating} out of ${MAX_RATING}`}
            onClick={() => onSelectOffer(offer)}
          >
            <span className="search-page__result-tile">
              <span className="search-page__result-icon" aria-hidden="true">
                {offer.icon}
              </span>
              <span className="search-page__result-title">{offer.title}</span>
              <span className="search-page__result-meta">{distanceLabel(offer)}</span>
            </span>
            <span className="search-page__result-rating" aria-hidden="true">
              {ratingBadgeLabel(offer)}
            </span>
          </SquareTile>
        </li>
      ))}
    </ul>
  )
}

/** Which filter's floating panel is open, if any — one at a time, so opening a second closes the
 *  first rather than stacking panels on top of each other. */
type OpenFilter = 'kind' | 'distance' | 'rating' | null

interface FilterBarProps {
  kindFilter: KindFilter
  onKindFilterChange: (kindFilter: KindFilter) => void
  maxDistanceKm: number
  onMaxDistanceKmChange: (maxDistanceKm: number) => void
  minRating: number
  onMinRatingChange: (minRating: number) => void
}

/** TODO #13's filter row: three small buttons, each naming its own current value, that fit on one
 *  line — the actual controls live in a floating panel underneath whichever button is tapped,
 *  instead of always taking up space themselves.
 *
 *  The kind panel closes itself the moment a choice is made — with only three mutually exclusive
 *  options, picking one already means "done". Distance and rating are adjusted rather than picked
 *  in one tap, so those two panels wait for an explicit "Done" instead of guessing when a drag has
 *  finished. */
function FilterBar({
  kindFilter,
  onKindFilterChange,
  maxDistanceKm,
  onMaxDistanceKmChange,
  minRating,
  onMinRatingChange,
}: FilterBarProps) {
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null)
  const toggleFilter = (filter: OpenFilter) => setOpenFilter((current) => (current === filter ? null : filter))
  const closeFilter = () => setOpenFilter(null)

  return (
    <div className="search-page__filters">
      <button
        type="button"
        className={`search-page__filter-trigger ${kindFilter !== 'all' ? 'is-active' : ''}`}
        aria-haspopup="true"
        aria-expanded={openFilter === 'kind'}
        onClick={() => toggleFilter('kind')}
      >
        {kindFilterLabel(kindFilter)}
        <span aria-hidden="true"> ▾</span>
      </button>
      <button
        type="button"
        className={`search-page__filter-trigger ${maxDistanceKm < MAX_DISTANCE_KM ? 'is-active' : ''}`}
        aria-haspopup="true"
        aria-expanded={openFilter === 'distance'}
        onClick={() => toggleFilter('distance')}
      >
        {distanceFilterLabel(maxDistanceKm)}
        <span aria-hidden="true"> ▾</span>
      </button>
      <button
        type="button"
        className={`search-page__filter-trigger ${minRating > 0 ? 'is-active' : ''}`}
        aria-haspopup="true"
        aria-expanded={openFilter === 'rating'}
        onClick={() => toggleFilter('rating')}
      >
        {ratingFilterLabel(minRating)}
        <span aria-hidden="true"> ▾</span>
      </button>

      {openFilter === 'kind' && (
        <div className="search-page__filter-panel">
          <OptionGroup
            legend="Show"
            options={KIND_FILTER_OPTIONS}
            selected={kindFilter}
            onSelect={(value) => {
              onKindFilterChange(value)
              closeFilter()
            }}
          />
        </div>
      )}

      {openFilter === 'distance' && (
        <div className="search-page__filter-panel">
          <label className="search-page__filter-control">
            <span>{distanceFilterLabel(maxDistanceKm)}</span>
            <input
              type="range"
              min={1}
              max={MAX_DISTANCE_KM}
              step={1}
              value={maxDistanceKm}
              onChange={(event) => onMaxDistanceKmChange(Number(event.target.value))}
            />
          </label>
          <button type="button" className="search-page__filter-done" onClick={closeFilter}>
            Done
          </button>
        </div>
      )}

      {openFilter === 'rating' && (
        <div className="search-page__filter-panel">
          <StarRatingInput label="Minimum rating" name="min-rating-filter" value={minRating} onChange={onMinRatingChange} />
          <button type="button" className="search-page__filter-done" onClick={closeFilter}>
            Done
          </button>
        </div>
      )}
    </div>
  )
}

interface ViewToggleProps {
  view: SearchView
  onSelect: (view: SearchView) => void
}

/** The view changer, moved into the page header (TODO #13) so it sits in the top-right corner
 *  instead of taking a row of its own above the results. Two icon buttons rather than
 *  OptionGroup's labelled ones — there's only header-bar height to work with here. */
function ViewToggle({ view, onSelect }: ViewToggleProps) {
  return (
    <div className="search-page__view-toggle" role="group" aria-label="View">
      <button
        type="button"
        className={`page-shell__action page-shell__action--icon ${view === 'map' ? 'is-active' : ''}`}
        aria-pressed={view === 'map'}
        aria-label="Map"
        onClick={() => onSelect('map')}
      >
        <span aria-hidden="true">🗺️</span>
      </button>
      <button
        type="button"
        className={`page-shell__action page-shell__action--icon ${view === 'text' ? 'is-active' : ''}`}
        aria-pressed={view === 'text'}
        aria-label="Text search"
        onClick={() => onSelect('text')}
      >
        <span aria-hidden="true">📋</span>
      </button>
    </div>
  )
}

/** Search page (Appkarte §4): a shared search bar and a one-row filter bar (TODO #13 — see
 *  FilterBar), then either the map with the results grid underneath, or the grid on its own.
 *
 *  Search text and the filters live above the view toggle, so switching views keeps whatever you
 *  searched for — that shared state is what makes it one page rather than two.
 *
 *  Everything except the map panel is real: the query and the filters narrow MOCK_ADS, and the
 *  map view's grid is sorted by the mocked distances, nearest first.
 *
 *  There's no fixed-height container anywhere in here, so the page just grows with the result
 *  count and PageShell's content area (already `overflow-y: auto`) scrolls it — TODO #13's "the
 *  site is scrollable when there is enough items found" falls out of that for free. */
export function SearchPage() {
  const navigate = useNavigate()
  const { gridSize } = useSettings()
  const [view, setView] = useState<SearchView>('map')
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [maxDistanceKm, setMaxDistanceKm] = useState(MAX_DISTANCE_KM)
  const [minRating, setMinRating] = useState(0)

  const matches = findMatches(query, kindFilter, maxDistanceKm, minRating)
  const gridOffers = view === 'map' ? [...matches].sort(byDistance) : matches
  const openAdDetail = (offer: Offer) => navigate(adDetail(offer.id))

  return (
    <PageShell title="Search" headerAction={<ViewToggle view={view} onSelect={setView} />}>
      <div className="search-page">
        <form className="search-page__search-bar" role="search" onSubmit={(event) => event.preventDefault()}>
          <input
            className="search-page__field"
            type="search"
            aria-label="Search"
            value={query}
            placeholder="Skills, items, anything"
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="search-page__search-submit" aria-label="Submit search">
            <span aria-hidden="true">🔍</span>
          </button>
        </form>

        <FilterBar
          kindFilter={kindFilter}
          onKindFilterChange={setKindFilter}
          maxDistanceKm={maxDistanceKm}
          onMaxDistanceKmChange={setMaxDistanceKm}
          minRating={minRating}
          onMinRatingChange={setMinRating}
        />

        <p className="search-page__count">
          {matches.length} {matches.length === 1 ? 'result' : 'results'}
        </p>

        {matches.length === 0 && <p className="page-note">No offers match this search.</p>}

        {view === 'map' && <MapPlaceholder />}
        <ResultsGrid offers={gridOffers} columns={gridSize} onSelectOffer={openAdDetail} />
      </div>
    </PageShell>
  )
}
