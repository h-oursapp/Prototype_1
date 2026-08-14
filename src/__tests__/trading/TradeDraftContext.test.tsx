import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TradeDraftProvider } from '../../trading/TradeDraftContext'
import { useTradeDraft } from '../../trading/useTradeDraft'

function Probe({ tradeId }: { tradeId: string }) {
  const { getOfferedItemIds, toggleItem, removeItem, clearItems } = useTradeDraft()
  const offered = getOfferedItemIds(tradeId)
  return (
    <div>
      <span data-testid={`offered-${tradeId}`}>{offered.join(',')}</span>
      <button onClick={() => toggleItem(tradeId, 'item-1')}>toggle item-1 on {tradeId}</button>
      <button onClick={() => toggleItem(tradeId, 'item-2')}>toggle item-2 on {tradeId}</button>
      <button onClick={() => removeItem(tradeId, 'item-1')}>remove item-1 on {tradeId}</button>
      <button onClick={() => clearItems(tradeId)}>clear {tradeId}</button>
    </div>
  )
}

describe('TradeDraftProvider', () => {
  it('starts with no offered items for a trade that has never been touched', () => {
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" />
      </TradeDraftProvider>,
    )
    expect(screen.getByTestId('offered-trade-1')).toHaveTextContent('')
  })

  it('toggles an item on and off', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" />
      </TradeDraftProvider>,
    )

    await user.click(screen.getByText('toggle item-1 on trade-1'))
    expect(screen.getByTestId('offered-trade-1')).toHaveTextContent('item-1')

    await user.click(screen.getByText('toggle item-2 on trade-1'))
    expect(screen.getByTestId('offered-trade-1')).toHaveTextContent('item-1,item-2')

    await user.click(screen.getByText('toggle item-1 on trade-1'))
    expect(screen.getByTestId('offered-trade-1')).toHaveTextContent('item-2')
  })

  it('removes a specific item regardless of toggle state', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" />
      </TradeDraftProvider>,
    )

    await user.click(screen.getByText('toggle item-1 on trade-1'))
    await user.click(screen.getByText('toggle item-2 on trade-1'))
    await user.click(screen.getByText('remove item-1 on trade-1'))

    expect(screen.getByTestId('offered-trade-1')).toHaveTextContent('item-2')
  })

  it('clears every offered item for a trade', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" />
      </TradeDraftProvider>,
    )

    await user.click(screen.getByText('toggle item-1 on trade-1'))
    await user.click(screen.getByText('toggle item-2 on trade-1'))
    await user.click(screen.getByText('clear trade-1'))

    expect(screen.getByTestId('offered-trade-1')).toHaveTextContent('')
  })

  it('keeps each trade’s offered items separate', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" />
        <Probe tradeId="trade-2" />
      </TradeDraftProvider>,
    )

    await user.click(screen.getByText('toggle item-1 on trade-1'))

    expect(screen.getByTestId('offered-trade-1')).toHaveTextContent('item-1')
    expect(screen.getByTestId('offered-trade-2')).toHaveTextContent('')
  })

  it('throws when used outside a TradeDraftProvider', () => {
    // Swallow the expected console.error React logs for the thrown-during-render case.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe tradeId="trade-1" />)).toThrow(
      'useTradeDraft must be used within a TradeDraftProvider',
    )
    spy.mockRestore()
  })
})
