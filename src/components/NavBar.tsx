import './NavBar.css'

export type NavKey = 'wallet' | 'profile' | 'community' | 'trades' | 'inventory' | 'home'

interface NavItem {
  key: NavKey
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'wallet', label: 'Hours', icon: '⏱️' },
  { key: 'profile', label: 'Profile', icon: '👤' },
  { key: 'community', label: 'Community', icon: '👥' },
  { key: 'trades', label: 'Active trades', icon: '🔄' },
  { key: 'inventory', label: 'Inventory', icon: '📦' },
  { key: 'home', label: 'Home', icon: '🏠' },
]

interface NavBarProps {
  hoursBalance: number
  activeKey: NavKey
  onNavigate: (key: NavKey, label: string) => void
}

/** Nav bar present on (almost) all pages. Only Home exists in this prototype so far, where it's
 *  always fully visible — the collapse-into-a-corner-button behavior for other pages is deferred
 *  until those pages exist. */
export function NavBar({ hoursBalance, activeKey, onNavigate }: NavBarProps) {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`nav-bar__item ${activeKey === item.key ? 'is-active' : ''}`}
          aria-current={activeKey === item.key ? 'page' : undefined}
          aria-label={item.key === 'wallet' ? `Hours balance: ${hoursBalance}, open wallet` : item.label}
          onClick={() => onNavigate(item.key, item.label)}
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
