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
export const trading = (tradeId: string) => `/trading/${tradeId}`
export const finalReview = (tradeId: string) => `/trades/${tradeId}/review`

/** Inventory in a trading context (§6): the same page, which gains a drop area and Accept /
 *  Back-to-trading buttons when it knows which trade you're building an offer for. */
export const inventoryForTrade = (tradeId: string) => `${ROUTES.inventory}?trade=${tradeId}`

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
