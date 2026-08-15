import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SettingsProvider } from '../../settings/SettingsContext'
import { TradeDraftProvider } from '../../trading/TradeDraftContext'

/** Render alongside a component to assert where a navigation actually landed. Kept opt-in
 *  rather than always-on, so it can't interfere with a page's own text queries. Includes the
 *  query string as well as the path — e.g. TODO #13's `?quick=1` on the trading route — so a
 *  test can assert on either half without needing its own probe. */
export function LocationProbe() {
  const { pathname, search } = useLocation()
  return (
    <div data-testid="location">
      {pathname}
      {search}
    </div>
  )
}

interface Options {
  /** Where the router starts, e.g. '/trades/trade-1/review'. Ignored when `initialEntries` is
   *  also given. */
  route?: string
  /** The route pattern the element is mounted at — needed when the page reads useParams(),
   *  e.g. '/trades/:tradeId/review'. Defaults to rendering the element at whatever `route` is. */
  path?: string
  /** A full history stack, for tests that need `navigate(-1)` to land somewhere specific — e.g.
   *  PageShell's back button. Takes over from `route` when given. */
  initialEntries?: string[]
  /** Which entry of `initialEntries` the router starts on. Defaults to the last one, same as
   *  MemoryRouter's own default. */
  initialIndex?: number
}

/** Renders a page the way the app does: inside a router (so useNavigate/useParams/useLocation
 *  work), inside SettingsProvider (so useSettings works), and inside TradeDraftProvider (so
 *  useTradeDraft works).
 *
 *  Not named *.test.tsx, so vitest treats it as a helper rather than collecting it as a suite. */
export function renderWithRouter(
  ui: ReactElement,
  { route = '/', path, initialEntries, initialIndex }: Options = {},
) {
  return render(
    <SettingsProvider>
      <TradeDraftProvider>
        <MemoryRouter initialEntries={initialEntries ?? [route]} initialIndex={initialIndex}>
          {path ? (
            <Routes>
              <Route path={path} element={ui} />
            </Routes>
          ) : (
            ui
          )}
        </MemoryRouter>
      </TradeDraftProvider>
    </SettingsProvider>,
  )
}

/** jsdom has no matchMedia, which SettingsContext calls when resolving the system color theme.
 *  Call this in a beforeEach alongside localStorage.clear() before rendering anything. */
export function stubMatchMedia() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}
