import { screen, within } from '@testing-library/react'
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

/** jsdom never lays anything out, so `useFittingRows` measures a 0x0 box and falls back to its
 *  `minRows` default — see useFittingRows.test.tsx for the real measured-height arithmetic this
 *  mirrors, and GridSection.test.tsx for the same technique used on Home's grid. */
function stubTallGridArea() {
  const original = HTMLElement.prototype.getBoundingClientRect
  HTMLElement.prototype.getBoundingClientRect = () => ({ width: 390, height: 900 }) as DOMRect
  return () => {
    HTMLElement.prototype.getBoundingClientRect = original
  }
}

describe('OffersPage', () => {
  it('no longer splits into a skill section and an item section (TODO #16)', () => {
    renderOffersPage()

    expect(screen.queryByRole('heading', { name: 'Skill offers' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Item offers/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Item offers')).not.toBeInTheDocument()
  })

  it("puts the add-more prompt in the grid's very first slot", () => {
    renderOffersPage()

    const grid = screen.getByRole('list', { name: 'Your offers' })
    expect(within(grid).getAllByRole('button')[0]).toHaveAccessibleName('Add a new offer')
  })

  it('opens ad creation from the add-more prompt', async () => {
    const user = userEvent.setup()
    renderOffersPage()

    await user.click(screen.getByRole('button', { name: 'Add a new offer' }))

    expect(screen.getByText('Current path: /ads/new')).toBeInTheDocument()
  })

  it('opens the ad detail page for a tapped offer', async () => {
    const user = userEvent.setup()
    renderOffersPage()

    await user.click(screen.getByRole('button', { name: /Web design/ }))

    expect(screen.getByText('Current path: /ads/mine-1')).toBeInTheDocument()
  })

  it('shows each offer\'s rating, same as Home\'s Ads grid', () => {
    renderOffersPage()

    // Web design (mine-1) is rated 5 out of 5 in the mock data.
    expect(screen.getByRole('button', { name: 'Web design, 4 hours, rated 5 out of 5' })).toBeInTheDocument()
    // The add-more prompt isn't a real offer, so it gets no rating.
    expect(screen.getByRole('button', { name: 'Add a new offer' })).toBeInTheDocument()
  })

  it('caps the first page at columns x rows tiles before any real layout exists, add prompt included', () => {
    renderOffersPage()

    // Default grid size 3, no measured layout -> useFittingRows falls back to 3 rows: 3x3 = 9
    // slots, the add prompt plus 8 real offers.
    const grid = screen.getByRole('list', { name: 'Your offers' })
    expect(within(grid).getAllByRole('button')).toHaveLength(9)
  })

  // Both tests below stub a taller grid area (see stubTallGridArea) so useFittingRows measures
  // more than the jsdom fallback's 3 rows.
  describe('once the grid area actually measures taller than the fallback', () => {
    it('mixes skill and item offers on the same page instead of keeping them apart', () => {
      const restore = stubTallGridArea()
      try {
        renderOffersPage()

        // 3 columns x 6 rows (see useFittingRows.test.tsx for the arithmetic) = 18 slots: the add
        // prompt plus the first 17 offers. 'Web design' is a skill offer and 'Desk lamp' an item
        // offer that used to live in the separate, item-only section -- now on the same page.
        expect(screen.getByRole('button', { name: /Web design/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Desk lamp/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Page 1 of 2' })).toHaveAttribute('aria-current', 'true')
        expect(screen.getByRole('button', { name: 'Page 2 of 2' })).toBeInTheDocument()
      } finally {
        restore()
      }
    })

    it('keeps the paging: tapping a dot reveals offers hidden on the first page', async () => {
      const restore = stubTallGridArea()
      const user = userEvent.setup()
      try {
        renderOffersPage()

        expect(screen.queryByRole('button', { name: /Vinyl records/ })).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Page 2 of 2' }))

        expect(screen.getByRole('button', { name: 'Page 2 of 2' })).toHaveAttribute('aria-current', 'true')
        expect(screen.getByRole('button', { name: /Vinyl records/ })).toBeInTheDocument()
      } finally {
        restore()
      }
    })
  })

  it('shows a dot per page, pinned to the bottom of the viewport, instead of a "Page N of M" row', () => {
    renderOffersPage()

    // Default fallback: 9 slots/page, 25 total (1 add prompt + 24 offers) -> 3 pages.
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Page \d of \d/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Page \d of 3$/ })).toHaveLength(3)
  })

  it('pads a short last page with visibly empty slots instead of a lopsided row', async () => {
    const user = userEvent.setup()
    renderOffersPage()

    // Default fallback: 9 slots/page, 25 total (1 add prompt + 24 offers) -> pages of 9, 9, 7.
    await user.click(screen.getByRole('button', { name: 'Page 3 of 3' }))

    expect(screen.getByRole('button', { name: 'Page 3 of 3' })).toHaveAttribute('aria-current', 'true')
    const grid = screen.getByRole('list', { name: 'Your offers' })
    expect(within(grid).getAllByRole('listitem')).toHaveLength(9)
    expect(within(grid).getAllByRole('button')).toHaveLength(7)
  })

  it('fits fewer tiles on a page when the grid density is lower', () => {
    window.localStorage.setItem('h-ours:settings', JSON.stringify({ colorTheme: 'light', gridSize: 2 }))
    renderOffersPage()

    // 2 columns x 2 rows (the fallback minRows) = 4 slots: the add prompt plus 3 real offers.
    const grid = screen.getByRole('list', { name: 'Your offers' })
    expect(within(grid).getAllByRole('button')).toHaveLength(4)
  })

  describe('search', () => {
    it('narrows the grid to offers matching the typed text', async () => {
      const user = userEvent.setup()
      renderOffersPage()

      await user.type(screen.getByRole('searchbox', { name: 'Search your offers' }), 'web design')

      expect(screen.getByRole('button', { name: /Web design/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Dog walking/ })).not.toBeInTheDocument()
    })

    it('keeps the add-more prompt visible while searching, even with no matches', async () => {
      const user = userEvent.setup()
      renderOffersPage()

      await user.type(screen.getByRole('searchbox', { name: 'Search your offers' }), 'no such offer')

      expect(screen.getByRole('button', { name: 'Add a new offer' })).toBeInTheDocument()
      expect(screen.getByText('No offers match your search.')).toBeInTheDocument()
      const grid = screen.getByRole('list', { name: 'Your offers' })
      expect(within(grid).getAllByRole('button')).toHaveLength(1)
    })

    it('shows every matching offer again once the search is cleared', async () => {
      const user = userEvent.setup()
      renderOffersPage()

      const searchField = screen.getByRole('searchbox', { name: 'Search your offers' })
      await user.type(searchField, 'web design')
      await user.clear(searchField)

      expect(screen.getByRole('button', { name: /Dog walking/ })).toBeInTheDocument()
      expect(screen.queryByText('No offers match your search.')).not.toBeInTheDocument()
    })
  })
})
