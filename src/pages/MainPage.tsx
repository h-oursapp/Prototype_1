import { useRef, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { GridSection } from '../components/GridSection'
import { NavBar } from '../components/NavBar'
import type { Offer } from '../data/mockOffers'
import { MOCK_ADS, MOCK_YOUR_OFFERS } from '../data/mockOffers'
import { MOCK_HOURS_BALANCE } from '../data/mockUser'
import { ROUTES, adDetail } from '../routes'
import { useSettings } from '../settings/useSettings'
import { isSwipeLeft, isSwipeRight, isSwipeUp } from '../utils/swipe'
import './MainPage.css'

/** Home (Appkarte §3): two fixed, non-scrollable grids — Ads on top, Your offers below — with
 *  the nav bar underneath.
 *
 *  Home is the one page that doesn't use PageShell. Its grids size themselves from a definite
 *  page height, which PageShell's scrolling, padded content area would take away; and §3 makes
 *  Home the exception for the nav bar too (always fully visible, never collapsing).
 *
 *  TODO #3 pairs each grid's corner arrow with a matching swipe direction, both leading to the
 *  same page: Ads' arrow points right and opens Search, which a right-to-left swipe also opens;
 *  Your offers' arrow points left and opens the full Offers page, which a left-to-right swipe
 *  also opens. Swiping up anywhere still opens the Wallet, same as before — reassignable later in
 *  Settings, with no on-page hint advertising any of the three. Whichever axis the drag moved
 *  further along wins, so a mostly-vertical swipe can't also register as left/right and vice versa.
 *  The nav bar's Hours button opens the Wallet too, so that feature stays reachable without
 *  discovering the swipe. */
export function MainPage() {
  const navigate = useNavigate()
  const { gridSize } = useSettings()
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  const handlePointerDown = (event: PointerEvent) => {
    swipeStart.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: PointerEvent) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return

    const isMostlyVertical = Math.abs(event.clientY - start.y) >= Math.abs(event.clientX - start.x)

    if (isMostlyVertical) {
      if (isSwipeUp(start.y, event.clientY)) navigate(ROUTES.wallet)
    } else if (isSwipeRight(start.x, event.clientX)) {
      navigate(ROUTES.offers)
    } else if (isSwipeLeft(start.x, event.clientX)) {
      navigate(ROUTES.search)
    }
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
          arrowSide="right"
        />
        <GridSection
          heading="Your offers"
          offers={MOCK_YOUR_OFFERS}
          gridSize={gridSize}
          openFullLabel="Open your offers"
          onOpenFull={() => navigate(ROUTES.offers)}
          onSelectOffer={openOffer}
          arrowSide="left"
          onCreateNew={() => navigate(ROUTES.adCreate)}
          createLabel="Create new offer"
        />
      </div>

      <NavBar hoursBalance={MOCK_HOURS_BALANCE} collapsible={false} />
    </div>
  )
}
