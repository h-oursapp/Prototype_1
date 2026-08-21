import { useState, type ReactNode } from 'react'
import { TradeDraftContext } from './tradeDraftContextInstance'

/** One insertion-ordered list of ids per trade — items and skills share this exact shape (see
 *  tradeDraftContextInstance.ts's own comment on why they're two separate lists rather than one
 *  combined one). A small custom hook rather than two hand-written copies of the same four
 *  functions, now that there are two real callers for it. */
function useIdListState() {
  const [idsByTrade, setIdsByTrade] = useState<Record<string, string[]>>({})

  const getIds = (tradeId: string) => idsByTrade[tradeId] ?? []

  const toggleId = (tradeId: string, id: string) => {
    setIdsByTrade((current) => {
      const offered = current[tradeId] ?? []
      const next = offered.includes(id) ? offered.filter((existing) => existing !== id) : [...offered, id]
      return { ...current, [tradeId]: next }
    })
  }

  const removeId = (tradeId: string, id: string) => {
    setIdsByTrade((current) => ({
      ...current,
      [tradeId]: (current[tradeId] ?? []).filter((existing) => existing !== id),
    }))
  }

  const clearIds = (tradeId: string) => {
    setIdsByTrade((current) => ({ ...current, [tradeId]: [] }))
  }

  return { getIds, toggleId, removeId, clearIds }
}

/** Which items and skills you've put on the table for a trade, shared across pages.
 *
 *  Items were the first exception to "everything else lives on TradingPage itself": TODO feedback
 *  asked for item-picking to happen on Inventory's own page (reached via an "Add items" button),
 *  then round-trip back to Trading's table — so the offered item ids have to survive a real
 *  navigation, not just live in TradingPage's local state. Skills followed the same path once
 *  direct feedback asked Inventory's own Skills view for the same "inspect / add" behaviour items
 *  already had. Hours are a separate exception again (TODO #9.1/#11): Inventory's new
 *  trading-table overlay has to show "the already filled in items, including the time on offer"
 *  and let its own Time tile adjust that same number, so it can no longer be TradingPage's local
 *  state either. All of it lives in the same shape of store — one `Record<tradeId, ...>` per piece
 *  of state, in memory, gone on reload, exactly like every other piece of trade state in this
 *  prototype. Modelled after SettingsContext's own provider/instance/hook split (src/settings/),
 *  just without the localStorage persistence Settings needs and this doesn't. */
export function TradeDraftProvider({ children }: { children: ReactNode }) {
  const items = useIdListState()
  const skills = useIdListState()
  const [hoursByTrade, setHoursByTrade] = useState<Record<string, number>>({})
  const [isTimeOfferedByTrade, setIsTimeOfferedByTrade] = useState<Record<string, boolean>>({})

  // See tradeDraftContextInstance.ts's own comment on why both of these take a fallback.
  const getOfferedHours = (tradeId: string, fallback: number) => hoursByTrade[tradeId] ?? fallback
  const setOfferedHours = (tradeId: string, hours: number) => {
    setHoursByTrade((current) => ({ ...current, [tradeId]: hours }))
  }
  const getIsTimeOffered = (tradeId: string, fallback: boolean) => isTimeOfferedByTrade[tradeId] ?? fallback
  const setTimeOffered = (tradeId: string, isOffered: boolean) => {
    setIsTimeOfferedByTrade((current) => ({ ...current, [tradeId]: isOffered }))
  }

  const resetOffer = (tradeId: string, defaultHours: number) => {
    items.clearIds(tradeId)
    skills.clearIds(tradeId)
    setOfferedHours(tradeId, defaultHours)
    setTimeOffered(tradeId, false)
  }

  return (
    <TradeDraftContext.Provider
      value={{
        getOfferedItemIds: items.getIds,
        toggleItem: items.toggleId,
        removeItem: items.removeId,
        clearItems: items.clearIds,
        getOfferedSkillIds: skills.getIds,
        toggleSkill: skills.toggleId,
        removeSkill: skills.removeId,
        clearSkills: skills.clearIds,
        getOfferedHours,
        setOfferedHours,
        getIsTimeOffered,
        setTimeOffered,
        resetOffer,
      }}
    >
      {children}
    </TradeDraftContext.Provider>
  )
}
