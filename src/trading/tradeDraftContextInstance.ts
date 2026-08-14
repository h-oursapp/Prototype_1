import { createContext } from 'react'

/** One trade's worth of "what have I put on the table" state — currently just item ids, since
 *  skills and hours never leave the Trading page itself (see TradeDraftContext.tsx's file
 *  comment for why items are different). Keyed by trade id so more than one trade's draft can
 *  exist at once without colliding. */
export interface TradeDraftContextValue {
  getOfferedItemIds: (tradeId: string) => string[]
  toggleItem: (tradeId: string, itemId: string) => void
  removeItem: (tradeId: string, itemId: string) => void
  clearItems: (tradeId: string) => void
}

/** Split into its own file so components can import just the type/context, the same layout
 *  settingsContextInstance.ts uses — keeps TradeDraftContext.tsx free to change its provider
 *  implementation without ever changing what callers import from here. */
export const TradeDraftContext = createContext<TradeDraftContextValue | undefined>(undefined)
