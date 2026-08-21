import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { InventoryPage } from '../../pages/InventoryPage'
import { LocationProbe, renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'
import { useTradeDraft } from '../../trading/useTradeDraft'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

/** The page reads ?trade= itself, so the trading context is set by the route rather than a prop.
 *  No `path` is needed — /inventory takes no URL parameters. `extra` is an optional sibling — e.g.
 *  a `TimeOfferToggle` (below), for tests that need time already on the table before this page
 *  ever mounts, the same way TradingPage.test.tsx's own `TradeDraftToggle` stands in for "picked
 *  on Inventory's page and came back". */
function renderInventoryPage(route = '/inventory', extra: ReactNode = null) {
  renderWithRouter(
    <>
      <InventoryPage />
      <LocationProbe />
      {extra}
    </>,
    { route },
  )
}

/** A plain probe that reaches into the same TradeDraftContext TradingPage would write to when its
 *  own suggested-Time tile is tapped there — standing in for "you added time on Trading's own
 *  page and came back", without actually mounting TradingPage in an InventoryPage test. Inventory
 *  itself has no way to add time at all (TODO #9.1: a suggestion never shows up here), so any test
 *  needing time already on the table has to arrive that way. */
function TimeOfferToggle({ tradeId, hours }: { tradeId: string; hours: number }) {
  const { setTimeOffered, setOfferedHours } = useTradeDraft()
  return (
    <button
      onClick={() => {
        setTimeOffered(tradeId, true)
        setOfferedHours(tradeId, hours)
      }}
    >
      offer {hours}h on {tradeId}
    </button>
  )
}

const grid = () => within(screen.getByRole('list', { name: 'Your inventory' }))
/** The trading-table overlay's own grid (TODO #9.1) — the plain drop-area/list TransferBox this
 *  page used to also show in a trading context is gone; the overlay is the one place an offer
 *  shows now. */
const tableGrid = () => within(screen.getByRole('list', { name: 'Your offer on the table' }))
/** The ad-picker's own TransferBox (TODO #8) — the only TransferBox left on this page now that a
 *  trading context uses the overlay above instead. */
const offer = () => within(screen.getByRole('group', { name: 'Your offer for this trade' }))
/** The sliding Items/Skills toggle (ViewSwitch) — one button whose accessible name states which
 *  view tapping it switches *to*, so it always matches regardless of which side is currently
 *  active. */
const viewSwitch = () => screen.getByRole('button', { name: /^Switch to (Items|Skills) view$/ })

describe('InventoryPage', () => {
  it('shows every item as a tile in one flat grid, at the default grid size', () => {
    renderInventoryPage()

    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument()
    // Default grid size is 3 (settings/types.ts), so a 3x3 page has 9 cells — with 20 mock items
    // now, the first page fills exactly (no empty padding cell; that only shows up on page 3).
    expect(grid().getByRole('button', { name: /^Acoustic guitar/ })).toBeInTheDocument()
    expect(grid().getByRole('button', { name: /^Bread tin/ })).toBeInTheDocument()
    expect(grid().getAllByRole('listitem')).toHaveLength(9)
    expect(grid().getAllByRole('button', { name: /^[A-Z]/ })).toHaveLength(9)
  })

  it('shows a single "N★" rating badge on each item tile, same as Home\'s Ads tiles (direct feedback)', () => {
    renderInventoryPage()

    // Acoustic guitar (item-1, mockInventory.ts) is rated 4, worth 6 hours.
    const tile = grid().getByRole('button', { name: 'Acoustic guitar, rated 4 out of 5, worth 6h' })
    expect(within(tile).getByText('4★')).toBeInTheDocument()
  })

  it('shows a "Nh" worth badge on each item tile ("Items worth")', () => {
    renderInventoryPage()

    // Acoustic guitar (item-1, mockInventory.ts) is worth 6 hours.
    const tile = grid().getByRole('button', { name: 'Acoustic guitar, rated 4 out of 5, worth 6h' })
    expect(within(tile).getByText('6h')).toBeInTheDocument()
  })

  it('shows a small "Items" caption beside the search bar instead of the visibility summary (direct feedback)', () => {
    renderInventoryPage()

    expect(screen.getByText('Items')).toBeInTheDocument()
    expect(screen.queryByText(/items are visible to a trading partner/)).not.toBeInTheDocument()
  })

  it('New shelf is a fully inert header icon, not a shelf-creation form', () => {
    renderInventoryPage()

    // No onClick at all — a plain, non-interactive icon rather than a button that does nothing.
    expect(screen.getByRole('button', { name: 'New shelf' })).not.toHaveAttribute('aria-expanded')
    expect(screen.queryByLabelText('Shelf name')).toBeNull()
  })

  it('consolidates every explanatory note behind one info toggle at the top, closed by default', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    expect(screen.queryByText(/Shelves are out of scope/)).toBeNull()
    expect(screen.queryByText(/Prototype scope/)).toBeNull()
    expect(screen.queryByText(/only ever sees the items you marked public/)).toBeNull()

    await user.click(screen.getByRole('button', { name: 'About this page' }))

    expect(screen.getByText(/Shelves are out of scope for this prototype/)).toBeInTheDocument()
    expect(screen.getByText(/Prototype scope: the mock inventory is fixed/)).toBeInTheDocument()
    expect(screen.getByText(/Lena K\. only ever sees the items you marked public/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'About this page' }))
    expect(screen.queryByText(/Shelves are out of scope/)).toBeNull()
  })

  it('leaves out the trade-specific note when there is no trade to explain', async () => {
    const user = userEvent.setup()
    renderInventoryPage()

    await user.click(screen.getByRole('button', { name: 'About this page' }))

    expect(screen.getByText(/Shelves are out of scope for this prototype/)).toBeInTheDocument()
    expect(screen.queryByText(/only ever sees the items you marked public/)).toBeNull()
  })

  it('opens the new-item page from the header', async () => {
    const user = userEvent.setup()
    renderInventoryPage()

    await user.click(screen.getByRole('button', { name: 'New item' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/inventory/new')
  })

  it('opens an item’s own page when its tile is tapped outside a trade', async () => {
    const user = userEvent.setup()
    renderInventoryPage()

    await user.click(grid().getByRole('button', { name: /^Acoustic guitar/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/inventory/item-1')
  })

  it('shows none of the trading controls without a trade in the URL', () => {
    renderInventoryPage()

    expect(screen.queryByRole('region', { name: 'Trading context' })).toBeNull()
    expect(screen.queryByRole('region', { name: /^Trading with/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Accept trade' })).toBeNull()
  })

  it('shows the trading context banner and the overlay, naming the partner, in a trading context', () => {
    renderInventoryPage('/inventory?trade=trade-1')

    // TODO #9.1: the banner itself no longer says "picking items..." at all — the partner's name
    // now shows up on the trading-table overlay's own heading instead (see the next assertion).
    // The plain drop-area/list TransferBox that used to also show here (heading "Trading with
    // XY") is gone — the overlay replaced everything it did.
    expect(screen.getByRole('region', { name: 'Trading context' })).toBeInTheDocument()
    expect(screen.queryByText(/picking items/i)).toBeNull()
    expect(screen.getByRole('heading', { name: 'Trading with Lena K.' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Trading with Lena K.' })).toBeInTheDocument()
  })

  it('hides the nav bar in a trading context, where the trading table owns that edge instead', () => {
    renderInventoryPage('/inventory?trade=trade-1')

    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).toBeNull()
  })

  it('keeps the nav bar outside a trading context', () => {
    renderInventoryPage()

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  })

  /** TODO #9.1: a single tap now opens the split (inspect on top, "+ add" on the bottom) instead
   *  of adding straight away — this is the shared path most of the trade-context tests below
   *  start from. */
  async function addToOfferViaSplit(user: ReturnType<typeof userEvent.setup>, itemName: string) {
    await user.click(grid().getByRole('button', { name: new RegExp(`^${itemName} — tap for options`) }))
    await user.click(grid().getByRole('button', { name: `Add ${itemName} to your offer` }))
  }

  it('splits a tile into inspect/add halves when tapped, in a trading context (TODO #9.1)', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(grid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))

    const split = grid().getByRole('group', { name: 'Acoustic guitar options' })
    expect(within(split).getByText('Acoustic guitar')).toBeInTheDocument()
    expect(within(split).getByRole('button', { name: 'Add Acoustic guitar to your offer' })).toBeInTheDocument()
  })

  it('opens the item page from the split tile’s inspect half (TODO #9.1)', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(grid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
    await user.click(screen.getByText('Acoustic guitar'))

    expect(screen.getByTestId('location')).toHaveTextContent('/inventory/item-1')
  })

  it('adds the item to the offer from the split tile’s "+" half, and closes the split (TODO #9.1)', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await addToOfferViaSplit(user, 'Acoustic guitar')

    expect(tableGrid().getByText('Acoustic guitar')).toBeInTheDocument()
    expect(grid().queryByRole('group', { name: 'Acoustic guitar options' })).toBeNull()
    expect(grid().getByRole('button', { name: /^Acoustic guitar, in your offer — tap for options/ })).toBeInTheDocument()
  })

  it('shows a non-interactive "in offer" mark instead of "+" once an item is already offered (TODO #9.1)', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')
    await addToOfferViaSplit(user, 'Acoustic guitar')

    await user.click(grid().getByRole('button', { name: /^Acoustic guitar, in your offer — tap for options/ }))

    const split = grid().getByRole('group', { name: 'Acoustic guitar options' })
    expect(within(split).queryByRole('button', { name: 'Add Acoustic guitar to your offer' })).toBeNull()
    expect(within(split).getByRole('button', { name: /In offer/ })).toBeInTheDocument()

    // Tapping that mark closes the split rather than changing the offer — removing stays the
    // trading-table overlay's own job (its item tiles have their own inspect/remove split).
    await user.click(within(split).getByRole('button', { name: /In offer/ }))
    expect(grid().queryByRole('group', { name: 'Acoustic guitar options' })).toBeNull()
    expect(tableGrid().getByText('Acoustic guitar')).toBeInTheDocument()
  })

  it('only ever splits one item at a time — opening another closes the first (TODO #9.1)', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(grid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
    expect(grid().getByRole('group', { name: 'Acoustic guitar options' })).toBeInTheDocument()

    await user.click(grid().getByRole('button', { name: /^Bread tin — tap for options/ }))

    expect(grid().queryByRole('group', { name: 'Acoustic guitar options' })).toBeNull()
    expect(grid().getByRole('group', { name: 'Bread tin options' })).toBeInTheDocument()
  })

  // Removing an already-offered item is the trading-table overlay's own job now (its item tiles
  // split into inspect/remove, same as Trading's own grid) — see "the trading table overlay"
  // describe block below. Removed items no longer round-trip through a transfer box here at all.

  it('accepting the offer goes straight back to the trade it was built for', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await addToOfferViaSplit(user, 'Acoustic guitar')
    await user.click(screen.getByRole('button', { name: 'Accept trade' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/trading/trade-1')
  })

  it('falls back to the plain inventory on an unknown trade id, without crashing', () => {
    renderInventoryPage('/inventory?trade=no-such-trade')

    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument()
    expect(grid().getByRole('button', { name: /^Acoustic guitar/ })).toBeInTheDocument()

    expect(screen.queryByRole('region', { name: 'Trading context' })).toBeNull()
    expect(screen.queryByRole('region', { name: /^Trading with/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Accept trade' })).toBeNull()
  })

  describe('search bar and visibility filter (TODO #9)', () => {
    it('narrows the grid to items whose name matches the search bar', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      await user.type(screen.getByLabelText('Search your inventory'), 'guitar')

      expect(grid().getByRole('button', { name: /^Acoustic guitar/ })).toBeInTheDocument()
      expect(grid().queryByRole('button', { name: /^Bread tin/ })).not.toBeInTheDocument()
    })

    it('narrows the grid to public or private items from the visibility filter panel', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      await user.click(screen.getByRole('button', { name: 'All' }))
      await user.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Private' }))

      expect(grid().getByRole('button', { name: /^Camera/ })).toBeInTheDocument()
      expect(grid().queryByRole('button', { name: /^Acoustic guitar/ })).not.toBeInTheDocument()
      // Picking an option closes the panel — the trigger itself now reads "Private".
      expect(screen.queryByRole('group', { name: 'Show' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Private' })).toHaveClass('is-active')
    })

    it('says so when no item matches, instead of showing an all-empty grid', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      await user.type(screen.getByLabelText('Search your inventory'), 'submarine')

      expect(screen.getByText('No items match your search.')).toBeInTheDocument()
      expect(screen.queryByRole('list', { name: 'Your inventory' })).not.toBeInTheDocument()
    })

    it('keeps an already-offered item on the trading table even once a search hides its tile', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await addToOfferViaSplit(user, 'Acoustic guitar')
      await user.type(screen.getByLabelText('Search your inventory'), 'bread')

      // Typing also collapses the table itself (TODO #9.1) — re-expand it to check the offer
      // survived the search, same as it always did.
      expect(grid().queryByRole('button', { name: /Acoustic guitar/ })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Expand the trading table' }))
      expect(tableGrid().getByText('Acoustic guitar')).toBeInTheDocument()
    })
  })

  describe('the grid fills the space it is given (TODO #9)', () => {
    it('shows only a gridSize x gridSize page before any real layout exists, as in jsdom', () => {
      renderInventoryPage()

      // Same assertion as the very first test above, spelled out here to make the *contrast*
      // with the next test obvious: this is the fallback, not a hardcoded page size.
      expect(grid().getAllByRole('listitem')).toHaveLength(9)
    })

    it('fits more rows onto the page once the grid area actually measures taller than that', () => {
      const original = HTMLElement.prototype.getBoundingClientRect
      HTMLElement.prototype.getBoundingClientRect = () => ({ width: 390, height: 900 }) as DOMRect

      try {
        renderInventoryPage()
        // 3 columns (the default grid size) x 6 rows fit a 390x900 box — see
        // useFittingRows.test.tsx for the arithmetic this mirrors. 20 mock items is more than
        // the 18 cells that makes, so every one of them is a real tile, not a padding slot.
        expect(grid().getAllByRole('listitem')).toHaveLength(18)
        expect(grid().getAllByRole('button', { name: /^[A-Z]/ })).toHaveLength(18)
      } finally {
        HTMLElement.prototype.getBoundingClientRect = original
      }
    })
  })

  describe('paging with dots, same as Offers (TODO #9 direct feedback)', () => {
    it('shows a dot per page, pinned to the bottom, instead of "Page N of M" text', () => {
      renderInventoryPage()

      // Default fallback: 9 items/page, 20 total (mockInventory) -> 3 pages of 9, 9, 2.
      expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument()
      expect(screen.queryByText(/Page \d of \d/)).not.toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: /^Page \d of 3$/ })).toHaveLength(3)
    })

    it('keeps the paging: tapping a dot reveals items hidden on the first page', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      expect(screen.queryByRole('button', { name: /^Painting supplies/ })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Page 3 of 3' }))

      expect(screen.getByRole('button', { name: 'Page 3 of 3' })).toHaveAttribute('aria-current', 'true')
      expect(screen.getByRole('button', { name: /^Painting supplies/ })).toBeInTheDocument()
    })

    it('reserves the collapsed trading-table strip\'s own measured height on the page, the same way the nav bar\'s height is reserved', async () => {
      // Regression test for a real bug, not just a math one: an earlier version of this fix folded
      // the overlay's height into `reserveBottomPx` (useFittingRows) instead — which only changes
      // how many ROWS are asked for, never the actual size of `.inventory-page__grid-area`'s own
      // box (still flex:1 of the *whole* page either way). Fewer rows just left blank space inside
      // an unchanged, too-tall box that the fixed overlay still painted straight over — dots and
      // grid content stayed exactly as hidden. The real fix has to shrink a real box, the same way
      // `--nav-bar-height` shrinks `.page-shell__content` for the nav bar — so what's worth pinning
      // down here is that mechanism: `.inventory-page` itself carries the collapsed strip's own
      // live-measured height as a CSS custom property.
      const user = userEvent.setup()
      const original = HTMLElement.prototype.getBoundingClientRect
      HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
        if (this.classList.contains('inventory-page__table-collapsed')) {
          return { height: 46 } as DOMRect
        }
        return { height: 0 } as DOMRect
      }

      try {
        renderInventoryPage('/inventory?trade=trade-1')
        const page = document.querySelector('.inventory-page') as HTMLElement

        // Direct feedback: expanded is a deliberate full takeover, not a bug — reserving room for
        // it too just starves the grid for no reason, so nothing is reserved while it starts out
        // expanded (TODO #9.1's own default).
        expect(page.style.getPropertyValue('--trade-overlay-height')).toBe('')

        await user.click(screen.getByRole('button', { name: 'Collapse the trading table' }))

        expect(page.style.getPropertyValue('--trade-overlay-height')).toBe('46px')
      } finally {
        HTMLElement.prototype.getBoundingClientRect = original
      }
    })

    it('reserves no space at all outside a trade context, same as the nav bar staying put', () => {
      renderInventoryPage()

      const page = document.querySelector('.inventory-page') as HTMLElement
      expect(page.style.getPropertyValue('--trade-overlay-height')).toBe('')
    })
  })

  describe('browsing skills from inside Inventory (TODO #9)', () => {
    it('shows a sliding Items/Skills toggle beside the search bar, defaulting to Items', () => {
      renderInventoryPage()

      // One button, both option names always visible (direct feedback) — its accessible name
      // states what tapping it does, since the visible "Items"/"Skills" text is decorative.
      expect(viewSwitch()).toHaveAttribute('aria-label', 'Switch to Skills view')
      expect(viewSwitch()).toHaveAttribute('aria-pressed', 'false')
      expect(grid().getByRole('button', { name: /^Acoustic guitar/ })).toBeInTheDocument()
    })

    it('highlights only the active option — Items highlighted and Skills muted by default, and the reverse once toggled (TODO #9 fix)', async () => {
      // Direct feedback: "the highlighting is inconsistent" — the old CSS leaned on a
      // `:first-child` selector that never actually matched the Items span (see ViewSwitch's own
      // comment), so Items stayed muted no matter which view was active. This pins the fixed,
      // state-driven behavior down so it can't quietly regress back to that.
      const user = userEvent.setup()
      renderInventoryPage()

      const itemsLabel = screen.getByText('Items')
      const skillsLabel = screen.getByText('Skills')
      expect(itemsLabel).toHaveClass('is-active')
      expect(skillsLabel).not.toHaveClass('is-active')

      await user.click(viewSwitch())

      expect(itemsLabel).not.toHaveClass('is-active')
      expect(skillsLabel).toHaveClass('is-active')
    })

    it('swaps to a read-only grid of your skills, hiding the item-only controls', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      await user.click(viewSwitch())

      // The toggle is now pressed, and names Items as what tapping it does next.
      expect(viewSwitch()).toHaveAttribute('aria-label', 'Switch to Items view')
      expect(viewSwitch()).toHaveAttribute('aria-pressed', 'true')

      const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
      expect(skillsGrid.getByRole('button', { name: /Web design/ })).toBeInTheDocument()
      expect(skillsGrid.getByRole('button', { name: /Piano/ })).toBeInTheDocument()

      // The name overlay + a single "N★" RatingBadge — Home's own Ads tile convention
      // (GridSection.test.tsx), not the two-stacked-star-row tile SkillsPage itself uses.
      expect(skillsGrid.getByText('5★')).toBeInTheDocument() // Web design's self-rating
      expect(
        skillsGrid.getByRole('button', { name: 'Web design, rated 5 out of 5' }),
      ).toBeInTheDocument()

      expect(screen.queryByRole('list', { name: 'Your inventory' })).not.toBeInTheDocument()
      expect(screen.queryByText(/items are visible to a trading partner/)).not.toBeInTheDocument()
      expect(screen.getByLabelText('Search your skills')).toBeInTheDocument()
    })

    it("opens a skill's own page when its tile is tapped", async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      await user.click(viewSwitch())
      await user.click(within(screen.getByRole('list', { name: 'Your skills' })).getByRole('button', { name: /Web design/ }))

      expect(screen.getByTestId('location')).toHaveTextContent('/skills/skill-1')
    })

    it('narrows the skills grid to skills whose name matches the search bar', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      await user.click(viewSwitch())
      await user.type(screen.getByLabelText('Search your skills'), 'piano')

      const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
      expect(skillsGrid.getByRole('button', { name: /Piano/ })).toBeInTheDocument()
      expect(skillsGrid.queryByRole('button', { name: /Web design/ })).not.toBeInTheDocument()
    })

    it('says so when no skill matches, instead of showing an all-empty grid', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      await user.click(viewSwitch())
      await user.type(screen.getByLabelText('Search your skills'), 'submarine')

      expect(screen.getByText('No skills match your search.')).toBeInTheDocument()
      expect(screen.queryByRole('list', { name: 'Your skills' })).not.toBeInTheDocument()
    })

    it('switches back to the items grid when tapped again', async () => {
      const user = userEvent.setup()
      renderInventoryPage()

      await user.click(viewSwitch())
      await user.click(viewSwitch())

      expect(grid().getByRole('button', { name: /^Acoustic guitar/ })).toBeInTheDocument()
      expect(screen.queryByRole('list', { name: 'Your skills' })).not.toBeInTheDocument()
    })

    it('keeps the trading table overlay visible while browsing skills in a trading context', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(viewSwitch())

      expect(screen.getByRole('region', { name: 'Trading with Lena K.' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Trading context' })).toBeInTheDocument()
    })

    describe('paging, same as items (direct feedback)', () => {
      it('shows a single dot when every skill fits on one page', async () => {
        const user = userEvent.setup()
        renderInventoryPage()

        await user.click(viewSwitch())

        // Default fallback: 9 skills/page, all 5 mock skills fit -> 1 page, still one dot
        // (PagedGrid's own "a single dot still shows on a single page" behaviour).
        expect(screen.getAllByRole('button', { name: /^Page \d of 1$/ })).toHaveLength(1)
        expect(screen.getByRole('button', { name: 'Page 1 of 1' })).toHaveAttribute('aria-current', 'true')
      })

      it('pages through skills once there are more than fit on one page', async () => {
        // 1 column x 1 row (jsdom fallback) = 1 skill/page -> 5 pages for the 5 mock skills.
        window.localStorage.setItem('h-ours:settings', JSON.stringify({ colorTheme: 'light', gridSize: 1 }))
        const user = userEvent.setup()
        renderInventoryPage()

        await user.click(viewSwitch())

        expect(screen.getAllByRole('button', { name: /^Page \d of 5$/ })).toHaveLength(5)
        const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
        expect(skillsGrid.getByRole('button', { name: /Web design/ })).toBeInTheDocument()
        expect(skillsGrid.queryByRole('button', { name: /Piano/ })).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Page 2 of 5' }))

        expect(screen.getByRole('button', { name: 'Page 2 of 5' })).toHaveAttribute('aria-current', 'true')
        expect(skillsGrid.getByRole('button', { name: /Piano/ })).toBeInTheDocument()
      })
    })

    describe('the visibility filter also covers skills (direct feedback)', () => {
      it('keeps the "All"/"Public"/"Private" filter visible in the Skills view too', async () => {
        const user = userEvent.setup()
        renderInventoryPage()

        await user.click(viewSwitch())

        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      })

      it('narrows the skills grid to public skills only', async () => {
        const user = userEvent.setup()
        renderInventoryPage()

        await user.click(viewSwitch())
        await user.click(screen.getByRole('button', { name: 'All' }))
        await user.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Public' }))

        const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
        expect(skillsGrid.getByRole('button', { name: /Web design/ })).toBeInTheDocument()
        // Photography (skill-5, mockUser.ts) is the one skill marked private.
        expect(skillsGrid.queryByRole('button', { name: /Photography/ })).not.toBeInTheDocument()
      })

      it('narrows the skills grid to private skills only', async () => {
        const user = userEvent.setup()
        renderInventoryPage()

        await user.click(viewSwitch())
        await user.click(screen.getByRole('button', { name: 'All' }))
        await user.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Private' }))

        const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
        expect(skillsGrid.getByRole('button', { name: /Photography/ })).toBeInTheDocument()
        expect(skillsGrid.queryByRole('button', { name: /Web design/ })).not.toBeInTheDocument()
      })

      it('keeps the filter choice when switching from items back to skills', async () => {
        const user = userEvent.setup()
        renderInventoryPage()

        await user.click(screen.getByRole('button', { name: 'All' }))
        await user.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Private' }))
        await user.click(viewSwitch())

        const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
        expect(skillsGrid.getByRole('button', { name: /Photography/ })).toBeInTheDocument()
        expect(skillsGrid.queryByRole('button', { name: /Web design/ })).not.toBeInTheDocument()
      })
    })
  })

  describe('skills get the same split inspect/add behaviour as items, in a trading context (direct feedback)', () => {
    async function addSkillViaSplit(user: ReturnType<typeof userEvent.setup>, skillName: string) {
      await user.click(viewSwitch())
      const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
      await user.click(skillsGrid.getByRole('button', { name: new RegExp(`^${skillName} — tap for options`) }))
      await user.click(skillsGrid.getByRole('button', { name: `Add ${skillName} to your offer` }))
    }

    it('splits a skill tile into inspect/add halves when tapped', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')
      await user.click(viewSwitch())

      const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
      await user.click(skillsGrid.getByRole('button', { name: /^Web design — tap for options/ }))

      const split = skillsGrid.getByRole('group', { name: 'Web design options' })
      expect(within(split).getByText('Web design')).toBeInTheDocument()
      expect(within(split).getByRole('button', { name: 'Add Web design to your offer' })).toBeInTheDocument()
    })

    it('opens the skill page from the split tile’s inspect half', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')
      await user.click(viewSwitch())

      const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
      await user.click(skillsGrid.getByRole('button', { name: /^Web design — tap for options/ }))
      await user.click(skillsGrid.getByText('Web design'))

      expect(screen.getByTestId('location')).toHaveTextContent('/skills/skill-1')
    })

    it('adds the skill to the offer, and shows a non-interactive "in offer" mark afterward', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await addSkillViaSplit(user, 'Web design')

      const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
      expect(skillsGrid.getByRole('button', { name: /^Web design, in your offer — tap for options/ })).toBeInTheDocument()

      await user.click(skillsGrid.getByRole('button', { name: /^Web design, in your offer — tap for options/ }))
      const split = skillsGrid.getByRole('group', { name: 'Web design options' })
      expect(within(split).queryByRole('button', { name: 'Add Web design to your offer' })).toBeNull()
      expect(within(split).getByRole('button', { name: /In offer/ })).toBeInTheDocument()
    })

    it('shows the offered skill on the trading table overlay, alongside items', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await addSkillViaSplit(user, 'Web design')

      const tableGrid = within(screen.getByRole('list', { name: 'Your offer on the table' }))
      expect(tableGrid.getByText('Web design')).toBeInTheDocument()
    })

    it('inspects and removes an offered skill directly from the overlay', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')
      await addSkillViaSplit(user, 'Web design')

      const tableGrid = within(screen.getByRole('list', { name: 'Your offer on the table' }))
      await user.click(tableGrid.getByRole('button', { name: /^Web design — tap for options/ }))
      const split = tableGrid.getByRole('group', { name: 'Web design options' })

      await user.click(within(split).getByRole('button', { name: 'Remove Web design from your offer' }))
      expect(tableGrid.queryByText('Web design')).toBeNull()
    })

    it('opens the skill page from the overlay’s own inspect half', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')
      await addSkillViaSplit(user, 'Web design')

      const tableGrid = within(screen.getByRole('list', { name: 'Your offer on the table' }))
      await user.click(tableGrid.getByRole('button', { name: /^Web design — tap for options/ }))
      await user.click(within(tableGrid.getByRole('group', { name: 'Web design options' })).getByText('Web design'))

      expect(screen.getByTestId('location')).toHaveTextContent('/skills/skill-1')
    })

    it('expands the trading table on its own once a skill is added, even if it was collapsed', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(screen.getByRole('button', { name: 'Collapse the trading table' }))
      expect(screen.getByText('Choose what to trade')).toBeInTheDocument()

      await addSkillViaSplit(user, 'Web design')

      expect(screen.getByRole('region', { name: 'Trading with Lena K.' })).toBeInTheDocument()
      expect(screen.queryByText('Choose what to trade')).toBeNull()
    })

    it('counts skills toward the same 6-slot cap as items', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      for (const name of ['Acoustic guitar', 'Keyboard stand', 'Drill', 'Ladder', 'Camera']) {
        await user.click(grid().getByRole('button', { name: new RegExp(`^${name} — tap for options`) }))
        await user.click(grid().getByRole('button', { name: `Add ${name} to your offer` }))
      }
      // 5 items already fill 5 of the 6 slots — one skill exactly fills the last one.
      // (addSkillViaSplit already leaves the page on the Skills view.)
      await addSkillViaSplit(user, 'Web design')

      const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
      await user.click(skillsGrid.getByRole('button', { name: /^Piano — tap for options/ }))
      const split = skillsGrid.getByRole('group', { name: 'Piano options' })
      expect(within(split).queryByRole('button', { name: 'Add Piano to your offer' })).toBeNull()
      expect(within(split).getByText('Table full')).toBeInTheDocument()
    })

    it('keeps skill-picking read-only outside a trading context', async () => {
      const user = userEvent.setup()
      renderInventoryPage()
      await user.click(viewSwitch())

      const skillsGrid = within(screen.getByRole('list', { name: 'Your skills' }))
      await user.click(skillsGrid.getByRole('button', { name: /Web design/ }))

      expect(screen.getByTestId('location')).toHaveTextContent('/skills/skill-1')
      expect(screen.queryByRole('group', { name: 'Web design options' })).toBeNull()
    })
  })

  describe('the "inventory scrollable" setting (TODO #9)', () => {
    function enableInventoryScrollable() {
      window.localStorage.setItem(
        'h-ours:settings',
        JSON.stringify({ colorTheme: 'light', gridSize: 3, inventoryScrollable: true }),
      )
    }

    it('shows every item in one flowing grid instead of paging, with no pager at all', () => {
      enableInventoryScrollable()
      renderInventoryPage()

      // All 20 mock items at once — not just the 9 that fit a single 3x3 page.
      expect(grid().getAllByRole('button', { name: /^[A-Z]/ })).toHaveLength(20)
      expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument()
      expect(screen.queryByText(/Page \d of \d/)).not.toBeInTheDocument()
    })

    it('still narrows to matching items by search while scrollable', async () => {
      enableInventoryScrollable()
      const user = userEvent.setup()
      renderInventoryPage()

      await user.type(screen.getByLabelText('Search your inventory'), 'guitar')

      expect(grid().getByRole('button', { name: /^Acoustic guitar/ })).toBeInTheDocument()
      expect(grid().queryByRole('button', { name: /^Bread tin/ })).not.toBeInTheDocument()
    })
  })

  describe('picking an item for a new ad (TODO #8)', () => {
    it('appears at ?forAd=new, with different wording than the trade context', () => {
      renderInventoryPage('/inventory?forAd=new')

      expect(screen.getByRole('region', { name: 'Picking context' })).toBeInTheDocument()
      expect(screen.getByText('Picking an item for your new ad')).toBeInTheDocument()
      expect(grid().getByRole('button', { name: /^Use Acoustic guitar for this ad/ })).toBeInTheDocument()
    })

    it('picking a second item replaces the first, since an ad has exactly one subject', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?forAd=new')

      await user.click(grid().getByRole('button', { name: /^Use Acoustic guitar for this ad/ }))
      expect(offer().getByText('Acoustic guitar')).toBeInTheDocument()

      await user.click(grid().getByRole('button', { name: /^Use Bread tin for this ad/ }))
      expect(offer().queryByText('Acoustic guitar')).toBeNull()
      expect(offer().getByText('Bread tin')).toBeInTheDocument()
    })

    it('tapping the chosen item again clears it', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?forAd=new')

      await user.click(grid().getByRole('button', { name: /^Use Acoustic guitar for this ad/ }))
      await user.click(grid().getByRole('button', { name: /^Remove Acoustic guitar as this ad's item/ }))

      expect(offer().getByText('Nothing in the offer yet.')).toBeInTheDocument()
    })

    it('disables "Use this item" until one has been picked, then sends it back to the new ad', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?forAd=new')

      expect(screen.getByRole('button', { name: 'Use this item' })).toBeDisabled()

      await user.click(grid().getByRole('button', { name: /^Use Acoustic guitar for this ad/ }))
      await user.click(screen.getByRole('button', { name: 'Use this item' }))

      expect(screen.getByTestId('location')).toHaveTextContent('/ads/new')
      expect(screen.getByTestId('location')).toHaveTextContent('itemId=item-1')
    })

    it('goes back to the new ad, abandoning the pick', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?forAd=new')

      await user.click(screen.getByRole('link', { name: 'Back to new ad' }))
      expect(screen.getByTestId('location')).toHaveTextContent('/ads/new')
    })

    it('does not flag items as private in this context — visibility to a partner is not relevant yet', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?forAd=new')

      await user.click(grid().getByRole('button', { name: /^Use Camera for this ad/ }))
      expect(offer().queryByText('Private')).toBeNull()
    })
  })

  describe('the trading table overlay (TODO #9.1)', () => {
    it('is not shown at all outside a trading context', () => {
      renderInventoryPage()

      expect(screen.queryByRole('region', { name: 'Trading with Lena K.' })).toBeNull()
      expect(screen.queryByText('Choose what to trade')).toBeNull()
    })

    it('starts expanded, with an empty Time slot since Time is just a suggestion until added on Trading', () => {
      renderInventoryPage('/inventory?trade=trade-1')

      expect(screen.getByRole('region', { name: 'Trading with Lena K.' })).toBeInTheDocument()
      expect(tableGrid().queryByText(/h$/)).toBeNull()
      expect(screen.queryByText('Choose what to trade')).toBeNull()
    })

    it('never shows a suggestion tile or an inventory-opener — only what is really on offer', () => {
      renderInventoryPage('/inventory?trade=trade-1')

      // 6 slots total, only Time is real yet — the rest are plain empty placeholders.
      expect(tableGrid().getAllByRole('listitem')).toHaveLength(6)
      expect(tableGrid().queryAllByRole('img', { name: /^Suggested:/ })).toHaveLength(0)
      expect(tableGrid().queryByRole('button', { name: /Open your inventory/ })).toBeNull()
    })

    it('adjusts the offered hours from its own Time tile via the shared scroll picker, once time is on the table', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1', <TimeOfferToggle tradeId="trade-1" hours={2} />)
      await user.click(screen.getByText('offer 2h on trade-1'))

      await user.click(tableGrid().getByRole('button', { name: /Tap to adjust/ }))
      const picker = screen.getByRole('group', { name: 'Choose the offered time' })
      await user.click(within(picker).getByRole('button', { name: '5 hours' }))

      expect(tableGrid().getByText('5 h')).toBeInTheDocument()
    })

    it('removes the time tile, leaving its slot empty — adding it back is Trading\'s own job now', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1', <TimeOfferToggle tradeId="trade-1" hours={2} />)
      await user.click(screen.getByText('offer 2h on trade-1'))

      await user.click(tableGrid().getByRole('button', { name: /Tap to adjust/ }))
      await user.click(screen.getByRole('button', { name: 'Remove' }))

      expect(tableGrid().queryByText(/h$/)).toBeNull()
      expect(tableGrid().queryByRole('button', { name: /Add.*time/i })).toBeNull()
    })

    it('shows an item added via the main grid, in the slot right before the (still empty) Time slot, at the bottom-right', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(grid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
      await user.click(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' }))

      const slots = tableGrid().getAllByRole('listitem')
      expect(within(slots[5]).queryByText(/h$/)).toBeNull() // Time's own reserved slot — still a suggestion
      expect(within(slots[4]).getByRole('button', { name: /^Acoustic guitar/ })).toBeInTheDocument()
    })

    it('keeps an already-placed item in its own slot once a second one is added (TODO #9.1)', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(grid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
      await user.click(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' }))
      // Confirms the pre-condition the rest of this test relies on.
      expect(within(tableGrid().getAllByRole('listitem')[4]).getByText('Acoustic guitar')).toBeInTheDocument()

      await user.click(grid().getByRole('button', { name: /^Keyboard stand — tap for options/ }))
      await user.click(grid().getByRole('button', { name: 'Add Keyboard stand to your offer' }))

      const slots = tableGrid().getAllByRole('listitem')
      // Acoustic guitar (added first) is still in the same slot — not shifted to make room.
      expect(within(slots[4]).getByText('Acoustic guitar')).toBeInTheDocument()
      expect(within(slots[3]).getByText('Keyboard stand')).toBeInTheDocument()
      expect(within(slots[5]).queryByText(/h$/)).toBeNull()
    })

    it('shows a "Nh" worth badge on an offered item tile in the overlay too ("Items worth")', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(grid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
      await user.click(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' }))

      // Acoustic guitar (item-1, mockInventory.ts) is worth 6 hours.
      const tile = tableGrid().getByRole('button', { name: /^Acoustic guitar — tap for options/ })
      expect(within(tile).getByText('6h')).toBeInTheDocument()
    })

    it('inspects and removes an offered item directly from the overlay (same split as Trading’s own grid)', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')
      await user.click(grid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
      await user.click(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' }))

      await user.click(tableGrid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
      const split = tableGrid().getByRole('group', { name: 'Acoustic guitar options' })
      expect(within(split).getByRole('button', { name: 'Remove Acoustic guitar from your offer' })).toBeInTheDocument()

      await user.click(within(split).getByRole('button', { name: 'Remove Acoustic guitar from your offer' }))

      expect(tableGrid().queryByText('Acoustic guitar')).toBeNull()
    })

    it('opens the item page from the overlay’s own inspect half', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')
      await user.click(grid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
      await user.click(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' }))

      await user.click(tableGrid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
      await user.click(within(tableGrid().getByRole('group', { name: 'Acoustic guitar options' })).getByText('Acoustic guitar'))

      expect(screen.getByTestId('location')).toHaveTextContent('/inventory/item-1')
    })

    it('accepts by handing off to the trading page itself, since this page never holds the trade\'s status', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(screen.getByRole('button', { name: 'Accept trade' }))

      expect(screen.getByTestId('location')).toHaveTextContent('/trading/trade-1')
    })

    it('declines by clearing the offer and reverting time to a suggestion again (direct feedback)', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1', <TimeOfferToggle tradeId="trade-1" hours={2} />)
      await user.click(screen.getByText('offer 2h on trade-1'))
      await user.click(grid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
      await user.click(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' }))

      await user.click(screen.getByRole('button', { name: 'Decline offer' }))

      expect(tableGrid().queryByText('Acoustic guitar')).toBeNull()
      // Time is gone from the overlay entirely now — it's back to being a suggestion, and a
      // suggestion never shows up here (TODO #9.1).
      expect(tableGrid().queryByText(/h$/)).toBeNull()
    })

    it('caps the main grid at 6 real slots once items alone fill it — Time isn\'t occupying a slot while it\'s just a suggestion', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      for (const name of ['Acoustic guitar', 'Keyboard stand', 'Drill', 'Ladder', 'Camera', 'Tent']) {
        await user.click(grid().getByRole('button', { name: new RegExp(`^${name} — tap for options`) }))
        await user.click(grid().getByRole('button', { name: `Add ${name} to your offer` }))
      }

      await user.click(grid().getByRole('button', { name: /^Passport folder — tap for options/ }))
      const split = grid().getByRole('group', { name: 'Passport folder options' })
      expect(within(split).queryByRole('button', { name: 'Add Passport folder to your offer' })).toBeNull()
      expect(within(split).getByText('Table full')).toBeInTheDocument()

      await user.click(within(split).getByText('Table full'))
      expect(tableGrid().queryByText('Passport folder')).toBeNull()
    })

    it('collapses once the search bar is used, and can be expanded again', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.type(screen.getByLabelText('Search your inventory'), 'guitar')

      expect(screen.queryByRole('region', { name: 'Trading with Lena K.' })).toBeNull()
      expect(screen.getByText('Choose what to trade')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Expand the trading table' }))
      expect(screen.getByRole('region', { name: 'Trading with Lena K.' })).toBeInTheDocument()
    })

    it('collapses once a different grid page is opened', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(screen.getByRole('button', { name: 'Page 2 of 3' }))

      expect(screen.queryByRole('region', { name: 'Trading with Lena K.' })).toBeNull()
      expect(screen.getByText('Choose what to trade')).toBeInTheDocument()
    })

    it('collapses on scroll, while the inventory-scrollable setting is on', () => {
      window.localStorage.setItem(
        'h-ours:settings',
        JSON.stringify({ colorTheme: 'light', gridSize: 3, inventoryScrollable: true }),
      )
      renderInventoryPage('/inventory?trade=trade-1')
      expect(screen.getByRole('region', { name: 'Trading with Lena K.' })).toBeInTheDocument()

      const scrollContainer = document.querySelector('.page-shell__content')
      if (!scrollContainer) throw new Error('scroll container not found')
      fireEvent.scroll(scrollContainer)

      expect(screen.queryByRole('region', { name: 'Trading with Lena K.' })).toBeNull()
    })

    it('can be manually collapsed and re-expanded without any of the three auto-hide triggers', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(screen.getByRole('button', { name: 'Collapse the trading table' }))
      expect(screen.getByText('Choose what to trade')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Expand the trading table' }))
      expect(screen.getByRole('region', { name: 'Trading with Lena K.' })).toBeInTheDocument()
    })

    it('expands again on its own once an item is added, even if it was collapsed (direct feedback)', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(screen.getByRole('button', { name: 'Collapse the trading table' }))
      expect(screen.getByText('Choose what to trade')).toBeInTheDocument()

      await user.click(grid().getByRole('button', { name: /^Acoustic guitar — tap for options/ }))
      await user.click(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' }))

      expect(screen.getByRole('region', { name: 'Trading with Lena K.' })).toBeInTheDocument()
      expect(screen.queryByText('Choose what to trade')).toBeNull()
    })
  })
})
