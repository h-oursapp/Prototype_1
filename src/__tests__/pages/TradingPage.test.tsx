import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TradingPage } from '../../pages/TradingPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

/** The page reads :tradeId itself, so it has to be mounted at the route pattern. */
function renderTradingPage(tradeId = 'trade-1') {
  renderWithRouter(<TradingPage />, { route: `/trading/${tradeId}`, path: '/trading/:tradeId' })
}

describe('TradingPage', () => {
  it('renders all three zones for the trade', () => {
    renderTradingPage()

    expect(screen.getByRole('heading', { name: 'Trading with Lena K.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Inventories' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Trading table' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument()
  })

  it('shows your own private items, marked as not visible to the partner', () => {
    renderTradingPage()

    expect(screen.getByText('Camera')).toBeInTheDocument()
    expect(screen.getByText('Passport folder')).toBeInTheDocument()
    expect(screen.getAllByText('Private — not visible to Lena K.')).toHaveLength(2)
  })

  it("never puts the partner's private items in the document, even with their inventory open", async () => {
    const user = userEvent.setup()
    renderTradingPage()

    expect(screen.getByText('Amplifier')).toBeInTheDocument()
    expect(screen.queryByText('Private box')).toBeNull()
    expect(screen.queryByLabelText('Private box')).toBeNull()

    await user.click(screen.getByRole('button', { name: /Open Lena K.'s full inventory/ }))

    expect(screen.getAllByText('Amplifier').length).toBeGreaterThan(1)
    expect(screen.queryByText('Private box')).toBeNull()
    expect(screen.queryByLabelText('Private box')).toBeNull()
  })

  it('shows your available hours but masks the partner’s', () => {
    renderTradingPage()

    const yourSide = screen.getByRole('group', { name: 'Your side of the trading table' })
    expect(within(yourSide).getByText('12 h')).toBeInTheDocument()

    const maskedHours = screen.getByLabelText(/available hours are hidden from you/i)
    expect(maskedHours).toHaveTextContent('???')
  })

  it('adjusts your offered hours with the stepper', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    const offeredHours = screen.getByRole('group', { name: 'Your offered hours' })
    expect(within(offeredHours).getByText('2 h')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Offer one hour more' }))
    expect(within(offeredHours).getByText('3 h')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Offer one hour less' }))
    expect(within(offeredHours).getByText('2 h')).toBeInTheDocument()
  })

  it('puts an item on the table from the keyboard-accessible fallback, and takes it off again', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    const yourOffer = screen.getByRole('group', { name: 'Your offer on the table' })
    expect(within(yourOffer).getByText('Nothing on the table yet.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add Acoustic guitar to the table' }))
    expect(within(yourOffer).getByText('Acoustic guitar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove Acoustic guitar from the table' }))
    expect(within(yourOffer).queryByText('Acoustic guitar')).toBeNull()
  })

  it('links to your own full inventory and to final review', () => {
    renderTradingPage()

    // Carries the trade, so Inventory opens in its offer-building mode (§6) rather than plain.
    expect(screen.getByRole('link', { name: 'Open your full inventory' })).toHaveAttribute(
      'href',
      '/inventory?trade=trade-1',
    )
    expect(screen.getByRole('link', { name: 'Open final review' })).toHaveAttribute(
      'href',
      '/trades/trade-1/review',
    )
  })

  it('shows the trade’s messages and toggles the chat between inline and full screen', async () => {
    const user = userEvent.setup()
    renderTradingPage()

    expect(screen.getByText('Hi! Would two hours a week work for you?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expand chat to full screen' }))
    const collapse = screen.getByRole('button', { name: 'Collapse chat' })
    expect(collapse).toHaveAttribute('aria-expanded', 'true')

    await user.click(collapse)
    expect(screen.getByRole('button', { name: 'Expand chat to full screen' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
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

  it('shows a way back instead of crashing on an unknown trade id', () => {
    renderTradingPage('no-such-trade')

    expect(screen.getByRole('heading', { name: 'Trade not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to trades' })).toHaveAttribute('href', '/trades')
  })
})
