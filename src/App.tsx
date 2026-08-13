import { useState } from 'react'
import { LoginPage } from './pages/LoginPage'
import { MainPage } from './pages/MainPage'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { SettingsProvider } from './settings/SettingsContext'

type Screen = 'login' | 'onboarding' | 'main'

function App() {
  const [screen, setScreen] = useState<Screen>('login')

  return (
    <SettingsProvider>
      {screen === 'login' && <LoginPage onLogin={() => setScreen('onboarding')} />}
      {screen === 'onboarding' && <OnboardingPage onComplete={() => setScreen('main')} />}
      {screen === 'main' && <MainPage />}
    </SettingsProvider>
  )
}

export default App
