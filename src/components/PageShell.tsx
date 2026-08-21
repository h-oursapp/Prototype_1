import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import wordmark from '../assets/hours-wordmark.png'
import { MOCK_HOURS_BALANCE } from '../data/mockUser'
import { ROUTES } from '../routes'
import { NavBar } from './NavBar'
import { isTopLevelRoute } from './topLevelRoutes'
import './PageShell.css'

interface PageShellProps {
  /** Omitted only by Home, which is its own full-bleed layout with no header. */
  title?: string
  /** Appkarte §3: the nav bar never collapses on Home, and collapses everywhere else. */
  navCollapsible?: boolean
  /** Rendered in the header opposite the title — e.g. Profile's Settings button. */
  headerAction?: ReactNode
  /** Shrinks the title text — for a page whose own content is already tight on vertical room and
   *  doesn't need a full-size heading to announce itself (Trading, TODO feedback). Every other
   *  page leaves this off and keeps the normal size, so this can't drift the header's usual look
   *  app-wide. */
  compactTitle?: boolean
  /** Hides the nav bar entirely — not just collapsed to its own small reopen button, gone
   *  altogether. Inventory's trading context (TODO #9.1 follow-up, direct feedback) is the one
   *  caller: its trading-table overlay already floats along that same bottom edge, and having the
   *  nav bar's own floating strip (or its collapsed reopen button) compete with it there read as
   *  cluttered. Every other page leaves this off and keeps the normal nav bar. */
  hideNavBar?: boolean
  children: ReactNode
}

/** The frame every page sits in: optional header with a back button, a scrolling content area,
 *  and the nav bar pinned underneath it.
 *
 *  Pages don't render the nav bar themselves — putting it here is what keeps its behavior
 *  identical everywhere, so it can't drift page by page as more screens get built.
 *
 *  TODO #4: the back button isn't always a plain `navigate(-1)` — see topLevelRoutes.ts for which
 *  pages always go straight Home instead, and why.
 *
 *  TODO #14: every header now carries the h_OURs logo dead-center, the same wordmark image and
 *  height (32px) Home's own topbar uses — sized in PageShell.css, not here, same as everywhere
 *  else images get their dimensions in this codebase. It's positioned absolutely rather than as a
 *  third flex child: headerAction ranges from nothing (Wallet) to a three-icon row (Inventory) to
 *  a wide text button (Community), and none of those should be able to nudge the logo off-center
 *  just because the *other* side happens to be narrower on that page. `pointer-events: none` (CSS)
 *  keeps it from ever intercepting a tap meant for the back button or headerAction if a very long
 *  title ever grew wide enough to sit underneath it. The back button and title both shrank a step
 *  to leave it real room (PageShell.css) — this replaces the one-off logo Trading used to bolt
 *  into its own `headerAction` (see TradingPage.tsx's history); every page gets it for free now.
 *  `headerAction` itself is wrapped in `.page-shell__header-end` (direct feedback: capping the
 *  title's own width so it can't run under the logo also broke the thing that used to push
 *  headerAction flush right, since that used to be the very same box growing to fill the gap —
 *  see PageShell.css's own comment on that class for the fix). Also, direct feedback: every
 *  header measured the same 53px except Community's and AdDetail's, whose `.page-shell__action
 *  --text` button had no fixed height of its own and rendered taller than the rest purely by
 *  however tall its text's line-height happened to compute — fixed in PageShell.css by giving it
 *  the same 28px box every other header control already had. */
export function PageShell({
  title,
  navCollapsible = true,
  headerAction,
  compactTitle = false,
  hideNavBar = false,
  children,
}: PageShellProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const goBack = () => {
    if (isTopLevelRoute(pathname)) navigate(ROUTES.home)
    else navigate(-1)
  }

  return (
    <div className="page-shell">
      {title !== undefined && (
        <header className="page-shell__header">
          <button type="button" className="page-shell__back" onClick={goBack} aria-label="Back">
            <span aria-hidden="true">←</span>
          </button>
          <h1 className={`page-shell__title ${compactTitle ? 'page-shell__title--compact' : ''}`}>{title}</h1>
          <img className="page-shell__logo" src={wordmark} alt="h_OURs" />
          {headerAction && <div className="page-shell__header-end">{headerAction}</div>}
        </header>
      )}

      <main className={`page-shell__content ${hideNavBar ? 'page-shell__content--no-nav' : ''}`}>{children}</main>

      {!hideNavBar && <NavBar hoursBalance={MOCK_HOURS_BALANCE} collapsible={navCollapsible} />}
    </div>
  )
}
