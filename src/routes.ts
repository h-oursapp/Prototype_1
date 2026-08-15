/** Every screen's URL in one place, so no component hardcodes a path string.
 *  Section numbers refer to the h_OURs Appkarte (Aug 2026, v1). */
export const ROUTES = {
  login: '/login',
  onboarding: '/onboarding',
  home: '/',
  offers: '/offers',
  search: '/search',
  /** Ad detail doubles as create/modify (§5) — ':adId' is the literal pattern, see adDetail(). */
  adDetail: '/ads/:adId',
  adCreate: '/ads/new',
  trading: '/trading/:tradeId',
  inventory: '/inventory',
  /** Item detail doubles as create/modify (TODO #10), same pattern as adDetail/skillDetail —
   *  ':itemId' is the literal pattern, see itemDetail(). Nested under /inventory rather than a
   *  sibling top-level route, the same way skillDetail sits under /skills. */
  itemDetail: '/inventory/:itemId',
  itemCreate: '/inventory/new',
  /** A trading partner's own inventory, read-only and filtered to public items — reached from
   *  Trading's "Open her inventory" button. Always needs `?trade=`, same convention as
   *  inventoryForTrade below, since the partner's name and the "back to trading" link both come
   *  from the trade, not from the route itself. */
  partnerInventory: '/inventory/partner',
  wallet: '/wallet',
  profile: '/profile',
  skills: '/skills',
  /** Skill detail doubles as create/modify (§7), same pattern as adDetail — ':skillId' is the
   *  literal pattern, see skillDetail(). */
  skillDetail: '/skills/:skillId',
  skillCreate: '/skills/new',
  trades: '/trades',
  finalReview: '/trades/:tradeId/review',
  community: '/community',
  settings: '/settings',
  legal: '/legal',
} as const

/** Builders for the routes that carry an id, so callers never string-concatenate a URL. */
export const adDetail = (adId: string) => `/ads/${adId}`
export const skillDetail = (skillId: string) => `/skills/${skillId}`
export const itemDetail = (itemId: string) => `/inventory/${itemId}`
/** Plain by default; `{ quick: true }` is TODO #13's Quick Buy path — it opens the trade's chat
 *  already expanded instead of landing on the same blank trading table "Open trading window"
 *  does. `hours` (TODO #8) carries the ad's listed price through so the trading table starts
 *  showing that offer rather than your usual default — AdDetailPage's Quick Buy is the only
 *  caller that passes it. */
export const trading = (tradeId: string, opts?: { quick?: boolean; hours?: number }) => {
  const params = new URLSearchParams()
  if (opts?.quick) params.set('quick', '1')
  if (opts?.hours !== undefined) params.set('hours', String(opts.hours))
  const query = params.toString()
  return query ? `/trading/${tradeId}?${query}` : `/trading/${tradeId}`
}
export const finalReview = (tradeId: string) => `/trades/${tradeId}/review`

/** Inventory in a trading context (§6): the same page, which gains a drop area and Accept /
 *  Back-to-trading buttons when it knows which trade you're building an offer for. */
export const inventoryForTrade = (tradeId: string) => `${ROUTES.inventory}?trade=${tradeId}`

/** A trading partner's public inventory for one trade — see ROUTES.partnerInventory. */
export const partnerInventoryForTrade = (tradeId: string) => `${ROUTES.partnerInventory}?trade=${tradeId}`

/** An item's own page in a trading context (TODO #10): same convention as inventoryForTrade —
 *  the page gains an "Add to offer" action once it knows which trade it's for. Reaching Inventory's
 *  own grid while picking for a trade adds an item directly (there's no spare room for a second
 *  "view details" control per tile in a page that can't scroll — see InventoryPage.tsx), so this
 *  is exercised directly against the query parameter for now, the same place SkillsPage's transfer
 *  box started out. */
export const itemForTrade = (itemId: string, tradeId: string) => `${itemDetail(itemId)}?trade=${tradeId}`

/** Skills in a trading context (§6/§8's transfer box): same query-parameter shape as
 *  inventoryForTrade — the page gains a "pick a skill for this offer" zone when it knows which
 *  trade it's for. */
export const skillsForTrade = (tradeId: string) => `${ROUTES.skills}?trade=${tradeId}`

/** Picking a skill or item for a brand-new ad (TODO #8) — the same query-parameter convention as
 *  skillsForTrade/inventoryForTrade above, but with no trade behind it: Skills/Inventory show a
 *  "picking for a new ad" banner and transfer box instead of a trading one, and cap the pick at
 *  one (an ad has exactly one subject, unlike a trade's open-ended offer). */
export const skillsForNewAd = () => `${ROUTES.skills}?forAd=new`
export const inventoryForNewAd = () => `${ROUTES.inventory}?forAd=new`

/** Where picking a skill/item for a new ad sends you back to, with the pick attached — read by
 *  AdDetailPage's create mode to seed the draft from the chosen skill/item (TODO #8). */
export const adCreateWithSkill = (skillId: string) => `${ROUTES.adCreate}?skillId=${skillId}`
export const adCreateWithItem = (itemId: string) => `${ROUTES.adCreate}?itemId=${itemId}`

/** Trades filtered to "already reviewed" (closed) trades (TODO #5/#7), optionally narrowed to one
 *  skill. One builder covers both: Profile's "reviewed trades" button omits skillId, the Skill
 *  page's "all reviewed trades" button passes its own id. */
export const reviewedTrades = (skillId?: string) =>
  skillId ? `${ROUTES.trades}?status=closed&skill=${skillId}` : `${ROUTES.trades}?status=closed`
