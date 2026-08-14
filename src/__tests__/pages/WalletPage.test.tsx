import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MOCK_WALLET } from '../../data/mockUser'
import { WalletPage } from '../../pages/WalletPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

describe('WalletPage', () => {
  it('shows available hours as the headline figure', () => {
    renderWithRouter(<WalletPage />)

    expect(screen.getByText('Available hours')).toBeInTheDocument()
    expect(screen.getByText(`${MOCK_WALLET.availableHours} h`)).toBeInTheDocument()
  })

  it('shows charity hours and the foundation as figures marked not-yet-specified', () => {
    renderWithRouter(<WalletPage />)

    expect(screen.getByText('Charity hours')).toBeInTheDocument()
    expect(screen.getByText(`${MOCK_WALLET.charityHours} h`)).toBeInTheDocument()
    expect(screen.getByText('Not specified yet')).toBeInTheDocument()
    expect(screen.getByText(/charity mechanics/i)).toBeInTheDocument()

    expect(screen.getByText('Foundation')).toBeInTheDocument()
    expect(screen.getByText(`${MOCK_WALLET.foundationHours} h`)).toBeInTheDocument()
    expect(screen.getByText('Not in scope yet')).toBeInTheDocument()
  })

  it('offers no control that would move hours or start a payment', () => {
    renderWithRouter(<WalletPage />)

    expect(
      screen.queryByRole('button', { name: /donate|transfer|move|send|top up|pay/i }),
    ).not.toBeInTheDocument()
  })

  it('shows the stored payment method as a storage location, not a payment flow', () => {
    renderWithRouter(<WalletPage />)

    expect(screen.getByText('Stored payment method')).toBeInTheDocument()
    expect(screen.getByText(MOCK_WALLET.paymentMethod)).toBeInTheDocument()
    expect(screen.getByText(/nothing here starts a payment/i)).toBeInTheDocument()
  })

  it('states the open point about where history and the payment flow went', () => {
    renderWithRouter(<WalletPage />)

    expect(screen.getByText(/never specified/i)).toBeInTheDocument()
  })
})
