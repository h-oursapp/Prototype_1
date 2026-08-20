import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { InventoryPage } from '../../pages/InventoryPage'
import { LocationProbe, renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

/** The page reads ?trade= itself, so the trading context is set by the route rather than a prop.
 *  No `path` is needed — /inventory takes no URL parameters. */
function renderInventoryPage(route = '/inventory') {
  renderWithRouter(
    <>
      <InventoryPage />
      <LocationProbe />
    </>,
    { route },
  )
}

const grid = () => within(screen.getByRole('list', { name: 'Your inventory' }))
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

    // Acoustic guitar (item-1, mockInventory.ts) is rated 4.
    const tile = grid().getByRole('button', { name: 'Acoustic guitar, rated 4 out of 5' })
    expect(within(tile).getByText('4★')).toBeInTheDocument()
  })

  it('shows a small "Items" caption above the search bar instead of the visibility summary (direct feedback)', () => {
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
    expect(screen.queryByRole('group', { name: 'Your offer for this trade' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Back to trading' })).toBeNull()
  })

  it('adds the transfer box, Accept and Back to trading in a trading context, and names the partner', () => {
    renderInventoryPage('/inventory?trade=trade-1')

    expect(screen.getByRole('region', { name: 'Trading context' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Picking items for your trade with Lena K.' }),
    ).toBeInTheDocument()

    expect(offer().getByText('Nothing in the offer yet.')).toBeInTheDocument()
    expect(screen.getByText(/Drag-and-drop is not wired up/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to trading' })).toHaveAttribute(
      'href',
      '/trading/trade-1',
    )
  })

  it('tapping a tile in a trading context adds it to the offer, and a second tap removes it', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(grid().getByRole('button', { name: /^Add Acoustic guitar to your offer/ }))

    expect(offer().getByText('Acoustic guitar')).toBeInTheDocument()
    expect(grid().getByRole('button', { name: /^Remove Acoustic guitar from your offer/ })).toBeInTheDocument()

    await user.click(grid().getByRole('button', { name: /^Remove Acoustic guitar from your offer/ }))

    expect(offer().queryByText('Acoustic guitar')).toBeNull()
    expect(offer().getByText('Nothing in the offer yet.')).toBeInTheDocument()
  })

  it('can also remove an offered item from the transfer box itself', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(grid().getByRole('button', { name: /^Add Acoustic guitar to your offer/ }))
    await user.click(offer().getByRole('button', { name: /^Remove Acoustic guitar from your offer/ }))

    expect(offer().getByText('Nothing in the offer yet.')).toBeInTheDocument()
    expect(grid().getByRole('button', { name: /^Add Acoustic guitar to your offer/ })).toBeInTheDocument()
  })

  it('flags an offered item that is still private, and stops flagging it once removed', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(grid().getByRole('button', { name: /^Add Camera to your offer/ }))

    expect(offer().getByText('Private')).toBeInTheDocument()
    expect(screen.getByText(/Still private, so invisible to Lena K.: 1 of 1/)).toBeInTheDocument()

    await user.click(grid().getByRole('button', { name: /^Remove Camera from your offer/ }))

    expect(offer().queryByText('Private')).toBeNull()
    expect(screen.queryByText(/Still private, so invisible to Lena K./)).toBeNull()
  })

  it('accepting the offer goes straight back to the trade it was built for', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(grid().getByRole('button', { name: /^Add Acoustic guitar to your offer/ }))
    await user.click(screen.getByRole('button', { name: 'Accept' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/trading/trade-1')
  })

  it('goes back to the trade it was opened from', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(screen.getByRole('link', { name: 'Back to trading' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/trading/trade-1')
  })

  it('falls back to the plain inventory on an unknown trade id, without crashing', () => {
    renderInventoryPage('/inventory?trade=no-such-trade')

    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument()
    expect(grid().getByRole('button', { name: /^Acoustic guitar/ })).toBeInTheDocument()

    expect(screen.queryByRole('region', { name: 'Trading context' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Your offer for this trade' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Back to trading' })).toBeNull()
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

    it('keeps an already-offered item in the transfer box even once a search hides its tile', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(grid().getByRole('button', { name: /^Add Acoustic guitar to your offer/ }))
      await user.type(screen.getByLabelText('Search your inventory'), 'bread')

      expect(grid().queryByRole('button', { name: /Acoustic guitar/ })).not.toBeInTheDocument()
      expect(offer().getByText('Acoustic guitar')).toBeInTheDocument()
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
  })

  describe('browsing skills from inside Inventory (TODO #9)', () => {
    it('shows a sliding Items/Skills toggle above the search bar, defaulting to Items', () => {
      renderInventoryPage()

      // One button, both option names always visible (direct feedback) — its accessible name
      // states what tapping it does, since the visible "Items"/"Skills" text is decorative.
      expect(viewSwitch()).toHaveAttribute('aria-label', 'Switch to Skills view')
      expect(viewSwitch()).toHaveAttribute('aria-pressed', 'false')
      expect(grid().getByRole('button', { name: /^Acoustic guitar/ })).toBeInTheDocument()
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

    it('keeps the trade transfer box visible while browsing skills in a trading context', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?trade=trade-1')

      await user.click(viewSwitch())

      expect(screen.getByRole('group', { name: 'Your offer for this trade' })).toBeInTheDocument()
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
})
