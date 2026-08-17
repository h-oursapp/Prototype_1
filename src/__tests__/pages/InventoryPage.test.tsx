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

describe('InventoryPage', () => {
  it('shows every item as a tile in one flat grid, at the default grid size', () => {
    renderInventoryPage()

    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument()
    // Default grid size is 3 (settings/types.ts), so a 3x3 page has 9 cells — with 20 mock items
    // now, the first page fills exactly (no empty padding cell; that only shows up on page 3).
    expect(grid().getByRole('button', { name: 'Acoustic guitar' })).toBeInTheDocument()
    expect(grid().getByRole('button', { name: 'Bread tin' })).toBeInTheDocument()
    expect(grid().getAllByRole('listitem')).toHaveLength(9)
    expect(grid().getAllByRole('button', { name: /^[A-Z]/ })).toHaveLength(9)
  })

  it('says how much of the inventory a trading partner can see', () => {
    renderInventoryPage()

    expect(screen.getByText(/16 of 20 items are visible to a trading partner/)).toBeInTheDocument()
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

    await user.click(grid().getByRole('button', { name: 'Acoustic guitar' }))
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

    await user.click(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' }))

    expect(offer().getByText('Acoustic guitar')).toBeInTheDocument()
    expect(grid().getByRole('button', { name: 'Remove Acoustic guitar from your offer' })).toBeInTheDocument()

    await user.click(grid().getByRole('button', { name: 'Remove Acoustic guitar from your offer' }))

    expect(offer().queryByText('Acoustic guitar')).toBeNull()
    expect(offer().getByText('Nothing in the offer yet.')).toBeInTheDocument()
  })

  it('can also remove an offered item from the transfer box itself', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' }))
    await user.click(offer().getByRole('button', { name: 'Remove Acoustic guitar from your offer' }))

    expect(offer().getByText('Nothing in the offer yet.')).toBeInTheDocument()
    expect(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' })).toBeInTheDocument()
  })

  it('flags an offered item that is still private, and stops flagging it once removed', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(grid().getByRole('button', { name: 'Add Camera to your offer' }))

    expect(offer().getByText('Private')).toBeInTheDocument()
    expect(screen.getByText(/Still private, so invisible to Lena K.: 1 of 1/)).toBeInTheDocument()

    await user.click(grid().getByRole('button', { name: 'Remove Camera from your offer' }))

    expect(offer().queryByText('Private')).toBeNull()
    expect(screen.queryByText(/Still private, so invisible to Lena K./)).toBeNull()
  })

  it('accepting the offer goes straight back to the trade it was built for', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(grid().getByRole('button', { name: 'Add Acoustic guitar to your offer' }))
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
    expect(grid().getByRole('button', { name: 'Acoustic guitar' })).toBeInTheDocument()

    expect(screen.queryByRole('region', { name: 'Trading context' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Your offer for this trade' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Back to trading' })).toBeNull()
  })

  describe('picking an item for a new ad (TODO #8)', () => {
    it('appears at ?forAd=new, with different wording than the trade context', () => {
      renderInventoryPage('/inventory?forAd=new')

      expect(screen.getByRole('region', { name: 'Picking context' })).toBeInTheDocument()
      expect(screen.getByText('Picking an item for your new ad')).toBeInTheDocument()
      expect(grid().getByRole('button', { name: 'Use Acoustic guitar for this ad' })).toBeInTheDocument()
    })

    it('picking a second item replaces the first, since an ad has exactly one subject', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?forAd=new')

      await user.click(grid().getByRole('button', { name: 'Use Acoustic guitar for this ad' }))
      expect(offer().getByText('Acoustic guitar')).toBeInTheDocument()

      await user.click(grid().getByRole('button', { name: 'Use Bread tin for this ad' }))
      expect(offer().queryByText('Acoustic guitar')).toBeNull()
      expect(offer().getByText('Bread tin')).toBeInTheDocument()
    })

    it('tapping the chosen item again clears it', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?forAd=new')

      await user.click(grid().getByRole('button', { name: 'Use Acoustic guitar for this ad' }))
      await user.click(grid().getByRole('button', { name: "Remove Acoustic guitar as this ad's item" }))

      expect(offer().getByText('Nothing in the offer yet.')).toBeInTheDocument()
    })

    it('disables "Use this item" until one has been picked, then sends it back to the new ad', async () => {
      const user = userEvent.setup()
      renderInventoryPage('/inventory?forAd=new')

      expect(screen.getByRole('button', { name: 'Use this item' })).toBeDisabled()

      await user.click(grid().getByRole('button', { name: 'Use Acoustic guitar for this ad' }))
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

      await user.click(grid().getByRole('button', { name: 'Use Camera for this ad' }))
      expect(offer().queryByText('Private')).toBeNull()
    })
  })
})
