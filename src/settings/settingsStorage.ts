import { DEFAULT_SEARCH_FILTERS, isSearchFilters } from '../data/searchFilters'
import {
  DEFAULT_GRID_SIZE,
  DEFAULT_INVENTORY_SCROLLABLE,
  GRID_SIZE_OPTIONS,
  type AppSettings,
  type ColorTheme,
  type GridSize,
} from './types'

const STORAGE_KEY = 'h-ours:settings'

function isColorTheme(value: unknown): value is ColorTheme {
  return value === 'light' || value === 'dark'
}

function isGridSize(value: unknown): value is GridSize {
  return GRID_SIZE_OPTIONS.includes(value as GridSize)
}

/** System/browser color-scheme preference, used as the default before the user picks one. */
export function getSystemColorTheme(): ColorTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Reads persisted app settings from localStorage. Returns null if nothing valid is stored. */
export function loadSettings(): AppSettings | null {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    if (!isColorTheme(parsed.colorTheme) || !isGridSize(parsed.gridSize)) return null
    return {
      colorTheme: parsed.colorTheme,
      gridSize: parsed.gridSize,
      // Falls back on its own rather than invalidating the whole blob (unlike the two fields
      // above): this field didn't exist before TODO #3, so anyone's already-saved settings won't
      // have it, and that shouldn't cost them their theme and grid size too.
      defaultSearchFilters: isSearchFilters(parsed.defaultSearchFilters)
        ? parsed.defaultSearchFilters
        : DEFAULT_SEARCH_FILTERS,
      // Same reasoning, same pattern — didn't exist before TODO #9 either.
      inventoryScrollable:
        typeof parsed.inventoryScrollable === 'boolean' ? parsed.inventoryScrollable : DEFAULT_INVENTORY_SCROLLABLE,
    }
  } catch {
    return null
  }
}

/** Persists app settings to localStorage. Silently no-ops if storage is unavailable (e.g. private mode). */
export function saveSettings(settings: AppSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be unavailable (quota, private browsing); settings simply won't persist.
  }
}

export function loadSettingsOrDefault(): AppSettings {
  return (
    loadSettings() ?? {
      colorTheme: getSystemColorTheme(),
      gridSize: DEFAULT_GRID_SIZE,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: DEFAULT_INVENTORY_SCROLLABLE,
    }
  )
}
