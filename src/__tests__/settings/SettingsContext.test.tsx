import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SEARCH_FILTERS } from '../../data/searchFilters'
import { SettingsProvider } from '../../settings/SettingsContext'
import { useSettings } from '../../settings/useSettings'

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
})

function Probe() {
  const { colorTheme, gridSize, defaultSearchFilters, setColorTheme, setGridSize, setDefaultSearchFilters } =
    useSettings()
  return (
    <div>
      <span data-testid="theme">{colorTheme}</span>
      <span data-testid="grid">{gridSize}</span>
      <span data-testid="default-kind">{defaultSearchFilters.kindFilter}</span>
      <button onClick={() => setColorTheme('dark')}>go dark</button>
      <button onClick={() => setGridSize(4)}>grid 4</button>
      <button onClick={() => setDefaultSearchFilters({ kindFilter: 'skill' })}>default to skills</button>
    </div>
  )
}

describe('SettingsProvider', () => {
  it('defaults to the system theme, default grid size, and default search filters', () => {
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('grid')).toHaveTextContent('3')
    expect(screen.getByTestId('default-kind')).toHaveTextContent('all')
  })

  it('updates settings, persists them, and reflects the theme on <html>', async () => {
    const user = userEvent.setup()
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    )

    await user.click(screen.getByText('go dark'))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    await user.click(screen.getByText('grid 4'))
    expect(screen.getByTestId('grid')).toHaveTextContent('4')

    expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
    })
  })

  it('patches the default search filters without disturbing the other two (TODO #3)', async () => {
    const user = userEvent.setup()
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    )

    await user.click(screen.getByText('default to skills'))
    expect(screen.getByTestId('default-kind')).toHaveTextContent('skill')

    expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toMatchObject({
      defaultSearchFilters: { ...DEFAULT_SEARCH_FILTERS, kindFilter: 'skill' },
    })
  })
})
