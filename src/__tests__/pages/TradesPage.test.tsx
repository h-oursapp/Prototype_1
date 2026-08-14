import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TradesPage } from '../../pages/TradesPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

/** MOCK_TRADES is already listed in status order, so rendering it unchanged would look sorted even
 *  if the page never sorted anything. The mock hands the page a shuffled list instead: what comes
 *  out has to be status order (open → agreed → closed), with the given order kept inside a status
 *  group — that group order is the stand-in for "last interaction" until trades carry timestamps. */
vi.mock('../../data/mockTrades', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/mockTrades')>()
  const [guitar, bike, spanish, garden, baking] = actual.MOCK_TRADES
  return { ...actual, MOCK_TRADES: [baking, spanish, bike, garden, guitar] }
})

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

function LocationProbe() {
  const { pathname } = useLocation()
  return <p data-testid="location">{pathname}</p>
}

function renderTradesPage() {
  renderWithRouter(
    <>
      <TradesPage />
      <LocationProbe />
    </>,
  )
}

function cardFor(subject: string): HTMLElement {
  const card = screen.getAllByRole('listitem').find((item) => item.textContent?.includes(subject))
  if (!card) throw new Error(`No trade card for "${subject}"`)
  return card
}

describe('TradesPage', () => {
  it('lists every trade, open and closed, sorted by status', () => {
    renderTradesPage()

    const openButtons = screen.getAllByRole('button', { name: /^Open trade:/ })
    expect(openButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Open trade: Bike repair with Tomas R.',
      'Open trade: Guitar lessons with Lena K.',
      'Open trade: Spanish tutoring with Aisha M.',
      'Open trade: Garden help with Jonas B.',
      'Open trade: Baking with Petra S.',
    ])
  })

  it('shows each trade with its status', () => {
    renderTradesPage()

    expect(within(cardFor('Guitar lessons')).getByText('Open')).toBeInTheDocument()
    expect(within(cardFor('Spanish tutoring')).getByText('Agreed')).toBeInTheDocument()
    expect(within(cardFor('Baking')).getByText('Closed')).toBeInTheDocument()
  })

  it('offers Final Review on agreed trades only', () => {
    renderTradesPage()

    expect(screen.getAllByRole('button', { name: 'Final Review' })).toHaveLength(2)
    expect(within(cardFor('Spanish tutoring')).getByRole('button', { name: 'Final Review' })).toBeInTheDocument()
    expect(within(cardFor('Guitar lessons')).queryByRole('button', { name: 'Final Review' })).toBeNull()
    expect(within(cardFor('Baking')).queryByRole('button', { name: 'Final Review' })).toBeNull()
  })

  it('opens the Trading page when a trade is tapped', async () => {
    const user = userEvent.setup()
    renderTradesPage()

    await user.click(screen.getByRole('button', { name: 'Open trade: Guitar lessons with Lena K.' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/trading/trade-1')
  })

  it('jumps straight to Final Review from an agreed trade', async () => {
    const user = userEvent.setup()
    renderTradesPage()

    await user.click(within(cardFor('Spanish tutoring')).getByRole('button', { name: 'Final Review' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/trades/trade-3/review')
  })

  it('deletes one trade chat log without touching the others', async () => {
    const user = userEvent.setup()
    renderTradesPage()

    expect(within(cardFor('Guitar lessons')).getByText('3 chat messages stored on this device.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete chat log with Lena K.' }))

    expect(within(cardFor('Guitar lessons')).getByText('Chat log deleted on this device.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete chat log with Lena K.' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Delete chat log with Tomas R.' })).toBeInTheDocument()
  })

  it('flags the unresolved status label from the Appkarte', () => {
    renderTradesPage()
    expect(screen.getByText(/suspected typo/i)).toBeInTheDocument()
  })
})
