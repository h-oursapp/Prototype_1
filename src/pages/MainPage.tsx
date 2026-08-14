import { useRef, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { GridSection } from '../components/GridSection'
import { NavBar } from '../components/NavBar'
import type { Offer } from '../data/mockOffers'
import { MOCK_ADS, MOCK_YOUR_OFFERS } from '../data/mockOffers'
import { MOCK_HOURS_BALANCE } from '../data/mockUser'
import { ROUTES, adDetail } from '../routes'
import { useSettings } from '../settings/useSettings'
import { isSwipeUp } from '../utils/swipe'
import './MainPage.css'

/** Home (Appkarte §3): two fixed, non-scrollable grids — Ads on top, Your offers below — with
 *  the nav bar underneath.
 *
 *  Home is the one page that doesn't use PageShell. Its grids size themselves from a definite
 *  page height, which PageShell's scrolling, padded content area would take away; and §3 makes
 *  Home the exception for the nav bar too (always fully visible, never collapsing).
 *
 *  Swiping up anywhere opens the Wallet — the default target, reassignable later in Settings —
 *  with no on-page hint advertising it, per request. The nav bar's Hours button opens the Wallet
 *  as well, so the feature stays reachable without discovering the swipe. */
export function MainPage() {
  const navigate = useNavigate()
  const { gridSize } = useSettings()
  const swipeStartY = useRef<number | null>(null)

  const handlePointerDown = (event: PointerEvent) => {
    swipeStartY.current = event.clientY
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (swipeStartY.current !== null && isSwipeUp(swipeStartY.current, event.clientY)) {
      navigate(ROUTES.wallet)
    }
    swipeStartY.current = null
  }

  const openOffer = (offer: Offer) => navigate(adDetail(offer.id))

  return (
    <div className="main-page" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <div className="main-page__sections">
        <GridSection
          heading="Ads"
          offers={MOCK_ADS}
          gridSize={gridSize}
          openFullLabel="Open search"
          onOpenFull={() => navigate(ROUTES.search)}
          onSelectOffer={openOffer}
        />
        <GridSection
          heading="Your offers"
          offers={MOCK_YOUR_OFFERS}
          gridSize={gridSize}
          openFullLabel="Open your offers"
          onOpenFull={() => navigate(ROUTES.offers)}
          onSelectOffer={openOffer}
        />
      </div>

      <NavBar hoursBalance={MOCK_HOURS_BALANCE} collapsible={false} />
    </div>
  )
}
