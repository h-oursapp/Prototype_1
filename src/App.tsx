import { useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { AdDetailPage } from './pages/AdDetailPage'
import { CommunityPage } from './pages/CommunityPage'
import { FinalReviewPage } from './pages/FinalReviewPage'
import { InventoryPage } from './pages/InventoryPage'
import { ItemPage } from './pages/ItemPage'
import { LegalPage } from './pages/LegalPage'
import { LoginPage } from './pages/LoginPage'
import { MainPage } from './pages/MainPage'
import { OffersPage } from './pages/OffersPage'
import { PartnerInventoryPage } from './pages/PartnerInventoryPage'
import { PartnerProfilePage } from './pages/PartnerProfilePage'
import { ProfilePage } from './pages/ProfilePage'
import { SearchPage } from './pages/SearchPage'
import { SettingsPage } from './pages/SettingsPage'
import { SkillPage } from './pages/SkillPage'
import { SkillsPage } from './pages/SkillsPage'
import { TradesPage } from './pages/TradesPage'
import { TradingPage } from './pages/TradingPage'
import { WalletPage } from './pages/WalletPage'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { ROUTES } from './routes'
import { SettingsProvider } from './settings/SettingsContext'
import { TradeDraftProvider } from './trading/TradeDraftContext'

/** Appkarte §2: the app opens on login. Real auth is [OFFEN], so "signed in" is just a flag that
 *  lives until the tab is closed. */
function useSession() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  return { isSignedIn, signIn: () => setIsSignedIn(true) }
}

interface GateProps {
  isSignedIn: boolean
}

/** Wraps every signed-in route. <Outlet /> is where react-router renders whichever child route
 *  matched — so this check runs once here instead of being repeated in all fifteen pages. */
function RequireSession({ isSignedIn }: GateProps) {
  return isSignedIn ? <Outlet /> : <Navigate to={ROUTES.login} replace />
}

function LoginRoute({ onSignIn }: { onSignIn: () => void }) {
  const navigate = useNavigate()
  return (
    <LoginPage
      onLogin={() => {
        onSignIn()
        navigate(ROUTES.onboarding)
      }}
    />
  )
}

function OnboardingRoute() {
  const navigate = useNavigate()
  // `replace` so the back button doesn't walk back into onboarding once it's finished.
  return <OnboardingPage onComplete={() => navigate(ROUTES.home, { replace: true })} />
}

function AppRoutes() {
  const { isSignedIn, signIn } = useSession()

  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginRoute onSignIn={signIn} />} />

      <Route element={<RequireSession isSignedIn={isSignedIn} />}>
        <Route path={ROUTES.onboarding} element={<OnboardingRoute />} />
        <Route path={ROUTES.home} element={<MainPage />} />
        <Route path={ROUTES.offers} element={<OffersPage />} />
        <Route path={ROUTES.search} element={<SearchPage />} />
        <Route path={ROUTES.adCreate} element={<AdDetailPage mode="create" />} />
        <Route path={ROUTES.adDetail} element={<AdDetailPage />} />
        <Route path={ROUTES.trading} element={<TradingPage />} />
        <Route path={ROUTES.inventory} element={<InventoryPage />} />
        <Route path={ROUTES.partnerInventory} element={<PartnerInventoryPage />} />
        {/* 'new' before ':itemId', same reason /ads/new precedes /ads/:adId. */}
        <Route path={ROUTES.itemCreate} element={<ItemPage mode="create" />} />
        <Route path={ROUTES.itemDetail} element={<ItemPage />} />
        <Route path={ROUTES.wallet} element={<WalletPage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
        <Route path={ROUTES.partnerProfile} element={<PartnerProfilePage />} />
        <Route path={ROUTES.skills} element={<SkillsPage />} />
        {/* 'new' before ':skillId', same reason /ads/new precedes /ads/:adId. */}
        <Route path={ROUTES.skillCreate} element={<SkillPage mode="create" />} />
        <Route path={ROUTES.skillDetail} element={<SkillPage />} />
        <Route path={ROUTES.trades} element={<TradesPage />} />
        <Route path={ROUTES.finalReview} element={<FinalReviewPage />} />
        <Route path={ROUTES.community} element={<CommunityPage />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
        <Route path={ROUTES.legal} element={<LegalPage />} />
      </Route>

      {/* Anything unrecognised goes home rather than showing a blank screen. */}
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <SettingsProvider>
      <TradeDraftProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TradeDraftProvider>
    </SettingsProvider>
  )
}

export default App
