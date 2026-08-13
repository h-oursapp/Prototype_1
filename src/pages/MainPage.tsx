import { useRef, useState, type PointerEvent } from 'react'
import { GridSection } from '../components/GridSection'
import { NavBar, type NavKey } from '../components/NavBar'
import type { Offer } from '../data/mockOffers'
import { MOCK_ADS, MOCK_YOUR_OFFERS } from '../data/mockOffers'
import { useSettings } from '../settings/useSettings'
import { isSwipeUp } from '../utils/swipe'
import './MainPage.css'

// Dummy balance for the prototype — real balance comes from the (out of scope) Wallet.
const DUMMY_HOURS_BALANCE = 12

interface MainPageProps {
  onOpenSettings: () => void
}

/** Home: two fixed, non-scrollable grids (Ads, Your offers) plus the nav bar.
 *  Swiping up anywhere here opens the Wallet (the default target, reassignable later in
 *  Settings) — with no on-page hint advertising it, per request; the nav bar's Hours button
 *  still opens it too, so the feature stays reachable without relying on discovering the swipe.
 *  Everything else a tap here would open (Search, Offers page, ad detail, Profile, ...) is out
 *  of scope for this prototype, so those actions just surface a "coming soon" status line. */
export function MainPage({ onOpenSettings }: MainPageProps) {
  const { gridSize } = useSettings()
  const [status, setStatus] = useState<string | null>(null)
  const [walletOpen, setWalletOpen] = useState(false)
  const swipeStartY = useRef<number | null>(null)

  const announceComingSoon = (feature: string) => setStatus(`${feature} — coming soon`)

  const handleNavigate = (key: NavKey, label: string) => {
    if (key === 'wallet') {
      setWalletOpen(true)
      return
    }
    if (key === 'settings') {
      onOpenSettings()
      return
    }
    if (key !== 'home') announceComingSoon(label)
  }

  const handlePointerDown = (event: PointerEvent) => {
    swipeStartY.current = event.clientY
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (swipeStartY.current !== null && isSwipeUp(swipeStartY.current, event.clientY)) {
      setWalletOpen(true)
    }
    swipeStartY.current = null
  }

  return (
    <div className="main-page" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <div className="main-page__sections">
        <GridSection
          heading="Ads"
          offers={MOCK_ADS}
          gridSize={gridSize}
          openFullLabel="Open search"
          onOpenFull={() => announceComingSoon('Search')}
          onSelectOffer={(offer: Offer) => announceComingSoon(offer.title)}
        />
        <GridSection
          heading="Your offers"
          offers={MOCK_YOUR_OFFERS}
          gridSize={gridSize}
          openFullLabel="Open your offers"
          onOpenFull={() => announceComingSoon('Offers page')}
          onSelectOffer={(offer: Offer) => announceComingSoon(offer.title)}
        />
      </div>

      <p className="main-page__status" role="status">
        {status}
      </p>

      {walletOpen && (
        <div className="main-page__wallet-sheet" role="dialog" aria-label="Wallet">
          <p>👛 Wallet — coming soon</p>
          <button type="button" onClick={() => setWalletOpen(false)}>
            Close
          </button>
        </div>
      )}

      <NavBar hoursBalance={DUMMY_HOURS_BALANCE} activeKey="home" onNavigate={handleNavigate} />
    </div>
  )
}
