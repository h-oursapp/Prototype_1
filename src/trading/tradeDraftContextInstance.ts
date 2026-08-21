import { createContext } from 'react'

/** One trade's worth of "what have I put on the table" state — item ids, skill ids (direct
 *  feedback: "skills should have the inspect / add behaviour" too, on Inventory's own Skills
 *  view), plus (TODO #9.1/#11) the hours on offer and whether the Time tile is on the table at
 *  all — see TradeDraftContext.tsx's file comment for the fuller history of what moved here and
 *  why. Keyed by trade id so more than one trade's draft can exist at once without colliding.
 *
 *  Items and skills are two separate insertion-ordered lists, not one combined one — simpler, and
 *  a real "keep their positions" story within each kind, but it does mean the two kinds are always
 *  grouped (every offered item, then every offered skill) in whatever shows their combined order
 *  (Inventory's own trading-table overlay), rather than perfectly interleaved by the moment each
 *  one was actually added. Flagged rather than solved with a single combined list: nothing before
 *  this round ever needed cross-kind ordering at all (skills never reached a shared draft before —
 *  see TradingPage.tsx's own file banner comment on that gap), so there's no existing behaviour a
 *  combined list would need to preserve, only new behaviour to keep simple.
 *
 *  TradingPage's own grid still doesn't read any of the skill state below — that page's "which
 *  items/skills the partner puts up isn't modelled beyond their Time tile" gap (its own file
 *  comment) is unchanged; this round only reaches Inventory's own Skills view and trading-table
 *  overlay, per the request that asked for it.
 *
 *  `getOfferedHours` and `getIsTimeOffered` both take a `fallback` rather than defaulting to one
 *  fixed value — the right "untouched" default for each depends on context the context itself has
 *  no way to know: TradingPage's own fallback hours depend on whether this is a quick offer
 *  (TODO #8's `?hours=`), and (direct feedback) whether Time starts *offered at all* now depends on
 *  that same thing — "opening the trading window, the time should just be a suggestion... except
 *  if its a quick buy, than its already pre filled." A plain open passes `false` (Time starts as a
 *  suggestion); a quick offer passes `true` (already active, pre-filled). Inventory's own overlay
 *  has no notion of quick offers at all, so it always passes `false` — nothing there should ever
 *  show a suggestion that isn't really on the table (TODO #9.1: "when its a suggestion it
 *  shouldn't show up on the inventory"). The context itself just remembers whatever was last
 *  explicitly set, with no opinion of its own about what "untouched" should look like. */
export interface TradeDraftContextValue {
  getOfferedItemIds: (tradeId: string) => string[]
  toggleItem: (tradeId: string, itemId: string) => void
  removeItem: (tradeId: string, itemId: string) => void
  clearItems: (tradeId: string) => void
  getOfferedSkillIds: (tradeId: string) => string[]
  toggleSkill: (tradeId: string, skillId: string) => void
  removeSkill: (tradeId: string, skillId: string) => void
  clearSkills: (tradeId: string) => void
  getOfferedHours: (tradeId: string, fallback: number) => number
  setOfferedHours: (tradeId: string, hours: number) => void
  getIsTimeOffered: (tradeId: string, fallback: boolean) => boolean
  setTimeOffered: (tradeId: string, isOffered: boolean) => void
  /** "Declined" (TODO #13): clears the items and skills, and puts Time back to being a suggestion
   *  again, same "back to a blank slate" reset TradingPage's own decline() and Inventory overlay's
   *  decline both need — pulled out here once there were two real call sites for the exact same
   *  reset. Direct
   *  feedback on Time specifically ("if its removed make it a suggestion again") is why this now
   *  resets `isTimeOffered` to `false` rather than `true` — a declined offer goes back to looking
   *  exactly like a freshly-opened one, not straight back to an active default. `defaultHours` is
   *  mostly cosmetic once that's true (a suggestion always reads "1 hour" regardless of the stored
   *  number — see TradingPage.tsx's own comment on its suggested-time tile), but is kept so the
   *  number underneath is still something sane if Time is ever re-added without an explicit amount. */
  resetOffer: (tradeId: string, defaultHours: number) => void
}

/** Split into its own file so components can import just the type/context, the same layout
 *  settingsContextInstance.ts uses — keeps TradeDraftContext.tsx free to change its provider
 *  implementation without ever changing what callers import from here. */
export const TradeDraftContext = createContext<TradeDraftContextValue | undefined>(undefined)
