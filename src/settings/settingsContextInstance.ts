import { createContext } from 'react'
import type { SearchFilters } from '../data/searchFilters'
import type { AppSettings, ColorTheme, GridSize } from './types'

export interface SettingsContextValue extends AppSettings {
  setColorTheme: (theme: ColorTheme) => void
  setGridSize: (size: GridSize) => void
  /** Patches, not replaces — a caller changing just the kind filter shouldn't have to know or
   *  repeat the other two's current values. */
  setDefaultSearchFilters: (patch: Partial<SearchFilters>) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
