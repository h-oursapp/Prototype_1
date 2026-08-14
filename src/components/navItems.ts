import { ROUTES } from '../routes'

export type NavKey = 'wallet' | 'profile' | 'community' | 'trades' | 'inventory' | 'home' | 'settings'

export interface NavItem {
  key: NavKey
  label: string
  icon: string
  path: string
}

/** The nav bar's buttons, in the order the Appkarte §3 lists them. */
export const NAV_ITEMS: NavItem[] = [
  { key: 'wallet', label: 'Hours', icon: '⏱️', path: ROUTES.wallet },
  { key: 'profile', label: 'Profile', icon: '👤', path: ROUTES.profile },
  { key: 'community', label: 'Community', icon: '👥', path: ROUTES.community },
  { key: 'trades', label: 'Trades', icon: '🔄', path: ROUTES.trades },
  { key: 'inventory', label: 'Inventory', icon: '📦', path: ROUTES.inventory },
  { key: 'home', label: 'Home', icon: '🏠', path: ROUTES.home },
  // Not in the Appkarte's nav list (Settings sits behind Profile there) — kept on the bar from
  // the previous prototype pass, since it's the fastest way to reach the grid-size switch.
  { key: 'settings', label: 'Settings', icon: '⚙️', path: ROUTES.settings },
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
