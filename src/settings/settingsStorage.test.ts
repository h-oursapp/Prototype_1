import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSystemColorTheme, loadSettings, loadSettingsOrDefault, saveSettings } from './settingsStorage'

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
    saveSettings({ colorTheme: 'dark', gridSize: 4 })
    expect(loadSettings()).toEqual({ colorTheme: 'dark', gridSize: 4 })
  })
})

describe('loadSettingsOrDefault', () => {
  it('falls back to the system color theme and default grid size when nothing is stored', () => {
    mockMatchMedia(true)
    expect(loadSettingsOrDefault()).toEqual({ colorTheme: 'dark', gridSize: 3 })
  })

  it('prefers stored settings over the system default', () => {
    mockMatchMedia(true)
    saveSettings({ colorTheme: 'light', gridSize: 2 })
    expect(loadSettingsOrDefault()).toEqual({ colorTheme: 'light', gridSize: 2 })
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
