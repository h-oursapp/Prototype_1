import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
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
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('links through to the Legal page', async () => {
    const user = userEvent.setup()
    renderSettingsPage()

    await user.click(screen.getByRole('button', { name: 'Legal' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/legal')
  })
})
