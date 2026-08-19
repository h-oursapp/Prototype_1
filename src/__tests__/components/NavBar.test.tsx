import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NavBar } from '../../components/NavBar'
import { LocationProbe } from '../helpers/renderWithRouter'

function renderNavBar({ collapsible = false, route = '/' } = {}) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <NavBar hoursBalance={12} collapsible={collapsible} />
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('NavBar', () => {
  it('renders all seven nav items and marks the one matching the current URL', () => {
    renderNavBar({ route: '/' })

    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Profile' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Offers' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hours balance: 12h, open wallet' })).toBeInTheDocument()
  })

  it('keeps Settings off the bar — it lives inside Profile now (TODO #4)', () => {
    renderNavBar({ route: '/' })
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument()
  })

  it('shows Hours as a big plain number with no icon (TODO #4)', () => {
    renderNavBar()

    const walletButton = screen.getByRole('button', { name: 'Hours balance: 12h, open wallet' })
    expect(walletButton).toHaveTextContent('12h')
    expect(walletButton.querySelector('.nav-bar__icon')).not.toBeInTheDocument()
  })

  it('keeps a section marked on its sub-pages', () => {
    renderNavBar({ route: '/trades/trade-3/review' })
    expect(screen.getByRole('button', { name: 'Trades' })).toHaveAttribute('aria-current', 'page')
  })

  it('navigates on its own when an item is pressed', async () => {
    const user = userEvent.setup()
    renderNavBar()

    await user.click(screen.getByRole('button', { name: 'Profile' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/profile')

    await user.click(screen.getByRole('button', { name: 'Hours balance: 12h, open wallet' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/wallet')
  })
})

// Appkarte §3: Home keeps the bar open permanently; every other page lets it collapse.
describe('NavBar collapsing', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('stays open indefinitely when not collapsible (Home)', () => {
    renderNavBar({ collapsible: false })

    act(() => void vi.advanceTimersByTime(30_000))
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  })

  // fireEvent rather than userEvent here: userEvent's own async waiting deadlocks against
  // vitest's fake timers, and this test is entirely about what the timer does.
  it('collapses to a corner button after the timer, and reopens when tapped', () => {
    renderNavBar({ collapsible: true, route: '/wallet' })

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()

    act(() => void vi.advanceTimersByTime(4000))
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show navigation' }))
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  })
})
