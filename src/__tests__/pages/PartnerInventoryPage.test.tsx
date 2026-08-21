import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { PartnerInventoryPage } from '../../pages/PartnerInventoryPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

function renderPartnerInventoryPage(route = '/inventory/partner?trade=trade-1') {
  renderWithRouter(<PartnerInventoryPage />, { route })
}

describe('PartnerInventoryPage', () => {
  it('names the partner and shows only her public items', () => {
    renderPartnerInventoryPage()

    expect(screen.getByRole('heading', { name: "Lena K.'s inventory" })).toBeInTheDocument()
    expect(screen.getByText('Amplifier')).toBeInTheDocument()
    expect(screen.getByText('Capo')).toBeInTheDocument()
  })

  it('never shows a private item, even by name', () => {
    renderPartnerInventoryPage()

    expect(screen.queryByText('Private box')).toBeNull()
    expect(screen.queryByLabelText('Private box')).toBeNull()
  })

  it('renders tiles as read-only — no click affordance on any of them', () => {
    renderPartnerInventoryPage()

    expect(screen.queryByRole('button', { name: /^Amplifier/ })).toBeNull()
    expect(screen.getByRole('img', { name: /^Amplifier/ })).toBeInTheDocument()
  })

  it('shows a single "N★" rating badge on each tile, same as your own Inventory (direct feedback)', () => {
    renderPartnerInventoryPage()

    // Amplifier (p-item-1, mockInventory.ts) is rated 4, worth 5 hours.
    const tile = screen.getByRole('img', { name: 'Amplifier, rated 4 out of 5, worth 5h' })
    expect(within(tile).getByText('4★')).toBeInTheDocument()
  })

  it('shows a "Nh" worth badge on each tile ("Items worth")', () => {
    renderPartnerInventoryPage()

    // Amplifier (p-item-1, mockInventory.ts) is worth 5 hours.
    const tile = screen.getByRole('img', { name: 'Amplifier, rated 4 out of 5, worth 5h' })
    expect(within(tile).getByText('5h')).toBeInTheDocument()
  })

  it('links back to the trade it was opened from', () => {
    renderPartnerInventoryPage()

    expect(screen.getByRole('link', { name: 'Back to trading' })).toHaveAttribute(
      'href',
      '/trading/trade-1',
    )
  })

  it('shows a way back instead of crashing when no trade is given', () => {
    renderPartnerInventoryPage('/inventory/partner')

    expect(screen.getByRole('heading', { name: 'Trade not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to trades' })).toHaveAttribute('href', '/trades')
  })

  it('shows a way back instead of crashing on an unknown trade id', () => {
    renderPartnerInventoryPage('/inventory/partner?trade=no-such-trade')

    expect(screen.getByRole('heading', { name: 'Trade not found' })).toBeInTheDocument()
  })
})
