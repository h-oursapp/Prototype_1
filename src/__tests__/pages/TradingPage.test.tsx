import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
 *  wherever the navigation actually lands. */
function renderTradingPageAndTrackNavigation(tradeId = 'trade-1') {
  render(
    <SettingsProvider>
      <TradeDraftProvider>
        <MemoryRouter initialEntries={[`/trading/${tradeId}`]}>
          <Routes>
            <Route path="/trading/:tradeId" element={<TradingPage />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
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

    // 3×2 = 6 slots a side; the inventory-opener + one Time tile are real on both sides, so 4
    // slots are left over for mock suggestions.
    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getAllByRole('img', { name: /^Suggested:/ })).toHaveLength(4)

    const partnerTable = screen.getByRole('list', { name: "Lena K.'s offer on the table" })
    expect(within(partnerTable).getAllByRole('img', { name: /^Suggested:/ })).toHaveLength(4)
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

    expect(within(yourTable).getByRole('img', { name: 'Garden hose' })).toBeInTheDocument()
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

    expect(within(yourTable).getByRole('img', { name: 'Acoustic guitar' })).toBeInTheDocument()
  })

  it('shows a Time tile on both sides of the table, and adjusts yours via the stepper', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getByText('2 h')).toBeInTheDocument()

    const partnerTable = screen.getByRole('list', { name: "Lena K.'s offer on the table" })
    expect(within(partnerTable).getByText('3 h')).toBeInTheDocument()

    await user.click(within(yourTable).getByRole('button', { name: /Tap to adjust/ }))
    const stepper = screen.getByRole('group', { name: 'Your offered hours' })
    expect(within(stepper).getByText('2 h')).toBeInTheDocument()

    await user.click(within(stepper).getByRole('button', { name: 'Offer one hour more' }))
    expect(within(stepper).getByText('3 h')).toBeInTheDocument()
    expect(within(yourTable).getByText('3 h')).toBeInTheDocument()
  })

  it('removes the time tile entirely, and offers a way to add it back', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    await user.click(within(yourTable).getByRole('button', { name: /Tap to adjust/ }))
    await user.click(screen.getByRole('button', { name: 'Remove time from the table' }))

    // The tile itself is gone, not just zeroed — "delete it entirely," not "step down to 0h".
    expect(within(yourTable).queryByText(/h$/)).toBeNull()
    expect(screen.queryByRole('group', { name: 'Your offered hours' })).toBeNull()
    const addTimeTile = within(yourTable).getByRole('button', { name: 'Add a time offer' })
    expect(addTimeTile).toBeInTheDocument()

    await user.click(addTimeTile)
    expect(screen.getByRole('group', { name: 'Your offered hours' })).toBeInTheDocument()
    expect(within(yourTable).getByText('2 h')).toBeInTheDocument() // back to trade-1's yourHours
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
    expect(within(yourTable).getByRole('img', { name: 'Acoustic guitar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Decline offer' }))

    expect(within(yourTable).queryByRole('img', { name: 'Acoustic guitar' })).toBeNull()
    expect(screen.getByText('Offer declined — build a new one above.')).toBeInTheDocument()
    // The trade stays open — Accept/Decline are both still available for the next offer.
    expect(screen.getByRole('button', { name: 'Accept trade' })).toBeInTheDocument()

    await user.click(within(yourTable).getByRole('button', { name: /Tap to adjust/ }))
    const stepper = screen.getByRole('group', { name: 'Your offered hours' })
    await user.click(within(stepper).getByRole('button', { name: 'Offer one hour more' }))
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

  it('shows a fair-trade generosity message when the two sides are close', () => {
    renderTradingPage() // trade-1: 2h offered vs Lena's 3h

    const meter = screen.getByRole('meter', { name: 'Generosity meter' })
    expect(meter).toHaveAttribute('aria-valuetext', "That's a fair trade!")
    expect(screen.getByText("That's a fair trade!")).toBeInTheDocument()
  })

  it('shows an extremely-generous generosity message once you offer far more than the partner', () => {
    // trade-1's partner offers 3h; 10h is more than three times that.
    renderWithRouter(<TradingPage />, { route: '/trading/trade-1?quick=1&hours=10', path: '/trading/:tradeId' })

    expect(screen.getByText('You are extremely generous!')).toBeInTheDocument()
  })

  it('shows a too-good-to-be-true generosity message once your time is removed entirely', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    await user.click(within(yourTable).getByRole('button', { name: /Tap to adjust/ }))
    await user.click(screen.getByRole('button', { name: 'Remove time from the table' }))

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

  it('ignores ?hours= on a plain (non-quick) open, keeping the usual default', () => {
    renderWithRouter(<TradingPage />, { route: '/trading/trade-1?hours=5', path: '/trading/:tradeId' })

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getByText('2 h')).toBeInTheDocument() // trade-1's yourHours
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
