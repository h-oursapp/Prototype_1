import { useLocation, useNavigate } from 'react-router-dom'
import { NAV_ITEMS, activeNavKey } from './navItems'
import { useAutoCollapse } from './useAutoCollapse'
import './NavBar.css'

export type { NavKey } from './navItems'

interface NavBarProps {
  hoursBalance: number
  /** Appkarte §3: the bar never collapses on Home, and does everywhere else. */
  collapsible: boolean
}

/** The nav bar from Appkarte §3, present on (almost) every page.
 *
 *  It reads the current route itself rather than taking an `activeKey` prop, and navigates
 *  itself rather than taking an `onNavigate` prop — so a page just renders it and is done. */
export function NavBar({ hoursBalance, collapsible }: NavBarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isCollapsed, expand, keepOpen } = useAutoCollapse(collapsible)
  const activeKey = activeNavKey(pathname)

  if (isCollapsed) {
    return (
      <button type="button" className="nav-bar__reopen" onClick={expand} aria-label="Show navigation">
        <span aria-hidden="true">☰</span>
      </button>
    )
  }

  return (
    <nav className="nav-bar" aria-label="Main navigation" onPointerDown={keepOpen}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`nav-bar__item ${activeKey === item.key ? 'is-active' : ''}`}
          aria-current={activeKey === item.key ? 'page' : undefined}
          aria-label={item.key === 'wallet' ? `Hours balance: ${hoursBalance}, open wallet` : item.label}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-bar__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="nav-bar__label" aria-hidden="true">
            {item.key === 'wallet' ? `${hoursBalance}h` : item.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
