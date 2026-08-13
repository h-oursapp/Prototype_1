import { createContext } from 'react'
import type { AppSettings, ColorTheme, GridSize } from './types'

export interface SettingsContextValue extends AppSettings {
  setColorTheme: (theme: ColorTheme) => void
  setGridSize: (size: GridSize) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
