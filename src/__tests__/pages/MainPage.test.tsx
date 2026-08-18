import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MainPage } from '../../pages/MainPage'
import { LocationProbe, renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

function renderMainPage() {
  renderWithRouter(
    <>
      <MainPage />
      <LocationProbe />
    </>,
  )
}

function swipe(fromY: number, toY: number) {
  const page = document.querySelector('.main-page') as HTMLElement
  fireEvent.pointerDown(page, { clientY: fromY })
  fireEvent.pointerUp(page, { clientY: toY })
}

function swipeX(fromX: number, toX: number) {
  const page = document.querySelector('.main-page') as HTMLElement
  fireEvent.pointerDown(page, { clientX: fromX, clientY: 300 })
  fireEvent.pointerUp(page, { clientX: toX, clientY: 300 })
}

describe('MainPage', () => {
  it('renders the Ads grid, the bigger logo, and the nav bar, with no visible "Ads" label or Your offers (TODO #3)', () => {
    renderMainPage()
    expect(screen.queryByText('Ads')).not.toBeInTheDocument()
    expect(screen.queryByText('Your offers')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'h_OURs' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Guitar lessons,/ })).toBeInTheDocument()
  })

  it('opens an ad when its tile is tapped', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.click(screen.getByRole('button', { name: /^Guitar lessons,/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/ads/ad-1')
  })

  it('has no Offers or Search buttons of its own anymore — Offers moved to the nav bar, Search became the search bar (TODO #3)', () => {
    renderMainPage()

    // The nav bar does have an Offers button (navItems.test.ts covers it) — this just checks
    // Home itself isn't still rendering a second, topbar one alongside it.
    expect(screen.getAllByRole('button', { name: 'Offers' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument()
  })

  it('opens Offers from the nav bar', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.click(screen.getByRole('button', { name: 'Offers' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/offers')
  })

  it('opens the Wallet on an upward swipe anywhere on the page, with no on-page hint', () => {
    renderMainPage()

    expect(screen.queryByText(/swipe up/i)).not.toBeInTheDocument()

    swipe(400, 340)
    expect(screen.getByTestId('location')).toHaveTextContent('/wallet')
  })

  it('does not open the Wallet on a small drag or a plain tap', () => {
    renderMainPage()

    swipe(400, 390)
    expect(screen.getByTestId('location')).toHaveTextContent('/')
    expect(screen.getByTestId('location')).not.toHaveTextContent('/wallet')
  })

  it('opens Your offers on a left-to-right swipe anywhere on the page (TODO #3)', () => {
    renderMainPage()

    swipeX(100, 200)
    expect(screen.getByTestId('location')).toHaveTextContent('/offers')
  })

  it('opens Search on a right-to-left swipe anywhere on the page (TODO #3)', () => {
    renderMainPage()

    swipeX(300, 200)
    expect(screen.getByTestId('location')).toHaveTextContent('/search')
  })

  it('does not open Your offers or Search on a small horizontal drag', () => {
    renderMainPage()

    swipeX(300, 320)
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  it('lets a mostly-vertical swipe win over a small horizontal drift', () => {
    renderMainPage()
    const page = document.querySelector('.main-page') as HTMLElement

    fireEvent.pointerDown(page, { clientX: 200, clientY: 400 })
    fireEvent.pointerUp(page, { clientX: 220, clientY: 340 })
    expect(screen.getByTestId('location')).toHaveTextContent('/wallet')
  })

  it('sends a typed search to the text-results view with the query filled in (TODO #3)', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.type(screen.getByLabelText('Search'), 'guitar')
    await user.click(screen.getByRole('button', { name: 'Submit search' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=guitar&view=text')
  })

  it('sends a blank search to the text view too, just without a query (TODO #3)', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.click(screen.getByRole('button', { name: 'Submit search' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/search?view=text')
  })

  it('sends a typed search to the map view from the location-pin button next to the search bar (TODO #3)', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.type(screen.getByLabelText('Search'), 'guitar')
    await user.click(screen.getByRole('button', { name: 'Open map search' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=guitar&view=map')
  })

  it('sends a blank search to the map view too, just without a query (TODO #3)', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.click(screen.getByRole('button', { name: 'Open map search' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/search?view=map')
  })

  it('keeps the nav bar permanently open, since Home never collapses it (§3)', () => {
    vi.useFakeTimers()
    try {
      renderMainPage()
      act(() => void vi.advanceTimersByTime(30_000))
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})

afterEach(() => vi.useRealTimers())
