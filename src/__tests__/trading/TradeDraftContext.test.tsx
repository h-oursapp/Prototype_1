import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TradeDraftProvider } from '../../trading/TradeDraftContext'
import { useTradeDraft } from '../../trading/useTradeDraft'

function Probe({ tradeId, timeFallback = false }: { tradeId: string; timeFallback?: boolean }) {
  const {
    getOfferedItemIds,
    toggleItem,
    removeItem,
    clearItems,
    getOfferedSkillIds,
    toggleSkill,
    removeSkill,
    clearSkills,
    getOfferedHours,
    setOfferedHours,
    getIsTimeOffered,
    setTimeOffered,
    resetOffer,
  } = useTradeDraft()
  const offered = getOfferedItemIds(tradeId)
  const offeredSkills = getOfferedSkillIds(tradeId)
  return (
    <div>
      <span data-testid={`offered-${tradeId}`}>{offered.join(',')}</span>
      <span data-testid={`offered-skills-${tradeId}`}>{offeredSkills.join(',')}</span>
      <span data-testid={`hours-${tradeId}`}>{getOfferedHours(tradeId, 9)}</span>
      <span data-testid={`time-offered-${tradeId}`}>{String(getIsTimeOffered(tradeId, timeFallback))}</span>
      <button onClick={() => toggleItem(tradeId, 'item-1')}>toggle item-1 on {tradeId}</button>
      <button onClick={() => toggleItem(tradeId, 'item-2')}>toggle item-2 on {tradeId}</button>
      <button onClick={() => removeItem(tradeId, 'item-1')}>remove item-1 on {tradeId}</button>
      <button onClick={() => clearItems(tradeId)}>clear {tradeId}</button>
      <button onClick={() => toggleSkill(tradeId, 'skill-1')}>toggle skill-1 on {tradeId}</button>
      <button onClick={() => toggleSkill(tradeId, 'skill-2')}>toggle skill-2 on {tradeId}</button>
      <button onClick={() => removeSkill(tradeId, 'skill-1')}>remove skill-1 on {tradeId}</button>
      <button onClick={() => clearSkills(tradeId)}>clear skills on {tradeId}</button>
      <button onClick={() => setOfferedHours(tradeId, 5)}>set hours to 5 on {tradeId}</button>
      <button onClick={() => setTimeOffered(tradeId, false)}>remove time on {tradeId}</button>
      <button onClick={() => setTimeOffered(tradeId, true)}>add time back on {tradeId}</button>
      <button onClick={() => resetOffer(tradeId, 9)}>reset {tradeId}</button>
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

  it('toggles a skill on and off, independently of the items list (direct feedback)', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" />
      </TradeDraftProvider>,
    )

    await user.click(screen.getByText('toggle skill-1 on trade-1'))
    expect(screen.getByTestId('offered-skills-trade-1')).toHaveTextContent('skill-1')
    expect(screen.getByTestId('offered-trade-1')).toHaveTextContent('')

    await user.click(screen.getByText('toggle skill-2 on trade-1'))
    expect(screen.getByTestId('offered-skills-trade-1')).toHaveTextContent('skill-1,skill-2')

    await user.click(screen.getByText('toggle skill-1 on trade-1'))
    expect(screen.getByTestId('offered-skills-trade-1')).toHaveTextContent('skill-2')
  })

  it('removes a specific skill regardless of toggle state', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" />
      </TradeDraftProvider>,
    )

    await user.click(screen.getByText('toggle skill-1 on trade-1'))
    await user.click(screen.getByText('toggle skill-2 on trade-1'))
    await user.click(screen.getByText('remove skill-1 on trade-1'))

    expect(screen.getByTestId('offered-skills-trade-1')).toHaveTextContent('skill-2')
  })

  it('clears every offered skill for a trade, and keeps skills separate per trade', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" />
        <Probe tradeId="trade-2" />
      </TradeDraftProvider>,
    )

    await user.click(screen.getByText('toggle skill-1 on trade-1'))
    expect(screen.getByTestId('offered-skills-trade-2')).toHaveTextContent('')

    await user.click(screen.getByText('clear skills on trade-1'))
    expect(screen.getByTestId('offered-skills-trade-1')).toHaveTextContent('')
  })

  it('falls back to the caller-supplied default until hours are explicitly set (TODO #9.1/#11)', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" />
      </TradeDraftProvider>,
    )

    expect(screen.getByTestId('hours-trade-1')).toHaveTextContent('9')

    await user.click(screen.getByText('set hours to 5 on trade-1'))
    expect(screen.getByTestId('hours-trade-1')).toHaveTextContent('5')
  })

  it('falls back to the caller-supplied default for the Time toggle too, until it is explicitly set', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" timeFallback={false} />
        <Probe tradeId="trade-2" timeFallback={true} />
      </TradeDraftProvider>,
    )

    // Untouched, each trade just reflects whatever its own caller passed in — e.g. TradingPage's
    // plain-open (false) vs quick-offer (true) fallback.
    expect(screen.getByTestId('time-offered-trade-1')).toHaveTextContent('false')
    expect(screen.getByTestId('time-offered-trade-2')).toHaveTextContent('true')

    await user.click(screen.getByText('add time back on trade-1'))
    expect(screen.getByTestId('time-offered-trade-1')).toHaveTextContent('true')

    await user.click(screen.getByText('remove time on trade-1'))
    expect(screen.getByTestId('time-offered-trade-1')).toHaveTextContent('false')
  })

  it('keeps hours and the Time toggle separate per trade, same as the items list', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" timeFallback={true} />
        <Probe tradeId="trade-2" timeFallback={true} />
      </TradeDraftProvider>,
    )

    await user.click(screen.getByText('set hours to 5 on trade-1'))
    await user.click(screen.getByText('remove time on trade-1'))

    expect(screen.getByTestId('hours-trade-1')).toHaveTextContent('5')
    expect(screen.getByTestId('hours-trade-2')).toHaveTextContent('9')
    expect(screen.getByTestId('time-offered-trade-1')).toHaveTextContent('false')
    expect(screen.getByTestId('time-offered-trade-2')).toHaveTextContent('true')
  })

  it('resetOffer clears the items and skills, restores the default hours, and puts Time back to being a suggestion (direct feedback)', async () => {
    const user = userEvent.setup()
    render(
      <TradeDraftProvider>
        <Probe tradeId="trade-1" timeFallback={true} />
      </TradeDraftProvider>,
    )

    await user.click(screen.getByText('toggle item-1 on trade-1'))
    await user.click(screen.getByText('toggle skill-1 on trade-1'))
    await user.click(screen.getByText('set hours to 5 on trade-1'))

    await user.click(screen.getByText('reset trade-1'))

    expect(screen.getByTestId('offered-trade-1')).toHaveTextContent('')
    expect(screen.getByTestId('offered-skills-trade-1')).toHaveTextContent('')
    expect(screen.getByTestId('hours-trade-1')).toHaveTextContent('9')
    // Not the caller's own true fallback any more — resetOffer explicitly sets this to false,
    // so the trade reads exactly like a fresh, never-touched one again.
    expect(screen.getByTestId('time-offered-trade-1')).toHaveTextContent('false')
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
