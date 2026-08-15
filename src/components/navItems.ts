import { ROUTES } from '../routes'

export type NavKey = 'wallet' | 'profile' | 'home' | 'community' | 'trades' | 'inventory'

export interface NavItem {
  key: NavKey
  label: string
  /** No icon for Hours (TODO #4) — its big "10h15m"-style number reads on its own, so this is
   *  optional and simply omitted for that one item. */
  icon?: string
  path: string
  /** Roughly twice the width of a regular item — Hours needs the room for "10h15m", not just a
   *  couple of digits (TODO #4: "time part doesn't need to be a square ... it can take up 2
   *  positions"). */
  wide?: boolean
}

/** The nav bar's buttons (TODO #4 reworks the Appkarte §3 list): Settings has moved off the bar
 *  entirely — it's reachable from Profile's own header instead (see ProfilePage) — and Home now
 *  sits in the middle of what's left, rather than at the end. */
export const NAV_ITEMS: NavItem[] = [
  { key: 'wallet', label: 'Hours', path: ROUTES.wallet, wide: true },
  { key: 'profile', label: 'Profile', icon: '👤', path: ROUTES.profile },
  { key: 'home', label: 'Home', icon: '🏠', path: ROUTES.home },
  { key: 'community', label: 'Community', icon: '👥', path: ROUTES.community },
  { key: 'trades', label: 'Trades', icon: '🔄', path: ROUTES.trades },
  { key: 'inventory', label: 'Inventory', icon: '📦', path: ROUTES.inventory },
]

/** Which nav button should read as current for a given URL.
 *  Sub-pages light up their section: /trades/7/review is still "Trades". Home matches only
 *  exactly, otherwise its "/" prefix would match every path in the app. */
export function activeNavKey(pathname: string): NavKey | null {
  if (pathname === ROUTES.home) return 'home'

  const match = NAV_ITEMS.find(
    (item) => item.path !== ROUTES.home && (pathname === item.path || pathname.startsWith(`${item.path}/`)),
  )
  return match?.key ?? null
}
