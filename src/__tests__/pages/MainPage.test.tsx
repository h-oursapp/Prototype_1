import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsProvider } from '../../settings/SettingsContext'
import { MainPage } from '../../pages/MainPage'

beforeEach(() => {
  window.localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
})

function renderMainPage(onOpenSettings = vi.fn()) {
  render(
    <SettingsProvider>
      <MainPage onOpenSettings={onOpenSettings} />
    </SettingsProvider>,
  )
  return onOpenSettings
}

describe('MainPage', () => {
  it('renders the Ads and Your offers grids plus the nav bar', () => {
    renderMainPage()
    expect(screen.getByText('Ads')).toBeInTheDocument()
    expect(screen.getByText('Your offers')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guitar lessons' })).toBeInTheDocument()
  })

  it('shows a coming-soon status when an offer or corner arrow is tapped', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.click(screen.getByRole('button', { name: 'Guitar lessons' }))
    expect(screen.getByRole('status')).toHaveTextContent('Guitar lessons — coming soon')

    await user.click(screen.getByRole('button', { name: 'Open search' }))
    expect(screen.getByRole('status')).toHaveTextContent('Search — coming soon')
  })

  it('opens and closes the dummy Wallet sheet from the nav bar', async () => {
    const user = userEvent.setup()
    renderMainPage()

    expect(screen.queryByRole('dialog', { name: 'Wallet' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hours balance: 12, open wallet' }))
    expect(screen.getByRole('dialog', { name: 'Wallet' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog', { name: 'Wallet' })).not.toBeInTheDocument()
  })

  it('opens the Wallet sheet via the swipe-up hint', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.click(screen.getByRole('button', { name: 'Open Wallet' }))
    expect(screen.getByRole('dialog', { name: 'Wallet' })).toBeInTheDocument()
  })

  it('calls onOpenSettings when the settings button is pressed', async () => {
    const user = userEvent.setup()
    const onOpenSettings = renderMainPage()

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })
})
