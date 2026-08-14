import { useContext } from 'react'
import { TradeDraftContext, type TradeDraftContextValue } from './tradeDraftContextInstance'

export function useTradeDraft(): TradeDraftContextValue {
  const context = useContext(TradeDraftContext)
  if (!context) throw new Error('useTradeDraft must be used within a TradeDraftProvider')
  return context
}
