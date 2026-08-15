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
  it('renders the Ads and Your offers grids plus the nav bar', () => {
    renderMainPage()
    expect(screen.getByText('Ads')).toBeInTheDocument()
    expect(screen.getByText('Your offers')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guitar lessons' })).toBeInTheDocument()
  })

  it('opens an ad when its tile is tapped', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.click(screen.getByRole('button', { name: 'Guitar lessons' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/ads/ad-1')
  })

  it('opens Search and Offers from the two corner arrows', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.click(screen.getByRole('button', { name: 'Open search' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/search')

    await user.click(screen.getByRole('button', { name: 'Open your offers' }))
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

  it('offers a "create new offer" tile after the last of Your offers (TODO #3)', async () => {
    const user = userEvent.setup()
    renderMainPage()

    await user.click(screen.getByRole('button', { name: 'Create new offer' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/ads/new')
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
