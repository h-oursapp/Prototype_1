import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { PartnerProfilePage } from '../../pages/PartnerProfilePage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

function renderPartnerProfilePage(route = '/profile/partner?trade=trade-1') {
  renderWithRouter(<PartnerProfilePage />, { route })
}

describe('PartnerProfilePage', () => {
  it("names and shows the partner's avatar, both taken from the trade", () => {
    renderPartnerProfilePage()

    expect(screen.getByRole('heading', { name: "Lena K.'s profile" })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lena K.' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: "Lena K.'s profile picture" })).toBeInTheDocument()
  })

  it('shows the same shared partner headline and rating regardless of which trade it was opened from', () => {
    renderPartnerProfilePage('/profile/partner?trade=trade-2')

    // trade-2's partner is Tomas R. — the surrounding name changes, the profile content
    // (MOCK_PARTNER_PROFILE) doesn't, same simplification PartnerInventoryPage already makes.
    expect(screen.getByRole('heading', { name: 'Tomas R.' })).toBeInTheDocument()
    expect(screen.getByText(/Trades hands-on help/)).toBeInTheDocument()
    expect(screen.getByText('5★ personal rating')).toBeInTheDocument()
  })

  it('links back to the trade it was opened from', () => {
    renderPartnerProfilePage()

    expect(screen.getByRole('link', { name: 'Back to trading' })).toHaveAttribute('href', '/trading/trade-1')
  })

  it('shows a way back instead of crashing when no trade is given', () => {
    renderPartnerProfilePage('/profile/partner')

    expect(screen.getByRole('heading', { name: 'Trade not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to trades' })).toHaveAttribute('href', '/trades')
  })

  it('shows a way back instead of crashing on an unknown trade id', () => {
    renderPartnerProfilePage('/profile/partner?trade=no-such-trade')

    expect(screen.getByRole('heading', { name: 'Trade not found' })).toBeInTheDocument()
  })
})
