import { useState } from 'react'
import { GridSection } from '../components/GridSection'
import { NavBar, type NavKey } from '../components/NavBar'
import { SwipeUpHint } from '../components/SwipeUpHint'
import type { Offer } from '../data/mockOffers'
import { MOCK_ADS, MOCK_YOUR_OFFERS } from '../data/mockOffers'
import { useSettings } from '../settings/useSettings'
import './MainPage.css'

// Dummy balance for the prototype — real balance comes from the (out of scope) Wallet.
const DUMMY_HOURS_BALANCE = 12

interface MainPageProps {
  onOpenSettings: () => void
}

/** Home: two fixed, non-scrollable grids (Ads, Your offers) plus the nav bar.
 *  Everything a tap/swipe here would open (Search, Offers page, Wallet, ad detail, Profile, ...)
 *  is out of scope for this prototype, so those actions just surface a "coming soon" status line. */
export function MainPage({ onOpenSettings }: MainPageProps) {
  const { gridSize } = useSettings()
  const [status, setStatus] = useState<string | null>(null)
  const [walletOpen, setWalletOpen] = useState(false)

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

  return (
    <div className="main-page">
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

      <SwipeUpHint onTrigger={() => setWalletOpen(true)} />

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
