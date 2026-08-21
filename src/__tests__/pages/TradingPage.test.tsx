import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { TradingPage } from '../../pages/TradingPage'
import { SettingsProvider } from '../../settings/SettingsContext'
import { TradeDraftProvider } from '../../trading/TradeDraftContext'
import { useTradeDraft } from '../../trading/useTradeDraft'
import { LocationProbe, renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

/** The page reads :tradeId itself, so it has to be mounted at the route pattern. */
function renderTradingPage(tradeId = 'trade-1') {
  renderWithRouter(<TradingPage />, { route: `/trading/${tradeId}`, path: '/trading/:tradeId' })
}

/** For tests that navigate *away* from TradingPage: renderWithRouter's single-route wrapping
 *  would unmount everything (LocationProbe included) the moment the URL stops matching
 *  '/trading/:tradeId', since nothing else is registered to catch it. A wildcard fallback route
 *  that renders LocationProbe — the same shape App.tsx's own catch-all uses — keeps it mounted
 *  wherever the navigation actually lands. `extra` is an optional sibling — e.g. a
 *  `TradeDraftToggle` (below), for tests that need an item on the table before they can navigate
 *  away from one (TODO #11's split tile). */
function renderTradingPageAndTrackNavigation(tradeId = 'trade-1', extra: ReactNode = null) {
  render(
    <SettingsProvider>
      <TradeDraftProvider>
        <MemoryRouter initialEntries={[`/trading/${tradeId}`]}>
          <Routes>
            <Route path="/trading/:tradeId" element={<TradingPage />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
        {extra}
      </TradeDraftProvider>
    </SettingsProvider>,
  )
}

/** A plain probe button that reaches into the same TradeDraftContext InventoryPage would write to
 *  in the real app — standing in for "you picked an item on Inventory's own page and came back",
 *  without actually mounting InventoryPage in a TradingPage test. */
function TradeDraftToggle({ tradeId, itemId }: { tradeId: string; itemId: string }) {
  const { toggleItem } = useTradeDraft()
  return <button onClick={() => toggleItem(tradeId, itemId)}>toggle {itemId}</button>
}

describe('TradingPage', () => {
  it('renders the trading table, the respond row and the bottom bar', () => {
    renderTradingPage()

    expect(screen.getByRole('heading', { name: 'Trading with Lena K.' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Your side of the trading table' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Respond to this offer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Final review' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open chat' })).toBeInTheDocument()
  })

  it('shows the h_OURs mark in the header', () => {
    renderTradingPage()

    expect(screen.getByRole('img', { name: 'h_OURs' })).toBeInTheDocument()
  })

  it('gives the Trading title a smaller, compact treatment', () => {
    renderTradingPage()

    expect(screen.getByRole('heading', { name: 'Trading with Lena K.' })).toHaveClass(
      'page-shell__title--compact',
    )
  })

  it("opens your inventory from your grid's own first tile", async () => {
    const user = userEvent.setup()
    renderTradingPageAndTrackNavigation()

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    await user.click(within(yourTable).getByRole('button', { name: 'Open your inventory' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/inventory?trade=trade-1')
  })

  it("opens the partner's inventory from their grid's own first tile", async () => {
    const user = userEvent.setup()
    renderTradingPageAndTrackNavigation()

    const partnerTable = screen.getByRole('list', { name: "Lena K.'s offer on the table" })
    await user.click(within(partnerTable).getByRole('button', { name: "Open Lena K.'s inventory" }))

    expect(screen.getByTestId('location')).toHaveTextContent('/inventory/partner?trade=trade-1')
  })

  it('fills the rest of each grid with non-interactive suggestion tiles', () => {
    renderTradingPage()

    // 3×2 = 6 slots a side. Your side: the inventory-opener + one Time tile are real, so 4
    // slots are left for mock suggestions. The partner's side has the same two real tiles — "a
    // button that opens my trading partner's profile" is still an open question (see
    // TradingPage.tsx's file banner comment), so there's no third real tile here.
    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getAllByRole('img', { name: /^Suggested:/ })).toHaveLength(4)

    const partnerTable = screen.getByRole('list', { name: "Lena K.'s offer on the table" })
    expect(within(partnerTable).getAllByRole('img', { name: /^Suggested:/ })).toHaveLength(4)
  })

  it('shows a "Nh" worth badge on a suggested item tile too ("Items worth")', () => {
    renderTradingPage()

    // Garden hose (item-17, mockInventory.ts) is one of trade-1's default suggestions, worth 0.5h.
    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    const tile = within(yourTable).getByRole('img', { name: /^Suggested: Garden hose/ })
    expect(within(tile).getByText('0.5h')).toBeInTheDocument()
  })

  it('keeps the "Open your inventory" tile while the real offer still has a spare slot', async () => {
    const user = userEvent.setup()
    const itemIds = ['item-1', 'item-2', 'item-3', 'item-4']
    renderWithRouter(
      <>
        <TradingPage />
        {itemIds.map((itemId) => (
          <TradeDraftToggle key={itemId} tradeId="trade-1" itemId={itemId} />
        ))}
      </>,
      { route: '/trading/trade-1', path: '/trading/:tradeId' },
    )

    for (const itemId of itemIds) {
      await user.click(screen.getByText(`toggle ${itemId}`))
    }

    // trade-1 offers time by default, so this is 1 time tile + 4 items = 5 of 6 slots — one
    // spare slot left, so the opener stays.
    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getByRole('button', { name: 'Open your inventory' })).toBeInTheDocument()
  })

  it('hides the "Open your inventory" tile once the real offer alone fills all 6 slots (TODO #11)', async () => {
    const user = userEvent.setup()
    const itemIds = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5']
    renderWithRouter(
      <>
        <TradingPage />
        {itemIds.map((itemId) => (
          <TradeDraftToggle key={itemId} tradeId="trade-1" itemId={itemId} />
        ))}
      </>,
      { route: '/trading/trade-1', path: '/trading/:tradeId' },
    )

    for (const itemId of itemIds) {
      await user.click(screen.getByText(`toggle ${itemId}`))
    }

    // 1 time tile + 5 items = 6 of 6 slots, no room left — the opener disappears along with the
    // spare slot it would have needed, which is also the only way back into Inventory's own
    // picking flow from this page.
    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).queryByRole('button', { name: 'Open your inventory' })).not.toBeInTheDocument()
    expect(within(yourTable).getAllByRole('listitem')).toHaveLength(6)
    expect(within(yourTable).queryAllByRole('img', { name: /^Suggested:/ })).toHaveLength(0)
  })

  it("excludes an item from its own suggestion tray once it's actually offered", async () => {
    const user = userEvent.setup()
    // item-17 ("Garden hose") is one of trade-1's own first four suggested slots by default.
    renderWithRouter(
      <>
        <TradingPage />
        <TradeDraftToggle tradeId="trade-1" itemId="item-17" />
      </>,
      { route: '/trading/trade-1', path: '/trading/:tradeId' },
    )

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getByRole('img', { name: /^Suggested: Garden hose/ })).toBeInTheDocument()
    expect(within(yourTable).queryByRole('img', { name: 'Garden hose' })).toBeNull()

    await user.click(screen.getByText('toggle item-17'))

    // TODO #11's split tile makes an offered item tappable now (open its inspect/remove split),
    // so it's a button, not the read-only role="img" it was before that landed.
    // Garden hose (item-17, mockInventory.ts) is worth 0.5 hours.
    expect(within(yourTable).getByRole('button', { name: 'Garden hose — tap for options, worth 0.5h' })).toBeInTheDocument()
    expect(within(yourTable).queryByRole('img', { name: /^Suggested: Garden hose/ })).toBeNull()
  })

  it("shows an item added via the shared trade draft (Inventory's own picking) on the table", async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <>
        <TradingPage />
        <TradeDraftToggle tradeId="trade-1" itemId="item-1" />
      </>,
      { route: '/trading/trade-1', path: '/trading/:tradeId' },
    )

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).queryByRole('img', { name: 'Acoustic guitar' })).toBeNull()

    await user.click(screen.getByText('toggle item-1'))

    expect(within(yourTable).getByRole('button', { name: 'Acoustic guitar — tap for options, worth 6h' })).toBeInTheDocument()
  })

  it('shows a "Nh" worth badge on a real offered item tile too ("Items worth")', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <>
        <TradingPage />
        <TradeDraftToggle tradeId="trade-1" itemId="item-1" />
      </>,
      { route: '/trading/trade-1', path: '/trading/:tradeId' },
    )
    await user.click(screen.getByText('toggle item-1'))

    // Acoustic guitar (item-1, mockInventory.ts) is worth 6 hours.
    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    const tile = within(yourTable).getByRole('button', { name: /^Acoustic guitar — tap for options/ })
    expect(within(tile).getByText('6h')).toBeInTheDocument()
  })

  it('splits an offered item into inspect/remove halves when tapped (TODO #11)', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <>
        <TradingPage />
        <TradeDraftToggle tradeId="trade-1" itemId="item-1" />
      </>,
      { route: '/trading/trade-1', path: '/trading/:tradeId' },
    )
    await user.click(screen.getByText('toggle item-1'))

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    await user.click(within(yourTable).getByRole('button', { name: 'Acoustic guitar — tap for options, worth 6h' }))

    const split = within(yourTable).getByRole('group', { name: 'Acoustic guitar options' })
    expect(within(split).getByText('Acoustic guitar')).toBeInTheDocument()
    expect(within(split).getByRole('button', { name: 'Remove Acoustic guitar from your offer' })).toBeInTheDocument()
  })

  it('opens the item page from the split tile’s inspect half (TODO #11)', async () => {
    const user = userEvent.setup()
    renderTradingPageAndTrackNavigation('trade-1', <TradeDraftToggle tradeId="trade-1" itemId="item-1" />)
    await user.click(screen.getByText('toggle item-1'))

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    await user.click(within(yourTable).getByRole('button', { name: 'Acoustic guitar — tap for options, worth 6h' }))
    await user.click(screen.getByText('Acoustic guitar'))

    expect(screen.getByTestId('location')).toHaveTextContent('/inventory/item-1')
  })

  it('removes the item and closes the split from its remove half (TODO #11)', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <>
        <TradingPage />
        <TradeDraftToggle tradeId="trade-1" itemId="item-1" />
      </>,
      { route: '/trading/trade-1', path: '/trading/:tradeId' },
    )
    await user.click(screen.getByText('toggle item-1'))

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    await user.click(within(yourTable).getByRole('button', { name: 'Acoustic guitar — tap for options, worth 6h' }))
    await user.click(within(yourTable).getByRole('button', { name: 'Remove Acoustic guitar from your offer' }))

    expect(within(yourTable).queryByText('Acoustic guitar')).toBeNull()
    expect(within(yourTable).queryByRole('group', { name: 'Acoustic guitar options' })).toBeNull()
  })

  it('only ever splits one item at a time — opening another closes the first (TODO #11)', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <>
        <TradingPage />
        <TradeDraftToggle tradeId="trade-1" itemId="item-1" />
        <TradeDraftToggle tradeId="trade-1" itemId="item-2" />
      </>,
      { route: '/trading/trade-1', path: '/trading/:tradeId' },
    )
    await user.click(screen.getByText('toggle item-1'))
    await user.click(screen.getByText('toggle item-2'))

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    await user.click(within(yourTable).getByRole('button', { name: 'Acoustic guitar — tap for options, worth 6h' }))
    expect(within(yourTable).getByRole('group', { name: 'Acoustic guitar options' })).toBeInTheDocument()

    const secondItemTile = within(yourTable).getAllByRole('button', { name: /— tap for options/ })[0]
    await user.click(secondItemTile)

    expect(within(yourTable).queryByRole('group', { name: 'Acoustic guitar options' })).toBeNull()
  })

  it('puts the Time tile right after the inventory-opener, before any items (TODO #11)', () => {
    // A plain (non-quick) open: the opener is slot 1, Time's own slot 2 is a suggestion by
    // default now (direct feedback), reading a flat "1 h" rather than trade-1's real yourHours.
    renderTradingPage()
    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    const slots = within(yourTable).getAllByRole('listitem')
    expect(within(slots[0]).getByRole('button', { name: 'Open your inventory' })).toBeInTheDocument()
    expect(within(slots[1]).getByRole('button', { name: /^Suggested: 1 hour/ })).toBeInTheDocument()
    expect(within(slots[1]).getByText('1 h')).toBeInTheDocument()
  })

  it('pre-fills that same Time slot from the ad\'s listed hours on a quick offer, instead of leaving it as a suggestion (TODO #11)', () => {
    // Quick Buy carries the ad's listed hours through as ?hours= — same two slots as a plain
    // open, just pre-filled with that value rather than trade.yourHours.
    renderWithRouter(<TradingPage />, { route: '/trading/trade-1?quick=1&hours=7', path: '/trading/:tradeId' })
    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    const slots = within(yourTable).getAllByRole('listitem')
    expect(within(slots[0]).getByRole('button', { name: 'Open your inventory' })).toBeInTheDocument()
    expect(within(slots[1]).getByText('7 h')).toBeInTheDocument()
  })

  it('shows Time as an opaque suggestion by default, and adds it via the scroll picker once tapped (direct feedback)', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    const suggestion = within(yourTable).getByRole('button', { name: /^Suggested: 1 hour/ })
    expect(suggestion).toBeInTheDocument()
    expect(within(yourTable).getByText('1 h')).toBeInTheDocument()

    const partnerTable = screen.getByRole('list', { name: "Lena K.'s offer on the table" })
    expect(within(partnerTable).getByText('3 h')).toBeInTheDocument()

    // Tapping the suggestion makes it active — "like now" — and opens the picker straight away.
    await user.click(suggestion)
    const picker = screen.getByRole('group', { name: 'Choose the offered time' })
    expect(within(picker).getByRole('button', { name: '1 hours' })).toHaveAttribute('aria-current', 'true')

    await user.click(within(picker).getByRole('button', { name: '3 hours' }))
    expect(within(picker).getByRole('button', { name: '3 hours' })).toHaveAttribute('aria-current', 'true')
    expect(within(yourTable).getByText('3 h')).toBeInTheDocument()
  })

  it('removes the time tile entirely, reverting it to a suggestion again (direct feedback)', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    await user.click(within(yourTable).getByRole('button', { name: /^Suggested: 1 hour/ }))
    await user.click(screen.getByRole('button', { name: 'Remove' }))

    // Back to a suggestion, not gone — "if its removed make it a suggestion again."
    expect(screen.queryByRole('group', { name: 'Choose the offered time' })).toBeNull()
    const suggestion = within(yourTable).getByRole('button', { name: /^Suggested: 1 hour/ })
    expect(suggestion).toBeInTheDocument()
    expect(within(yourTable).getByText('1 h')).toBeInTheDocument()

    await user.click(suggestion)
    expect(screen.getByRole('group', { name: 'Choose the offered time' })).toBeInTheDocument()
    expect(within(yourTable).getByText('1 h')).toBeInTheDocument() // starts fresh at 1h, not a stale amount
  })

  it('accepts an open trade with the checkmark button, and then hides it', async () => {
    const user = userEvent.setup()
    renderTradingPage() // trade-1 is 'open'

    const acceptButton = screen.getByRole('button', { name: 'Accept trade' })
    await user.click(acceptButton)

    expect(screen.queryByRole('button', { name: 'Accept trade' })).toBeNull()
    expect(screen.getByText(/This trade is agreed — there is no open offer left to accept\./)).toBeInTheDocument()
  })

  it('shows no accept button for a trade that is already agreed or closed', () => {
    renderTradingPage('trade-3') // agreed

    expect(screen.queryByRole('button', { name: 'Accept trade' })).toBeNull()
  })

  it('declines an offer, clearing the shared item draft and leaving the trade open for a new one (TODO #13)', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <>
        <TradingPage />
        <TradeDraftToggle tradeId="trade-1" itemId="item-1" />
      </>,
      { route: '/trading/trade-1', path: '/trading/:tradeId' },
    )

    await user.click(screen.getByText('toggle item-1'))
    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getByRole('button', { name: 'Acoustic guitar — tap for options, worth 6h' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Decline offer' }))

    expect(within(yourTable).queryByRole('img', { name: 'Acoustic guitar' })).toBeNull()
    expect(screen.getByText('Offer declined — build a new one above.')).toBeInTheDocument()
    // The trade stays open — Accept/Decline are both still available for the next offer.
    expect(screen.getByRole('button', { name: 'Accept trade' })).toBeInTheDocument()

    // Time is back to being a suggestion too (direct feedback: "if its removed make it a
    // suggestion again" applies just as much to a declined offer) — tapping it both adds it and
    // opens the picker in one go.
    await user.click(within(yourTable).getByRole('button', { name: /^Suggested: 1 hour/ }))
    expect(screen.getByRole('group', { name: 'Choose the offered time' })).toBeInTheDocument()
    expect(screen.queryByText('Offer declined — build a new one above.')).toBeNull()
  })

  it('keeps the generosity meter visible even once there is nothing left to respond to', () => {
    renderTradingPage('trade-3') // agreed — no Accept/Decline, but the meter still applies.

    const respond = screen.getByRole('group', { name: 'Respond to this offer' })
    expect(within(respond).queryByRole('button', { name: 'Accept trade' })).toBeNull()
    expect(within(respond).queryByRole('button', { name: 'Decline offer' })).toBeNull()
    expect(within(respond).getByRole('meter', { name: 'Generosity meter' })).toBeInTheDocument()
  })

  it('keeps Final review disabled outside the agreed status', () => {
    renderTradingPage() // trade-1 is 'open'

    expect(screen.getByRole('button', { name: 'Final review' })).toBeDisabled()
  })

  it('keeps Final review disabled for an already-closed trade too', () => {
    renderTradingPage('trade-5') // closed

    expect(screen.getByRole('button', { name: 'Final review' })).toBeDisabled()
  })

  it('enables Final review the moment you accept an open trade', async () => {
    const user = userEvent.setup()
    renderTradingPage() // trade-1 is 'open'

    expect(screen.getByRole('button', { name: 'Final review' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Accept trade' }))

    expect(screen.getByRole('button', { name: 'Final review' })).toBeEnabled()
  })

  it('navigates to Final review once it is enabled', async () => {
    const user = userEvent.setup()
    renderTradingPageAndTrackNavigation('trade-3') // already agreed

    await user.click(screen.getByRole('button', { name: 'Final review' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/trades/trade-3/review')
  })

  it('shows a too-good-to-be-true generosity message by default — Time is just a suggestion, not really on offer yet (direct feedback)', () => {
    renderTradingPage() // trade-1: nothing really offered yet vs Lena's real 3h

    const meter = screen.getByRole('meter', { name: 'Generosity meter' })
    expect(meter).toHaveAttribute('aria-valuetext', 'This is too good to be true.')
  })

  it('shows a fair-trade generosity message once the suggested time is added and adjusted to match', async () => {
    const user = userEvent.setup()
    renderTradingPage() // trade-1: partner offers 3h

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    await user.click(within(yourTable).getByRole('button', { name: /^Suggested: 1 hour/ }))
    const picker = screen.getByRole('group', { name: 'Choose the offered time' })
    await user.click(within(picker).getByRole('button', { name: '2 hours' }))

    const meter = screen.getByRole('meter', { name: 'Generosity meter' })
    expect(meter).toHaveAttribute('aria-valuetext', "That's a fair trade!")
    expect(screen.getByText("That's a fair trade!")).toBeInTheDocument()
  })

  it('shows an extremely-generous generosity message once you offer far more than the partner', () => {
    // trade-1's partner offers 3h; 10h is more than three times that.
    renderWithRouter(<TradingPage />, { route: '/trading/trade-1?quick=1&hours=10', path: '/trading/:tradeId' })

    expect(screen.getByText('You are extremely generous!')).toBeInTheDocument()
  })

  it('goes back to too-good-to-be-true once an active time offer is removed again', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    await user.click(within(yourTable).getByRole('button', { name: /^Suggested: 1 hour/ }))
    const picker = screen.getByRole('group', { name: 'Choose the offered time' })
    await user.click(within(picker).getByRole('button', { name: '2 hours' }))
    expect(screen.getByText("That's a fair trade!")).toBeInTheDocument()

    // The picker is already open from adding it a moment ago — no need to tap the tile again.
    await user.click(screen.getByRole('button', { name: 'Remove' }))

    expect(screen.getByText('This is too good to be true.')).toBeInTheDocument()
  })

  it('hides the chat completely by default', () => {
    renderTradingPage()

    expect(screen.queryByRole('heading', { name: 'Chat' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Open chat' })).toBeInTheDocument()
  })

  it('opens and closes the chat from the bottom bar', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    await user.click(screen.getByRole('button', { name: 'Open chat' }))
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument()
    expect(screen.getByText('Hi! Would two hours a week work for you?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close chat' }))
    expect(screen.queryByRole('heading', { name: 'Chat' })).toBeNull()
  })

  it('starts the chat already open for a quick offer (TODO #13), and hidden otherwise', () => {
    renderWithRouter(<TradingPage />, { route: '/trading/trade-1?quick=1', path: '/trading/:tradeId' })

    expect(screen.getByRole('button', { name: 'Close chat' })).toBeInTheDocument()
  })

  it('appends a sent message to the chat and clears the input', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    await user.click(screen.getByRole('button', { name: 'Open chat' }))
    const input = screen.getByLabelText('Message')
    await user.type(input, 'Tuesday works for me.')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.getByText('Tuesday works for me.')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('ignores an empty message', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    await user.click(screen.getByRole('button', { name: 'Open chat' }))
    const chat = screen.getByRole('region', { name: 'Chat with Lena K.' })
    const messagesBefore = within(chat).getAllByRole('listitem').length

    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(within(chat).getAllByRole('listitem')).toHaveLength(messagesBefore)
  })

  it("preloads the offered hours from the ad's listed price on a quick offer (TODO #8)", () => {
    renderWithRouter(<TradingPage />, {
      route: '/trading/trade-1?quick=1&hours=5',
      path: '/trading/:tradeId',
    })

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getByText('5 h')).toBeInTheDocument()
  })

  it('ignores ?hours= on a plain (non-quick) open — Time is still just a suggestion', () => {
    renderWithRouter(<TradingPage />, { route: '/trading/trade-1?hours=5', path: '/trading/:tradeId' })

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getByRole('button', { name: /^Suggested: 1 hour/ })).toBeInTheDocument()
    expect(within(yourTable).getByText('1 h')).toBeInTheDocument()
  })

  it('falls back to the usual default when ?hours= is missing or not a number', () => {
    renderWithRouter(<TradingPage />, { route: '/trading/trade-1?quick=1&hours=nope', path: '/trading/:tradeId' })

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getByText('2 h')).toBeInTheDocument()
  })

  it('clamps a preloaded value that exceeds your hours balance', () => {
    renderWithRouter(<TradingPage />, { route: '/trading/trade-1?quick=1&hours=999', path: '/trading/:tradeId' })

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    // MOCK_HOURS_BALANCE (mockUser.ts) is 12.
    expect(within(yourTable).getByText('12 h')).toBeInTheDocument()
  })

  it('shows a way back instead of crashing on an unknown trade id', () => {
    renderTradingPage('no-such-trade')

    expect(screen.getByRole('heading', { name: 'Trade not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to trades' })).toHaveAttribute('href', '/trades')
  })
})
