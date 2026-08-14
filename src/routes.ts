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
/** Plain by default; `{ quick: true }` is TODO #13's Quick Buy path — it preloads the ad's listed
 *  hours as your offer and opens the trade's chat already expanded, instead of landing on the
 *  same blank trading table "Open trading window" does. */
export const trading = (tradeId: string, opts?: { quick?: boolean }) =>
  opts?.quick ? `/trading/${tradeId}?quick=1` : `/trading/${tradeId}`
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
 *  trade it's for. Nothing links here yet (wiring an ad's "choose a skill" step is TODO #8), but
 *  the Skills page already responds to it. */
export const skillsForTrade = (tradeId: string) => `${ROUTES.skills}?trade=${tradeId}`

/** Trades filtered to "already reviewed" (closed) trades (TODO #5/#7), optionally narrowed to one
 *  skill. One builder covers both: Profile's "reviewed trades" button omits skillId, the Skill
 *  page's "all reviewed trades" button passes its own id. */
export const reviewedTrades = (skillId?: string) =>
  skillId ? `${ROUTES.trades}?status=closed&skill=${skillId}` : `${ROUTES.trades}?status=closed`
