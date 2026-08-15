import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  children: ReactNode
}

/** The frame every page sits in: optional header with a back button, a scrolling content area,
 *  and the nav bar pinned underneath it.
 *
 *  Pages don't render the nav bar themselves — putting it here is what keeps its behavior
 *  identical everywhere, so it can't drift page by page as more screens get built.
 *
 *  TODO #4: the back button isn't always a plain `navigate(-1)` — see topLevelRoutes.ts for which
 *  pages always go straight Home instead, and why. */
export function PageShell({ title, navCollapsible = true, headerAction, compactTitle = false, children }: PageShellProps) {
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
          {headerAction}
        </header>
      )}

      <main className="page-shell__content">{children}</main>

      <NavBar hoursBalance={MOCK_HOURS_BALANCE} collapsible={navCollapsible} />
    </div>
  )
}
