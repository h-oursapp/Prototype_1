import { ROUTES } from '../routes'

/** The pages one tap from Home, whether from the nav bar or Home's own two grids. TODO #4: each
 *  one's back button always returns to Home, no matter how the user actually arrived, instead of
 *  retracing whatever the history stack happens to hold — e.g. jumping to Wallet from the nav
 *  bar's Hours button while deep in a trade shouldn't need several taps of Back to escape it.
 *  Every other page (ad/skill/item detail, trading, settings, ...) keeps the ordinary
 *  one-step-back behavior — TODO #4's own example: Your offers -> an offer's detail -> Back
 *  returns to Your offers, exactly what plain history-back already does.
 *
 *  Kept in its own module, not PageShell.tsx, so that file can still export only the component —
 *  React Fast Refresh needs a component-only file to hot-reload PageShell correctly. */
const TOP_LEVEL_ROUTES: readonly string[] = [
  ROUTES.wallet,
  ROUTES.profile,
  ROUTES.trades,
  ROUTES.inventory,
  ROUTES.home,
  ROUTES.offers,
  ROUTES.search,
]

export function isTopLevelRoute(pathname: string): boolean {
  return TOP_LEVEL_ROUTES.includes(pathname)
}
