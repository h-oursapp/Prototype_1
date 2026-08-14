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
  trades: '/trades',
  finalReview: '/trades/:tradeId/review',
  community: '/community',
  settings: '/settings',
  legal: '/legal',
} as const

/** Builders for the routes that carry an id, so callers never string-concatenate a URL. */
export const adDetail = (adId: string) => `/ads/${adId}`
export const trading = (tradeId: string) => `/trading/${tradeId}`
export const finalReview = (tradeId: string) => `/trades/${tradeId}/review`

/** Inventory in a trading context (§6): the same page, which gains a drop area and Accept /
 *  Back-to-trading buttons when it knows which trade you're building an offer for. */
export const inventoryForTrade = (tradeId: string) => `${ROUTES.inventory}?trade=${tradeId}`
