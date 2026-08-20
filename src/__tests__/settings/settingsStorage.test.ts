import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SEARCH_FILTERS } from '../../data/searchFilters'
import { getSystemColorTheme, loadSettings, loadSettingsOrDefault, saveSettings } from '../../settings/settingsStorage'

function mockMatchMedia(prefersDark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' && prefersDark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('loadSettings', () => {
  it('returns null when nothing is stored', () => {
    expect(loadSettings()).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    window.localStorage.setItem('h-ours:settings', '{not json')
    expect(loadSettings()).toBeNull()
  })

  it('returns null when fields fail validation', () => {
    window.localStorage.setItem('h-ours:settings', JSON.stringify({ colorTheme: 'blue', gridSize: 3 }))
    expect(loadSettings()).toBeNull()
    window.localStorage.setItem('h-ours:settings', JSON.stringify({ colorTheme: 'dark', gridSize: 7 }))
    expect(loadSettings()).toBeNull()
  })

  it('round-trips valid settings saved via saveSettings', () => {
    saveSettings({
      colorTheme: 'dark',
      gridSize: 4,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: true,
    })
    expect(loadSettings()).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: true,
    })
  })

  it('falls back to the default search filters alone when that field is missing, rather than the whole blob (TODO #3)', () => {
    // Predates TODO #3: settings saved before this field existed won't have it at all.
    window.localStorage.setItem('h-ours:settings', JSON.stringify({ colorTheme: 'dark', gridSize: 4 }))
    expect(loadSettings()).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: false,
    })
  })

  it('falls back to the default search filters alone when that field is invalid', () => {
    window.localStorage.setItem(
      'h-ours:settings',
      JSON.stringify({ colorTheme: 'dark', gridSize: 4, defaultSearchFilters: { kindFilter: 'blue' } }),
    )
    expect(loadSettings()).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: false,
    })
  })

  it('keeps a stored, valid default search filter as-is', () => {
    const customFilters = { kindFilter: 'skill' as const, maxDistanceKm: 5, minRating: 3 }
    window.localStorage.setItem(
      'h-ours:settings',
      JSON.stringify({ colorTheme: 'dark', gridSize: 4, defaultSearchFilters: customFilters }),
    )
    expect(loadSettings()).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
      defaultSearchFilters: customFilters,
      inventoryScrollable: false,
    })
  })

  it('falls back to inventoryScrollable=false when that field is missing (TODO #9)', () => {
    // Predates TODO #9: settings saved before this field existed won't have it at all.
    window.localStorage.setItem(
      'h-ours:settings',
      JSON.stringify({ colorTheme: 'dark', gridSize: 4, defaultSearchFilters: DEFAULT_SEARCH_FILTERS }),
    )
    expect(loadSettings()).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: false,
    })
  })

  it('falls back to inventoryScrollable=false when that field is invalid', () => {
    window.localStorage.setItem(
      'h-ours:settings',
      JSON.stringify({
        colorTheme: 'dark',
        gridSize: 4,
        defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
        inventoryScrollable: 'yes',
      }),
    )
    expect(loadSettings()).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: false,
    })
  })

  it('keeps a stored, valid inventoryScrollable as-is', () => {
    window.localStorage.setItem(
      'h-ours:settings',
      JSON.stringify({
        colorTheme: 'dark',
        gridSize: 4,
        defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
        inventoryScrollable: true,
      }),
    )
    expect(loadSettings()).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: true,
    })
  })
})

describe('loadSettingsOrDefault', () => {
  it('falls back to the system color theme and default grid size when nothing is stored', () => {
    mockMatchMedia(true)
    expect(loadSettingsOrDefault()).toEqual({
      colorTheme: 'dark',
      gridSize: 3,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: false,
    })
  })

  it('prefers stored settings over the system default', () => {
    mockMatchMedia(true)
    saveSettings({
      colorTheme: 'light',
      gridSize: 2,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: true,
    })
    expect(loadSettingsOrDefault()).toEqual({
      colorTheme: 'light',
      gridSize: 2,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: true,
    })
  })
})

describe('getSystemColorTheme', () => {
  it('reflects the prefers-color-scheme media query', () => {
    mockMatchMedia(false)
    expect(getSystemColorTheme()).toBe('light')
    mockMatchMedia(true)
    expect(getSystemColorTheme()).toBe('dark')
  })
})
