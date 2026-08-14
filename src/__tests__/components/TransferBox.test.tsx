import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TransferBox } from '../../components/TransferBox'
import { renderWithRouter } from '../helpers/renderWithRouter'

describe('TransferBox', () => {
  it('shows an empty message when nothing has been added yet', () => {
    renderWithRouter(
      <TransferBox
        items={[]}
        noun="item"
        pluralNoun="items"
        tradeId="trade-1"
        partnerName="Lena K."
        isAccepted={false}
        onRemove={vi.fn()}
        onAccept={vi.fn()}
      />,
    )

    expect(screen.getByText('Nothing in the offer yet.')).toBeInTheDocument()
  })

  it('lists offered items and calls onRemove for the one removed', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    renderWithRouter(
      <TransferBox
        items={[
          { id: 'item-1', name: 'Drill', icon: '🪛' },
          { id: 'item-2', name: 'Ladder', icon: '🪜', note: 'Private' },
        ]}
        noun="item"
        pluralNoun="items"
        tradeId="trade-1"
        partnerName="Lena K."
        isAccepted={false}
        onRemove={onRemove}
        onAccept={vi.fn()}
      />,
    )

    expect(screen.getByText('Drill')).toBeInTheDocument()
    expect(screen.getByText('Ladder')).toBeInTheDocument()
    expect(screen.getByText('Private')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove Ladder from your offer' }))
    expect(onRemove).toHaveBeenCalledWith('item-2')
  })

  it('calls onAccept and then shows the accepted message, pluralising the noun correctly', () => {
    renderWithRouter(
      <TransferBox
        items={[{ id: 'skill-1', name: 'Piano', icon: '🎹' }]}
        noun="skill"
        pluralNoun="skills"
        tradeId="trade-1"
        partnerName="Lena K."
        isAccepted
        onRemove={vi.fn()}
        onAccept={vi.fn()}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Offer accepted: 1 skill for the trade with Lena K.',
    )
  })

  it('links back to the trading page for this trade', () => {
    renderWithRouter(
      <TransferBox
        items={[]}
        noun="item"
        pluralNoun="items"
        tradeId="trade-7"
        partnerName="Lena K."
        isAccepted={false}
        onRemove={vi.fn()}
        onAccept={vi.fn()}
      />,
    )

    expect(screen.getByRole('link', { name: 'Back to trading' })).toHaveAttribute(
      'href',
      '/trading/trade-7',
    )
  })

  it('renders the optional extra note when given one', () => {
    renderWithRouter(
      <TransferBox
        items={[]}
        noun="item"
        pluralNoun="items"
        tradeId="trade-1"
        partnerName="Lena K."
        isAccepted={false}
        onRemove={vi.fn()}
        onAccept={vi.fn()}
        extraNote={<p>Still private: 1 of 2.</p>}
      />,
    )

    expect(screen.getByText('Still private: 1 of 2.')).toBeInTheDocument()
  })
})
