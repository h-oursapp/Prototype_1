import { useEffect, useState, type ReactNode } from 'react'
import type { SearchFilters } from '../data/searchFilters'
import { SettingsContext } from './settingsContextInstance'
import { loadSettingsOrDefault, saveSettings } from './settingsStorage'
import type { AppSettings, ColorTheme, GridSize } from './types'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettingsOrDefault())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.colorTheme)
    saveSettings(settings)
  }, [settings])

  const setColorTheme = (colorTheme: ColorTheme) => setSettings((prev) => ({ ...prev, colorTheme }))
  const setGridSize = (gridSize: GridSize) => setSettings((prev) => ({ ...prev, gridSize }))
  const setDefaultSearchFilters = (patch: Partial<SearchFilters>) =>
    setSettings((prev) => ({ ...prev, defaultSearchFilters: { ...prev.defaultSearchFilters, ...patch } }))

  return (
    <SettingsContext.Provider value={{ ...settings, setColorTheme, setGridSize, setDefaultSearchFilters }}>
      {children}
    </SettingsContext.Provider>
  )
}
