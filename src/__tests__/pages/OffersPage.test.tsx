import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { OffersPage } from '../../pages/OffersPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

/** Renders where a tap navigated to, so navigation is observable without mounting the whole app. */
function CurrentPath() {
  const { pathname } = useLocation()
  return <p>{`Current path: ${pathname}`}</p>
}

function renderOffersPage() {
  renderWithRouter(
    <>
      <OffersPage />
      <CurrentPath />
    </>,
  )
}

/** Puts the grid density somewhere other than the default before the page reads it. */
function storeGridSize(gridSize: number) {
  window.localStorage.setItem('h-ours:settings', JSON.stringify({ colorTheme: 'light', gridSize }))
}

describe('OffersPage', () => {
  it('splits your offers into a skill section and an item section', () => {
    renderOffersPage()

    expect(screen.getByRole('heading', { name: 'Skill offers' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Item offers' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Web design/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Desk lamp/ })).toBeInTheDocument()
  })

  it('shows one page of each section at a time', () => {
    renderOffersPage()

    expect(screen.getByRole('button', { name: /Web design/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Resume review/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cupcake tin/ })).not.toBeInTheDocument()
    expect(screen.getAllByText('Page 1 of 2')).toHaveLength(2)
  })

  it('flips a section to the next page without moving the other section', async () => {
    const user = userEvent.setup()
    renderOffersPage()

    await user.click(screen.getByRole('button', { name: 'Next page of skill offers' }))

    expect(screen.getByRole('button', { name: /Resume review/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Web design/ })).not.toBeInTheDocument()
    // The item section stayed on its own first page.
    expect(screen.getByRole('button', { name: /Desk lamp/ })).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it('flips back, and cannot flip past either end', async () => {
    const user = userEvent.setup()
    renderOffersPage()

    expect(screen.getByRole('button', { name: 'Previous page of skill offers' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next page of skill offers' }))
    expect(screen.getByRole('button', { name: 'Next page of skill offers' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Previous page of skill offers' }))
    expect(screen.getByRole('button', { name: /Web design/ })).toBeInTheDocument()
  })

  it('turns a free box on the last page into a prompt to add more, which opens ad creation', async () => {
    const user = userEvent.setup()
    renderOffersPage()

    expect(screen.queryByRole('button', { name: 'Add more skill offers' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next page of skill offers' }))
    await user.click(screen.getByRole('button', { name: 'Add more skill offers' }))

    expect(screen.getByText('Current path: /ads/new')).toBeInTheDocument()
  })

  it('opens the ad detail page for a tapped offer', async () => {
    const user = userEvent.setup()
    renderOffersPage()

    await user.click(screen.getByRole('button', { name: /Web design/ }))

    expect(screen.getByText('Current path: /ads/mine-1')).toBeInTheDocument()
  })

  it('fits fewer offers on a page when the grid density is lower', () => {
    storeGridSize(2)
    renderOffersPage()

    // 2 per row x 2 rows = 4 boxes, so 8 skill offers plus the add prompt need three pages.
    expect(screen.getAllByText('Page 1 of 3')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /Event photography/ })).not.toBeInTheDocument()
  })
})
