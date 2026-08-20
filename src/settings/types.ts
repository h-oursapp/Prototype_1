import type { SearchFilters } from '../data/searchFilters'

export type ColorTheme = 'light' | 'dark'

export type GridSize = 1 | 2 | 3 | 4

export interface AppSettings {
  colorTheme: ColorTheme
  gridSize: GridSize
  /** Search's starting filters (TODO #3) — configurable here so a search you start from Home's
   *  quick search bar opens already narrowed the way you like, instead of always "show
   *  everything". */
  defaultSearchFilters: SearchFilters
  /** TODO #9: "make a version of the page that is scrollable" — Inventory defaults to today's
   *  fixed-page, pager-driven grid (false); switching this on trades the pager for a normal
   *  growing/scrolling grid instead, the same shape Skills already uses. */
  inventoryScrollable: boolean
}

export const DEFAULT_GRID_SIZE: GridSize = 3

export const GRID_SIZE_OPTIONS: GridSize[] = [1, 2, 3, 4]

export const DEFAULT_INVENTORY_SCROLLABLE = false
