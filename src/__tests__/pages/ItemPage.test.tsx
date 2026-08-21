import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ItemPage } from '../../pages/ItemPage'
import { LocationProbe, renderWithRouter } from '../helpers/renderWithRouter'

function renderItemPage(route: string, mode?: 'create') {
  renderWithRouter(
    <>
      <ItemPage mode={mode} />
      <LocationProbe />
    </>,
    { route, path: mode ? undefined : '/inventory/:itemId' },
  )
}

describe('ItemPage — viewing and editing an existing item', () => {
  it('shows the item’s name, visibility and description', () => {
    renderItemPage('/inventory/item-5') // Camera, private

    expect(screen.getByRole('heading', { name: 'Camera' })).toBeInTheDocument()
    expect(screen.getByText('Private')).toBeInTheDocument()
    expect(screen.getByText('No description yet.')).toBeInTheDocument()
  })

  it('shows an existing description when there is one', () => {
    renderItemPage('/inventory/item-1') // Acoustic guitar

    expect(screen.getByText(/Steel-string/)).toBeInTheDocument()
    expect(screen.getByText('Public')).toBeInTheDocument()
  })

  it('shows the item\'s worth in hours, as a plain "Nh" fact ("Items worth")', () => {
    renderItemPage('/inventory/item-1') // Acoustic guitar, worth 6 hours (mockInventory.ts)

    expect(screen.getByText('6h')).toBeInTheDocument()
  })

  it('edits the name and flips visibility, then saves', async () => {
    const user = userEvent.setup()
    renderItemPage('/inventory/item-5')

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'DSLR Camera')
    await user.click(screen.getByRole('button', { name: 'Public' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('heading', { name: 'DSLR Camera' })).toBeInTheDocument()
    expect(screen.getByText('Public')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('nothing is saved')
  })

  it('edits the worth as a plain number field, then saves', async () => {
    const user = userEvent.setup()
    renderItemPage('/inventory/item-1') // Acoustic guitar, worth 6 hours

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Worth')).toHaveValue(6)

    await user.clear(screen.getByLabelText('Worth'))
    await user.type(screen.getByLabelText('Worth'), '7.5')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('7.5h')).toBeInTheDocument()
  })

  it('shows a not-found state for an unknown item id', () => {
    renderItemPage('/inventory/no-such-item')

    expect(screen.getByRole('heading', { name: 'Item not found' })).toBeInTheDocument()
    expect(screen.getByText(/There is no item with the id/)).toBeInTheDocument()
  })
})

describe('ItemPage — create mode', () => {
  it('starts blank and editable, titled "New item"', () => {
    renderItemPage('/inventory/new', 'create')

    expect(screen.getByRole('heading', { name: 'New item' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Worth')).toHaveValue(0)
    expect(screen.getByRole('button', { name: 'Create item' })).toBeInTheDocument()
  })

  it('reports that creating an item is not wired up', async () => {
    const user = userEvent.setup()
    renderItemPage('/inventory/new', 'create')

    await user.type(screen.getByLabelText('Name'), 'Camping stove')
    await user.click(screen.getByRole('button', { name: 'Create item' }))

    expect(screen.getByRole('status')).toHaveTextContent('not wired up')
  })
})

describe('ItemPage — trading context', () => {
  it('shows no trade section without ?trade= in the URL', () => {
    renderItemPage('/inventory/item-1')

    expect(screen.queryByRole('button', { name: 'Add to offer' })).toBeNull()
  })

  it('adds itself to the offer, session-locally, and links back to Inventory for the trade', async () => {
    const user = userEvent.setup()
    renderItemPage('/inventory/item-1?trade=trade-1')

    expect(screen.getByText('Trading with Lena K.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add to offer' }))

    expect(screen.getByRole('button', { name: 'Added to your offer' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent("Inventory's transfer box")
    expect(screen.getByRole('link', { name: 'Open Inventory for this trade' })).toHaveAttribute(
      'href',
      '/inventory?trade=trade-1',
    )
  })

  it('ignores an unknown trade id and shows the plain item page', () => {
    renderItemPage('/inventory/item-1?trade=no-such-trade')

    expect(screen.queryByRole('button', { name: 'Add to offer' })).toBeNull()
  })
})
