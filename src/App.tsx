import { useState } from 'react'
import { LoginPage } from './pages/LoginPage'
import { MainPage } from './pages/MainPage'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { SettingsPage } from './pages/SettingsPage'
import { SettingsProvider } from './settings/SettingsContext'

type Screen = 'login' | 'onboarding' | 'main' | 'settings'

function App() {
  const [screen, setScreen] = useState<Screen>('login')

  return (
    <SettingsProvider>
      {screen === 'login' && <LoginPage onLogin={() => setScreen('onboarding')} />}
      {screen === 'onboarding' && <OnboardingPage onComplete={() => setScreen('main')} />}
      {screen === 'main' && <MainPage onOpenSettings={() => setScreen('settings')} />}
      {screen === 'settings' && <SettingsPage onBack={() => setScreen('main')} />}
    </SettingsProvider>
  )
}

export default App
