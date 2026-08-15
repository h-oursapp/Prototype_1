import './LoginPage.css'

interface LoginPageProps {
  /** Prototype stand-in for real auth: pressing the button alone logs the user in, regardless of
   *  what's typed into the fields above it — TODO #1 asks for the fields, "not functionality yet". */
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <main className="login-page">
      <img className="login-page__mark" src="/favicon.svg" alt="" aria-hidden="true" />
      <h1>h_OURs</h1>
      <p className="login-page__tagline">Trade skills and time with people nearby.</p>

      {/* Plain, uncontrolled inputs — no `useState` here on purpose. Nothing reads these values yet
       *  (there's no account system to check them against), so wiring up React state to track them
       *  would be state that does nothing: a small case of the "no premature abstraction" rule.
       *  The browser already lets you type into an <input> with no help from React; once real login
       *  lands, that's the point these become controlled inputs (see AdForm in AdDetailPage.tsx for
       *  the pattern this page will follow then — value + onChange, kept as one draft object). */}
      <label className="login-page__field">
        <span className="login-page__label">Email</span>
        <input className="login-page__input" type="email" name="email" placeholder="you@example.com" />
      </label>

      <label className="login-page__field">
        <span className="login-page__label">Password</span>
        <input className="login-page__input" type="password" name="password" placeholder="••••••••" />
      </label>

      <button type="button" className="login-page__button" onClick={onLogin}>
        Log in
      </button>
      <p className="login-page__note">Prototype login — no account needed yet.</p>
    </main>
  )
}
