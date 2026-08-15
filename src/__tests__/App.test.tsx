import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { stubMatchMedia } from './helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
  // App uses a BrowserRouter, so the jsdom URL is shared between tests — reset it or a test
  // starts wherever the previous one navigated to. replaceState rather than pushState, so the
  // history stack doesn't grow test on test and change what navigate(-1) means.
  window.history.replaceState({}, '', '/')
})

/** Login → skip the three skippable onboarding steps → Finish → Home. */
async function signInAndFinishOnboarding(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Log in' }))
  await user.click(screen.getByText('Skip'))
  await user.click(screen.getByText('Skip'))
  await user.click(screen.getByText('Skip'))
  await user.click(screen.getByText('Next'))
  await user.click(screen.getByText('Finish'))
}

describe('App', () => {
  it('opens on the login screen even when the URL points elsewhere (§2)', () => {
    window.history.pushState({}, '', '/wallet')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('walks from login through onboarding to Home, keeping the chosen settings', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(screen.getByText('Add your skills')).toBeInTheDocument()
    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Next'))

    expect(screen.getByText('Make it yours')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '4 per row' }))
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    await user.click(screen.getByText('Finish'))

    expect(screen.getByText('Ads')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
    })
  })

  it('reaches Settings from Profile (TODO #4 moved it off the nav bar) and comes back with the back button', async () => {
    const user = userEvent.setup()
    render(<App />)
    await signInAndFinishOnboarding(user)

    await user.click(screen.getByRole('button', { name: 'Profile' }))
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2 per row' }))
    expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toMatchObject({ gridSize: 2 })

    // findBy, not getBy: the back button calls navigate(-1), and the browser dispatches popstate
    // asynchronously — getBy would race it and pass only when the suite happens to run fast.
    // Settings isn't one of TODO #4's "always Home" pages, so Back retraces history to Profile.
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument()
  })

  it('routes every nav bar button to a real page', async () => {
    const user = userEvent.setup()
    render(<App />)
    await signInAndFinishOnboarding(user)

    for (const [button, heading] of [
      ['Profile', 'Profile'],
      ['Community', 'Community'],
      ['Trades', 'Trades'],
      ['Inventory', 'Inventory'],
    ] as const) {
      await user.click(screen.getByRole('button', { name: button }))
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Home' }))
    }

    await user.click(screen.getByRole('button', { name: /open wallet/ }))
    expect(screen.getByRole('heading', { name: 'Wallet' })).toBeInTheDocument()
  })

  it('sends an unknown URL back to Home rather than showing nothing', async () => {
    const user = userEvent.setup()
    render(<App />)
    await signInAndFinishOnboarding(user)

    window.history.pushState({}, '', '/nope')
    await user.click(screen.getByRole('button', { name: 'Home' }))

    expect(screen.getByText('Ads')).toBeInTheDocument()
  })
})
