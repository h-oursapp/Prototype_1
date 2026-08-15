import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { PageShell } from '../../components/PageShell'
import { LocationProbe, renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

describe('PageShell', () => {
  it('renders a header with the title, a back button, and the nav bar', () => {
    renderWithRouter(
      <PageShell title="Wallet">
        <p>content</p>
      </PageShell>,
    )

    expect(screen.getByRole('heading', { name: 'Wallet' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('omits the header entirely when no title is given', () => {
    renderWithRouter(
      <PageShell>
        <p>content</p>
      </PageShell>,
    )

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('shrinks the title only when compactTitle is set', () => {
    renderWithRouter(
      <PageShell title="Trading with Lena K." compactTitle>
        <p>content</p>
      </PageShell>,
    )

    expect(screen.getByRole('heading', { name: 'Trading with Lena K.' })).toHaveClass(
      'page-shell__title--compact',
    )
  })

  it('renders a header action beside the title', async () => {
    const user = userEvent.setup()
    let pressed = false
    renderWithRouter(
      // Deliberately not named "Settings" — the nav bar already has a button by that name, and
      // an ambiguous accessible name would match both.
      <PageShell title="Profile" headerAction={<button type="button" onClick={() => (pressed = true)}>Open settings</button>}>
        <p>content</p>
      </PageShell>,
    )

    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    expect(pressed).toBe(true)
  })

  // TODO #4: a top-level page's own back button always returns Home, regardless of history —
  // everywhere else, it's the ordinary one-step-back.
  it('sends the back button straight Home from a top-level page, regardless of history', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <>
        <PageShell title="Wallet">
          <p>content</p>
        </PageShell>
        <LocationProbe />
      </>,
      { initialEntries: ['/trading/trade-1', '/wallet'], initialIndex: 1 },
    )

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  it('falls back to ordinary one-step-back everywhere else', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <>
        <PageShell title="Web design">
          <p>content</p>
        </PageShell>
        <LocationProbe />
      </>,
      { initialEntries: ['/offers', '/ads/ad-1'], initialIndex: 1 },
    )

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/offers')
  })
})
