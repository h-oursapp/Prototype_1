import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TradesPage } from '../../pages/TradesPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

/** MOCK_TRADES is already listed in date order (most-recent-first — see mockTrades.ts's
 *  lastInteractionAt values), so rendering it unchanged would look sorted even if the page never
 *  sorted anything. The mock hands the page a shuffled *array position* instead: each trade keeps
 *  its own lastInteractionAt, so what comes out still has to land back in date order if the page
 *  is really sorting rather than just preserving array order.
 *  trade-6 (Web design, closed, linked to skill-1) rides along at the end so the reviewed/skill
 *  filter tests below have something real to filter for. */
vi.mock('../../data/mockTrades', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/mockTrades')>()
  const [guitar, bike, spanish, garden, baking, webDesign] = actual.MOCK_TRADES
  return { ...actual, MOCK_TRADES: [baking, spanish, bike, garden, guitar, webDesign] }
})

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

function LocationProbe() {
  const { pathname } = useLocation()
  return <p data-testid="location">{pathname}</p>
}

function renderTradesPage(route = '/trades') {
  renderWithRouter(
    <>
      <TradesPage />
      <LocationProbe />
    </>,
    { route },
  )
}

function cardFor(subject: string): HTMLElement {
  const card = screen.getAllByRole('listitem').find((item) => item.textContent?.includes(subject))
  if (!card) throw new Error(`No trade card for "${subject}"`)
  return card
}

async function selectStatus(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole('button', { name: label }))
}

describe('TradesPage', () => {
  it('defaults to open trades only, most recent first', () => {
    renderTradesPage()

    const openButtons = screen.getAllByRole('button', { name: /^Open trade:/ })
    expect(openButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Open trade: Guitar lessons with Lena K.',
      'Open trade: Bike repair with Tomas R.',
    ])
  })

  it('shows every trade, most recent first, once "All" is selected', async () => {
    const user = userEvent.setup()
    renderTradesPage()

    await selectStatus(user, 'All')

    const openButtons = screen.getAllByRole('button', { name: /^Open trade:/ })
    expect(openButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Open trade: Guitar lessons with Lena K.',
      'Open trade: Bike repair with Tomas R.',
      'Open trade: Spanish tutoring with Aisha M.',
      'Open trade: Garden help with Jonas B.',
      'Open trade: Baking with Petra S.',
      'Open trade: Web design with Nora P.',
    ])
  })

  it('filters to one status at a time via the status control', async () => {
    const user = userEvent.setup()
    renderTradesPage()

    await selectStatus(user, 'Agreed')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(cardFor('Spanish tutoring')).toBeInTheDocument()
    expect(cardFor('Garden help')).toBeInTheDocument()

    await selectStatus(user, 'Closed')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(cardFor('Baking')).toBeInTheDocument()
    expect(cardFor('Web design')).toBeInTheDocument()
  })

  it('searches by subject or partner name, within whatever status is selected', async () => {
    const user = userEvent.setup()
    renderTradesPage()
    await selectStatus(user, 'All')

    await user.type(screen.getByLabelText('Search trades'), 'lena')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(cardFor('Guitar lessons')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Search trades'))
    await user.type(screen.getByLabelText('Search trades'), 'garden')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(cardFor('Garden help')).toBeInTheDocument()
  })

  it('shows each trade with its status', async () => {
    const user = userEvent.setup()
    renderTradesPage()
    await selectStatus(user, 'All')

    expect(within(cardFor('Guitar lessons')).getByText('Open')).toBeInTheDocument()
    expect(within(cardFor('Spanish tutoring')).getByText('Agreed')).toBeInTheDocument()
    expect(within(cardFor('Baking')).getByText('Closed')).toBeInTheDocument()
  })

  it('offers Final Review on agreed trades only', async () => {
    const user = userEvent.setup()
    renderTradesPage()
    await selectStatus(user, 'All')

    expect(screen.getAllByRole('button', { name: 'Final Review' })).toHaveLength(2)
    expect(within(cardFor('Spanish tutoring')).getByRole('button', { name: 'Final Review' })).toBeInTheDocument()
    expect(within(cardFor('Guitar lessons')).queryByRole('button', { name: 'Final Review' })).toBeNull()
    expect(within(cardFor('Baking')).queryByRole('button', { name: 'Final Review' })).toBeNull()
  })

  it('shows a closed, skill-linked trade’s rating and review count', async () => {
    const user = userEvent.setup()
    renderTradesPage()
    await selectStatus(user, 'Closed')

    // trade-6 (Web design) links to skill-1, which carries one review (review-1, Lena K.).
    const webDesign = within(cardFor('Web design'))
    expect(webDesign.getByText('1 review')).toBeInTheDocument()
    expect(webDesign.getByLabelText("Web design's rating: rated 5 out of 5")).toBeInTheDocument()
    expect(webDesign.getByLabelText("Web design's review rating: rated 5 out of 5")).toBeInTheDocument()
  })

  it('shows nothing extra for a closed trade with no skill link', async () => {
    const user = userEvent.setup()
    renderTradesPage()
    await selectStatus(user, 'Closed')

    // trade-5 (Baking) has no skillId.
    const baking = within(cardFor('Baking'))
    expect(baking.queryByText(/review/)).toBeNull()
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
    await selectStatus(user, 'Agreed')

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

  it('shows an unread-message icon, and clears it once the trade is opened', async () => {
    const user = userEvent.setup()
    renderTradesPage()

    // trade-1 (Guitar lessons) is seeded with hasUnreadMessage — trade-2 (Bike repair) isn't.
    expect(within(cardFor('Guitar lessons')).getByRole('img', { name: 'Unread message' })).toBeInTheDocument()
    expect(within(cardFor('Bike repair')).queryByRole('img', { name: 'Unread message' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Open trade: Guitar lessons with Lena K.' }))

    expect(within(cardFor('Guitar lessons')).queryByRole('img', { name: 'Unread message' })).toBeNull()
  })

  it('flags the unresolved status label from the Appkarte', () => {
    renderTradesPage()
    expect(screen.getByText(/suspected typo/i)).toBeInTheDocument()
  })

  describe('filtered to reviewed trades (TODO #5/#7)', () => {
    it('shows only closed trades for ?status=closed, with a filter banner', () => {
      renderTradesPage('/trades?status=closed')

      expect(screen.getByText('Showing: reviewed trades')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
      expect(cardFor('Baking')).toBeInTheDocument()
      expect(cardFor('Web design')).toBeInTheDocument()
    })

    it('narrows further to one skill with &skill=<id>, naming it in the banner', () => {
      renderTradesPage('/trades?status=closed&skill=skill-1')

      expect(screen.getByText('Showing: reviewed trades for Web design')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
      expect(cardFor('Web design')).toBeInTheDocument()
    })

    it('clears the filter and goes back to the default open-trades view', async () => {
      const user = userEvent.setup()
      renderTradesPage('/trades?status=closed')

      await user.click(screen.getByRole('link', { name: 'Clear filter' }))
      expect(screen.getByTestId('location')).toHaveTextContent('/trades')
    })

    it('shows no results yet rather than an empty grid when nothing matches', () => {
      renderTradesPage('/trades?status=closed&skill=skill-4')

      expect(screen.getByText(/no trades match this filter yet/i)).toBeInTheDocument()
    })
  })
})
