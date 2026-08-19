import { useRef, useState, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import wordmark from '../assets/hours-wordmark.png'
import { GridSection } from '../components/GridSection'
import { NavBar } from '../components/NavBar'
import { SearchBar } from '../components/SearchBar'
import type { Offer } from '../data/mockOffers'
import { MOCK_ADS } from '../data/mockOffers'
import { MOCK_HOURS_BALANCE } from '../data/mockUser'
import { ROUTES, adDetail, searchWithQuery } from '../routes'
import { useSettings } from '../settings/useSettings'
import { isSwipeLeft, isSwipeRight, isSwipeUp } from '../utils/swipe'
import './MainPage.css'

/** Home (Appkarte §3, reworked by TODO #3): one topbar row — the h_OURs logo on the left, a
 *  compact search bar filling the rest of it, then a location-pin button — over one fixed,
 *  non-scrollable Ads grid, with the nav bar underneath. Your offers no longer gets a grid of its
 *  own here — TODO #3 drops it entirely — and its corner button has since moved again, off Home
 *  altogether and onto the nav bar (see navItems.ts), once the topbar's other slot went to the
 *  search bar instead.
 *
 *  Home is the one page that doesn't use PageShell. Its grid sizes itself from a definite page
 *  height, which PageShell's scrolling, padded content area would take away; and §3 makes Home
 *  the exception for the nav bar too (always fully visible, never collapsing).
 *
 *  The search bar is deliberately "simple" (TODO #3): no filter controls of its own, just a query.
 *  Its own submit sends you to Search's text-results view; the pin button next to it (also TODO
 *  #3) sends the same typed query to the map view instead — `searchWithQuery`'s `view` argument is
 *  the only difference between the two. Either way nothing here narrows in place; the three
 *  filters that view opens with come from Settings' configurable default (also TODO #3), not
 *  always "show everything" — see SearchPage's own file banner. The field resets itself for free
 *  every time, since navigating away unmounts Home and drops its local state, same as everywhere
 *  else in this prototype that doesn't persist.
 *
 *  Home's own two swipe gestures still work exactly as before, even without a button advertising
 *  either on Home itself anymore: a left-to-right swipe opens Offers (now the nav bar's job to
 *  advertise instead), and a right-to-left swipe opens Search's plain map view with no query — a
 *  second, quicker way in than the pin button, for whenever there's nothing in particular to type.
 *  Swiping up anywhere still opens the Wallet, same as before — reassignable later in Settings,
 *  with no on-page hint advertising any of the three. Whichever axis the drag moved further along
 *  wins, so a mostly-vertical swipe can't also register as left/right and vice versa. The nav
 *  bar's Hours button opens the Wallet too, so that feature stays reachable without discovering
 *  the swipe. */
export function MainPage() {
  const navigate = useNavigate()
  const { gridSize } = useSettings()
  const [searchQuery, setSearchQuery] = useState('')
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
  const submitSearch = () => navigate(searchWithQuery(searchQuery))
  const openMapSearch = () => navigate(searchWithQuery(searchQuery, 'map'))

  return (
    <div className="main-page" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <header className="main-page__topbar">
        <img className="main-page__logo" src={wordmark} alt="h_OURs" />
        <div className="main-page__search">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={submitSearch}
            placeholder="Skills, items, anything"
            compact
          />
        </div>
        <button type="button" className="main-page__map-button" aria-label="Open map search" onClick={openMapSearch}>
          <span aria-hidden="true">📍</span>
        </button>
      </header>

      <GridSection heading="Ads" offers={MOCK_ADS} gridSize={gridSize} onSelectOffer={openOffer} />

      <NavBar hoursBalance={MOCK_HOURS_BALANCE} collapsible={false} />
    </div>
  )
}
