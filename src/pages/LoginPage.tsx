import './LoginPage.css'

interface LoginPageProps {
  /** Prototype stand-in for real auth: pressing the button alone logs the user in. */
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <main className="login-page">
      <img className="login-page__mark" src="/favicon.svg" alt="" aria-hidden="true" />
      <h1>h_OURs</h1>
      <p className="login-page__tagline">Trade skills and time with people nearby.</p>

      <button type="button" className="login-page__button" onClick={onLogin}>
        Log in
      </button>
      <p className="login-page__note">Prototype login — no account needed yet.</p>
    </main>
  )
}
