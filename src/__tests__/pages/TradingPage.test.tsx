import { fireEvent, render, screen, within } from '@testing-library/react'
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
 *  in the real app — standing in for "you picked an item on Inventory's page and came back",
 *  without actually mounting InventoryPage in a TradingPage test. */
function TradeDraftToggle({ tradeId, itemId }: { tradeId: string; itemId: string }) {
  const { toggleItem } = useTradeDraft()
  return <button onClick={() => toggleItem(tradeId, itemId)}>toggle {itemId}</button>
}

describe('TradingPage', () => {
  it('renders your skills, the action buttons, the trading table and the chat', () => {
    renderTradingPage()

    expect(screen.getByRole('heading', { name: 'Trading with Lena K.' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Your skills' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add items' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Your side of the trading table' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "Open Lena K.'s inventory" })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: "Lena K.'s skills" })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument()
  })

  it('gives the Trading title a smaller, compact treatment', () => {
    renderTradingPage()

    expect(screen.getByRole('heading', { name: 'Trading with Lena K.' })).toHaveClass(
      'page-shell__title--compact',
    )
  })

  it('opens Inventory in trading mode from the Add items button', async () => {
    const user = userEvent.setup()
    renderTradingPageAndTrackNavigation()

    await user.click(screen.getByRole('button', { name: 'Add items' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/inventory?trade=trade-1')
  })

  it('opens the partner’s inventory from the Open her inventory button', async () => {
    const user = userEvent.setup()
    renderTradingPageAndTrackNavigation()

    await user.click(screen.getByRole('button', { name: "Open Lena K.'s inventory" }))

    expect(screen.getByTestId('location')).toHaveTextContent('/inventory/partner?trade=trade-1')
  })

  it('opens your full skills for this trade from the grid’s last cell', async () => {
    const user = userEvent.setup()
    renderTradingPageAndTrackNavigation()

    // The row is a "best skills" preview capped to one page (see TradingPage.tsx), so the "open
    // full" tile is always visible without paging to reach it.
    const yours = screen.getByRole('group', { name: 'Your skills' })
    await user.click(within(yours).getByRole('button', { name: 'Open your full skills' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/skills')
  })

  it('shows only your highest-rated skills in the preview row, not every skill', () => {
    renderTradingPage()

    const yours = screen.getByRole('group', { name: 'Your skills' })
    // MOCK_SKILLS ratings: Web design 5, Piano 4, Cooking 3, Gardening 3, Photography 2 — the row
    // is capped to 3 real skills (+ the "open full" tile), so the two lowest-rated drop out.
    expect(within(yours).getByRole('button', { name: 'Add Web design to the table' })).toBeInTheDocument()
    expect(within(yours).getByRole('button', { name: 'Add Piano to the table' })).toBeInTheDocument()
    expect(within(yours).getByRole('button', { name: 'Add Cooking to the table' })).toBeInTheDocument()
    expect(within(yours).queryByRole('button', { name: 'Add Photography to the table' })).toBeNull()
    expect(within(yours).queryByRole('button', { name: 'Next page' })).toBeNull()
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
    expect(within(yourTable).queryByText('Acoustic guitar')).toBeNull()

    await user.click(screen.getByText('toggle item-1'))

    expect(within(yourTable).getByText('Acoustic guitar')).toBeInTheDocument()
  })

  it('puts a skill on the table by tapping its tile', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    await user.click(screen.getByRole('button', { name: 'Add Piano to the table' }))

    const yourTable = screen.getByRole('list', { name: 'Your offer on the table' })
    expect(within(yourTable).getByText('Piano')).toBeInTheDocument()
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
    expect(within(yourTable).getByText('Acoustic guitar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Decline offer' }))

    expect(within(yourTable).queryByText('Acoustic guitar')).toBeNull()
    expect(screen.getByText('Offer declined — build a new one above.')).toBeInTheDocument()
    // The trade stays open — Accept/Decline are both still available for the next offer.
    expect(screen.getByRole('button', { name: 'Accept trade' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add Piano to the table' }))
    expect(screen.queryByText('Offer declined — build a new one above.')).toBeNull()
  })

  it('links to final review, next to the respond buttons', () => {
    renderTradingPage()

    const respond = screen.getByRole('group', { name: 'Respond to this offer' })
    expect(within(respond).getByRole('link', { name: 'Final review' })).toHaveAttribute(
      'href',
      '/trades/trade-1/review',
    )
  })

  it('keeps final review reachable even once there is nothing left to respond to', () => {
    renderTradingPage('trade-3') // agreed — no Accept/Decline, but review is exactly what's next.

    const respond = screen.getByRole('group', { name: 'Respond to this offer' })
    expect(within(respond).getByRole('link', { name: 'Final review' })).toBeInTheDocument()
  })

  it('reveals the final-review notes behind the info toggle, closed by default', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    expect(screen.queryByText(/officially closes it/)).toBeNull()

    await user.click(screen.getByRole('button', { name: 'About final review' }))
    expect(screen.getByText(/officially closes it/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'About final review' }))
    expect(screen.queryByText(/officially closes it/)).toBeNull()
  })

  it('shows the trade’s last message and toggles the chat between inline and full screen', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    // Collapsed, only the peek's pinned-to-bottom message is expected to be visible content-wise —
    // jsdom doesn't compute real scroll heights, so this only asserts the last message renders.
    expect(screen.getByText(/I put my amp on the table too\./)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expand chat to full screen' }))
    const collapse = screen.getByRole('button', { name: 'Collapse chat' })
    expect(collapse).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Hi! Would two hours a week work for you?')).toBeInTheDocument()

    await user.click(collapse)
    expect(screen.getByRole('button', { name: 'Expand chat to full screen' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('expands the chat when the collapsed peek is scrolled away from its pinned bottom', () => {
    renderTradingPage()

    const messages = screen.getByRole('list', { name: 'Latest message' })
    // jsdom reports 0 for scroll metrics by default — stub them to simulate a peek that has more
    // content above the visible area, then scroll away from the bottom.
    Object.defineProperty(messages, 'scrollHeight', { value: 200, configurable: true })
    Object.defineProperty(messages, 'clientHeight', { value: 50, configurable: true })
    Object.defineProperty(messages, 'scrollTop', { value: 100, configurable: true })

    fireEvent.scroll(messages)

    expect(screen.getByRole('button', { name: 'Collapse chat' })).toBeInTheDocument()
  })

  it('appends a sent message to the chat and clears the input', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    const input = screen.getByLabelText('Message')
    await user.type(input, 'Tuesday works for me.')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.getByText('Tuesday works for me.')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('ignores an empty message', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    const chat = screen.getByRole('region', { name: 'Chat with Lena K.' })
    const messagesBefore = within(chat).getAllByRole('listitem').length

    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(within(chat).getAllByRole('listitem')).toHaveLength(messagesBefore)
  })

  it('starts the chat already expanded for a quick offer (TODO #13), and normally collapsed otherwise', () => {
    renderWithRouter(<TradingPage />, { route: '/trading/trade-1?quick=1', path: '/trading/:tradeId' })

    expect(screen.getByRole('button', { name: 'Collapse chat' })).toBeInTheDocument()
  })

  it('shows a way back instead of crashing on an unknown trade id', () => {
    renderTradingPage('no-such-trade')

    expect(screen.getByRole('heading', { name: 'Trade not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to trades' })).toHaveAttribute('href', '/trades')
  })
})
