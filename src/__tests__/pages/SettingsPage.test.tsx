import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SEARCH_FILTERS } from '../../data/searchFilters'
import { SettingsPage } from '../../pages/SettingsPage'
import { LocationProbe, renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

function renderSettingsPage() {
  renderWithRouter(
    <>
      <SettingsPage />
      <LocationProbe />
    </>,
    { route: '/settings' },
  )
}

describe('SettingsPage', () => {
  it('reflects the current grid size and color theme', () => {
    renderSettingsPage()
    expect(screen.getByRole('button', { name: '3 per row' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('updates and persists grid size and color theme', async () => {
    const user = userEvent.setup()
    renderSettingsPage()

    await user.click(screen.getByRole('button', { name: '2 per row' }))
    await user.click(screen.getByRole('button', { name: 'Dark' }))

    expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toEqual({
      colorTheme: 'dark',
      gridSize: 2,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('links through to the Legal page', async () => {
    const user = userEvent.setup()
    renderSettingsPage()

    await user.click(screen.getByRole('button', { name: 'Legal' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/legal')
  })

  describe('default search filters (TODO #3)', () => {
    it('starts at "show everything, any distance, any rating"', () => {
      renderSettingsPage()

      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByText('Distance: Any distance')).toBeInTheDocument()
      expect(screen.getByText('0 of 5')).toBeInTheDocument()
    })

    it('updates and persists the default kind filter', async () => {
      const user = userEvent.setup()
      renderSettingsPage()

      await user.click(screen.getByRole('button', { name: 'Items' }))

      expect(screen.getByRole('button', { name: 'Items' })).toHaveAttribute('aria-pressed', 'true')
      expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toMatchObject({
        defaultSearchFilters: { ...DEFAULT_SEARCH_FILTERS, kindFilter: 'item' },
      })
    })

    it('updates and persists the default distance filter', () => {
      renderSettingsPage()

      fireEvent.change(screen.getByLabelText(/Distance:/), { target: { value: '3' } })

      expect(screen.getByText('Distance: Within 3 km')).toBeInTheDocument()
      expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toMatchObject({
        defaultSearchFilters: { ...DEFAULT_SEARCH_FILTERS, maxDistanceKm: 3 },
      })
    })

    it('updates and persists the default minimum rating', async () => {
      const user = userEvent.setup()
      renderSettingsPage()

      await user.click(screen.getByRole('radio', { name: 'Minimum rating: Rate 4 out of 5' }))

      expect(screen.getByText('4 of 5')).toBeInTheDocument()
      expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toMatchObject({
        defaultSearchFilters: { ...DEFAULT_SEARCH_FILTERS, minRating: 4 },
      })
    })
  })
})
