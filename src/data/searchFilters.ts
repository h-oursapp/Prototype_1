import { MAX_STARS } from '../components/StarRating'

/** Appkarte §4: narrows Search's results to skills, items, or everything. */
export type KindFilter = 'all' | 'skill' | 'item'

export const KIND_FILTER_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'skill', label: 'Skills' },
  { value: 'item', label: 'Items' },
]

/** Upper bound of Search's distance slider, in km. MOCK_ADS' farthest entry sits just inside
 *  this, so dragging to the end always means "no distance filter" rather than accidentally hiding
 *  something. */
export const MAX_DISTANCE_KM = 10

/** The three filters Search's FilterBar exposes (TODO #13), bundled as one value so they can be
 *  set and carried around together — Search's own starting point, and (TODO #3) Settings'
 *  configurable default for it. */
export interface SearchFilters {
  kindFilter: KindFilter
  maxDistanceKm: number
  minRating: number
}

/** "Show everything, any distance, any rating" — Search's filters before Settings' default-filter
 *  picker (TODO #3) has ever been touched. */
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  kindFilter: 'all',
  maxDistanceKm: MAX_DISTANCE_KM,
  minRating: 0,
}

function isKindFilter(value: unknown): value is KindFilter {
  return value === 'all' || value === 'skill' || value === 'item'
}

/** Guards a value read back out of localStorage — the same job settingsStorage's own
 *  isColorTheme/isGridSize do for the settings around this one. A number outside a slider or
 *  star-picker's real range is as untrustworthy as the wrong type, so both are checked here. */
export function isSearchFilters(value: unknown): value is SearchFilters {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<SearchFilters>
  return (
    isKindFilter(candidate.kindFilter) &&
    typeof candidate.maxDistanceKm === 'number' &&
    candidate.maxDistanceKm > 0 &&
    candidate.maxDistanceKm <= MAX_DISTANCE_KM &&
    typeof candidate.minRating === 'number' &&
    candidate.minRating >= 0 &&
    candidate.minRating <= MAX_STARS
  )
}

export function kindFilterLabel(kindFilter: KindFilter): string {
  return KIND_FILTER_OPTIONS.find((option) => option.value === kindFilter)?.label ?? 'All'
}

export function distanceFilterLabel(maxDistanceKm: number): string {
  return maxDistanceKm >= MAX_DISTANCE_KM ? 'Any distance' : `Within ${maxDistanceKm} km`
}

export function ratingFilterLabel(minRating: number): string {
  return minRating === 0 ? 'Any rating' : `Min ${minRating}★`
}
