import { useState, type ReactNode } from 'react'
import { TradeDraftContext } from './tradeDraftContextInstance'

/** Which items you've put on the table for a trade, shared across pages.
 *
 *  Every other piece of trade-building state (hours, which skills are offered) lives entirely on
 *  TradingPage itself, because nothing else ever needs to change it. Items are the one exception:
 *  TODO feedback asked for item-picking to happen on Inventory's own page (reached via an "Add
 *  items" button), then round-trip back to Trading's table — so the offered item ids have to
 *  survive a real navigation, not just live in TradingPage's local state. This is the smallest
 *  store that does that: one `Record<tradeId, itemIds>` in memory, gone on reload, exactly like
 *  every other piece of trade state in this prototype. Modelled after SettingsContext's own
 *  provider/instance/hook split (src/settings/), just without the localStorage persistence
 *  Settings needs and this doesn't. */
export function TradeDraftProvider({ children }: { children: ReactNode }) {
  const [offeredItemsByTrade, setOfferedItemsByTrade] = useState<Record<string, string[]>>({})

  const getOfferedItemIds = (tradeId: string) => offeredItemsByTrade[tradeId] ?? []

  const toggleItem = (tradeId: string, itemId: string) => {
    setOfferedItemsByTrade((current) => {
      const offered = current[tradeId] ?? []
      const next = offered.includes(itemId) ? offered.filter((id) => id !== itemId) : [...offered, itemId]
      return { ...current, [tradeId]: next }
    })
  }

  const removeItem = (tradeId: string, itemId: string) => {
    setOfferedItemsByTrade((current) => ({
      ...current,
      [tradeId]: (current[tradeId] ?? []).filter((id) => id !== itemId),
    }))
  }

  const clearItems = (tradeId: string) => {
    setOfferedItemsByTrade((current) => ({ ...current, [tradeId]: [] }))
  }

  return (
    <TradeDraftContext.Provider value={{ getOfferedItemIds, toggleItem, removeItem, clearItems }}>
      {children}
    </TradeDraftContext.Provider>
  )
}
