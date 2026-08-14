import { screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
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

const shelf = (label: string) => within(screen.getByRole('list', { name: label }))
const offer = () => within(screen.getByRole('group', { name: 'Your offer for this trade' }))

/** Open the "create shelf" form from the header button and submit a name. */
async function createShelf(user: UserEvent, name: string) {
  await user.click(screen.getByRole('button', { name: 'New shelf' }))
  if (name !== '') {
    await user.type(screen.getByLabelText('Shelf name'), name)
  }
  await user.click(screen.getByRole('button', { name: 'Create shelf' }))
}

describe('InventoryPage', () => {
  it('groups your items by shelf and still shows the ones without a shelf', () => {
    renderInventoryPage()

    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument()

    expect(shelf('Music shelf').getAllByRole('listitem')).toHaveLength(2)
    expect(shelf('Music shelf').getByText('Acoustic guitar')).toBeInTheDocument()
    expect(shelf('Tools shelf').getAllByRole('listitem')).toHaveLength(3)
    expect(shelf('Kitchen shelf').getByText('Bread tin')).toBeInTheDocument()

    const unshelved = shelf('Items without a shelf')
    expect(unshelved.getAllByRole('listitem')).toHaveLength(2)
    expect(unshelved.getByText('Tent')).toBeInTheDocument()
    expect(unshelved.getByText('Passport folder')).toBeInTheDocument()
  })

  it('says how much of the inventory a trading partner can see', () => {
    renderInventoryPage()

    expect(screen.getByText(/6 of 8 items are visible to a trading partner/)).toBeInTheDocument()
  })

  it('marks each item public or private and toggles it', async () => {
    const user = userEvent.setup()
    renderInventoryPage()

    expect(shelf('Tools shelf').getAllByText('Public')).toHaveLength(2)
    expect(shelf('Tools shelf').getByText('Private')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Make Camera public' }))

    expect(shelf('Tools shelf').getAllByText('Public')).toHaveLength(3)
    expect(shelf('Tools shelf').queryByText('Private')).toBeNull()
    expect(screen.getByText(/7 of 8 items are visible to a trading partner/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Make Camera private' }))

    expect(screen.getByText(/6 of 8 items are visible to a trading partner/)).toBeInTheDocument()
  })

  it('creates a new, empty shelf and offers it to every item', async () => {
    const user = userEvent.setup()
    renderInventoryPage()

    await createShelf(user, 'Garage')

    expect(screen.getByRole('heading', { name: 'Garage' })).toBeInTheDocument()
    expect(screen.getByText('This shelf is empty. Move an item here with its shelf picker.')).toBeInTheDocument()
    // The form closes once the shelf exists, so the page returns to the grid.
    expect(screen.queryByLabelText('Shelf name')).toBeNull()

    expect(within(screen.getByLabelText('Shelf for Tent')).getByRole('option', { name: 'Garage' })).toBeInTheDocument()
  })

  it('refuses a shelf with no name, and one whose name is already taken', async () => {
    const user = userEvent.setup()
    renderInventoryPage()

    await createShelf(user, '')
    expect(screen.getByRole('alert')).toHaveTextContent('Give the shelf a name.')

    await user.type(screen.getByLabelText('Shelf name'), 'music')
    await user.click(screen.getByRole('button', { name: 'Create shelf' }))
    expect(screen.getByRole('alert')).toHaveTextContent('You already have a shelf called music.')

    // Nothing was created either time — the four starting sections are still all there is.
    expect(screen.getAllByRole('list')).toHaveLength(4)
  })

  it('moves an item onto a shelf, and off it again', async () => {
    const user = userEvent.setup()
    renderInventoryPage()

    await user.selectOptions(screen.getByLabelText('Shelf for Tent'), 'Kitchen')

    expect(shelf('Kitchen shelf').getByText('Tent')).toBeInTheDocument()
    expect(shelf('Items without a shelf').queryByText('Tent')).toBeNull()

    await user.selectOptions(screen.getByLabelText('Shelf for Tent'), 'No shelf')

    expect(shelf('Items without a shelf').getByText('Tent')).toBeInTheDocument()
    expect(shelf('Kitchen shelf').queryByText('Tent')).toBeNull()
  })

  it('shows none of the trading controls without a trade in the URL', () => {
    renderInventoryPage()

    expect(screen.queryByRole('region', { name: 'Trading context' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Your offer for this trade' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Back to trading' })).toBeNull()
    expect(screen.queryByRole('button', { name: /to your offer/ })).toBeNull()
  })

  it('adds the drop area, Accept and Back to trading in a trading context, and names the partner', () => {
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

  it('builds the offer with the keyboard-accessible fallback, and takes an item back off', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(screen.getByRole('button', { name: 'Add Acoustic guitar to your offer' }))

    expect(offer().getByText('Acoustic guitar')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Acoustic guitar is already in your offer' }),
    ).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Remove Acoustic guitar from your offer' }))

    expect(offer().queryByText('Acoustic guitar')).toBeNull()
    expect(offer().getByText('Nothing in the offer yet.')).toBeInTheDocument()
  })

  it('flags an offered item that is still private, and stops flagging it once it is public', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(screen.getByRole('button', { name: 'Add Camera to your offer' }))

    expect(offer().getByText('Private')).toBeInTheDocument()
    expect(screen.getByText(/Still private, so invisible to Lena K.: 1 of 1/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Make Camera public' }))

    expect(offer().queryByText('Private')).toBeNull()
    expect(screen.queryByText(/Still private, so invisible to Lena K./)).toBeNull()
  })

  it('confirms an accepted offer, and withdraws that once the offer changes', async () => {
    const user = userEvent.setup()
    renderInventoryPage('/inventory?trade=trade-1')

    await user.click(screen.getByRole('button', { name: 'Add Acoustic guitar to your offer' }))
    await user.click(screen.getByRole('button', { name: 'Accept' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Offer accepted: 1 item for the trade with Lena K.',
    )

    await user.click(screen.getByRole('button', { name: 'Remove Acoustic guitar from your offer' }))

    expect(screen.queryByRole('status')).toBeNull()
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
    expect(shelf('Music shelf').getByText('Acoustic guitar')).toBeInTheDocument()

    expect(screen.queryByRole('region', { name: 'Trading context' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Your offer for this trade' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Back to trading' })).toBeNull()
  })
})
