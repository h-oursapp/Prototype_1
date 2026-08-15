import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TransferBox } from '../../components/TransferBox'
import { renderWithRouter } from '../helpers/renderWithRouter'

/** Standing in for the trading context's usual props, the same shape SkillsPage/InventoryPage
 *  pass — most tests only care about a detail unrelated to backTo/primaryLabel themselves. */
const TRADE_PROPS = {
  noun: 'item',
  pickActionLabel: 'Add to offer',
  backTo: { label: 'Back to trading', path: '/trading/trade-1' },
  primaryLabel: 'Accept',
}

describe('TransferBox', () => {
  it('shows an empty message when nothing has been added yet', () => {
    renderWithRouter(
      <TransferBox items={[]} {...TRADE_PROPS} onRemove={vi.fn()} onPrimary={vi.fn()} />,
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
        {...TRADE_PROPS}
        onRemove={onRemove}
        onPrimary={vi.fn()}
      />,
    )

    expect(screen.getByText('Drill')).toBeInTheDocument()
    expect(screen.getByText('Ladder')).toBeInTheDocument()
    expect(screen.getByText('Private')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove Ladder from your offer' }))
    expect(onRemove).toHaveBeenCalledWith('item-2')
  })

  it('names the picking control in the drag-and-drop note', () => {
    renderWithRouter(
      <TransferBox
        items={[]}
        noun="skill"
        pickActionLabel="Use for this ad"
        backTo={{ label: 'Back to new ad', path: '/ads/new' }}
        primaryLabel="Use this skill"
        onRemove={vi.fn()}
        onPrimary={vi.fn()}
      />,
    )

    expect(screen.getByText(/use "Use for this ad" on a skill above/)).toBeInTheDocument()
  })

  it('calls onPrimary and can show a confirmed message underneath', async () => {
    const user = userEvent.setup()
    const onPrimary = vi.fn()
    renderWithRouter(
      <TransferBox
        items={[{ id: 'skill-1', name: 'Piano', icon: '🎹' }]}
        {...TRADE_PROPS}
        onRemove={vi.fn()}
        onPrimary={onPrimary}
        confirmedMessage="Offer accepted: 1 skill for the trade with Lena K."
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Accept' }))
    expect(onPrimary).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Offer accepted: 1 skill for the trade with Lena K.',
    )
  })

  it('shows no confirmed message when the caller has nothing to confirm in place', () => {
    renderWithRouter(<TransferBox items={[]} {...TRADE_PROPS} onRemove={vi.fn()} onPrimary={vi.fn()} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('disables the primary button when told to, e.g. before anything has been picked', () => {
    renderWithRouter(
      <TransferBox items={[]} {...TRADE_PROPS} onRemove={vi.fn()} onPrimary={vi.fn()} primaryDisabled />,
    )

    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled()
  })

  it('links back wherever backTo points, worded by the caller', () => {
    renderWithRouter(
      <TransferBox
        items={[]}
        noun="item"
        pickActionLabel="Add to offer"
        backTo={{ label: 'Back to trading', path: '/trading/trade-7' }}
        primaryLabel="Accept"
        onRemove={vi.fn()}
        onPrimary={vi.fn()}
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
        {...TRADE_PROPS}
        onRemove={vi.fn()}
        onPrimary={vi.fn()}
        extraNote={<p>Still private: 1 of 2.</p>}
      />,
    )

    expect(screen.getByText('Still private: 1 of 2.')).toBeInTheDocument()
  })
})
