import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AdDetailPage } from '../../pages/AdDetailPage'
import { SettingsProvider } from '../../settings/SettingsContext'
import { LocationProbe, renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

/** 'ad-1' is someone else's ad (Guitar lessons, 2 hours); 'mine-1' is your own (Web design). */
function renderAd(adId: string) {
  renderWithRouter(<AdDetailPage />, { route: `/ads/${adId}`, path: '/ads/:adId' })
}

function renderCreatePage() {
  renderWithRouter(<AdDetailPage mode="create" />, { route: '/ads/new', path: '/ads/new' })
}

/** For tests that navigate *away* from AdDetailPage (Quick Buy, Open trading window): the plain
 *  single-route wrapping renderWithRouter uses would unmount everything once the URL stops
 *  matching '/ads/:adId'. A wildcard fallback route that renders LocationProbe — the same shape
 *  App.tsx's own catch-all uses — keeps it mounted wherever the navigation actually lands. */
function renderAdAndTrackNavigation(adId: string) {
  render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[`/ads/${adId}`]}>
        <Routes>
          <Route path="/ads/:adId" element={<AdDetailPage />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </SettingsProvider>,
  )
}

describe('AdDetailPage', () => {
  describe("someone else's ad", () => {
    it('shows the ad and offers Quick Buy at the listed price plus the trading window', () => {
      renderAd('ad-1')

      expect(screen.getByRole('heading', { name: 'Guitar lessons' })).toBeInTheDocument()
      expect(screen.getByText(/Learn the basics of guitar/)).toBeInTheDocument()
      expect(screen.getByText('2 hours')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Quick Buy/ })).toHaveTextContent('2 h')
      expect(screen.getByRole('button', { name: 'Open trading window' })).toBeInTheDocument()
    })

    it('does not offer the owner actions', () => {
      renderAd('ad-1')

      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
    })

    it('opens Trading in quick-offer mode when Quick Buy is pressed (TODO #13)', async () => {
      const user = userEvent.setup()
      renderAdAndTrackNavigation('ad-1')

      await user.click(screen.getByRole('button', { name: /Quick Buy/ }))
      // 'Guitar lessons' matches trade-1's subject exactly (see mockTradeIdFor).
      expect(screen.getByTestId('location')).toHaveTextContent('/trading/trade-1')
      expect(screen.getByTestId('location')).toHaveTextContent('quick=1')
    })

    it('opens Trading plainly (no quick flag) from "Open trading window"', async () => {
      const user = userEvent.setup()
      renderAdAndTrackNavigation('ad-1')

      await user.click(screen.getByRole('button', { name: 'Open trading window' }))
      expect(screen.getByTestId('location')).toHaveTextContent('/trading/trade-1')
      expect(screen.getByTestId('location')).not.toHaveTextContent('quick=1')
    })
  })

  describe('your own ad', () => {
    it('offers Edit and Share instead of buying', () => {
      renderAd('mine-1')

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Quick Buy/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Open trading window' })).not.toBeInTheDocument()
    })

    it('turns the details into editable fields on Edit and back on Save', async () => {
      const user = userEvent.setup()
      renderAd('mine-1')

      expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Edit' }))
      const title = screen.getByLabelText('Title')
      expect(title).toHaveValue('Web design')
      expect(screen.getByLabelText('Price in hours')).toHaveValue(4)

      await user.clear(title)
      await user.type(title, 'Web design and build')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Web design and build' })).toBeInTheDocument()
    })
  })

  describe('view-only mode', () => {
    it("hides every action button on someone else's ad", async () => {
      const user = userEvent.setup()
      renderAd('ad-1')

      await user.click(screen.getByRole('button', { name: 'View only' }))

      expect(screen.queryByRole('button', { name: /Quick Buy/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Open trading window' })).not.toBeInTheDocument()
      // The ad itself is still readable — view-only only removes the actions.
      expect(screen.getByRole('heading', { name: 'Guitar lessons' })).toBeInTheDocument()
    })

    it('hides every action button on your own ad', async () => {
      const user = userEvent.setup()
      renderAd('mine-1')

      await user.click(screen.getByRole('button', { name: 'View only' }))

      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
    })

    it('brings the actions back when it is switched off again', async () => {
      const user = userEvent.setup()
      renderAd('mine-1')
      const toggle = screen.getByRole('button', { name: 'View only' })

      await user.click(toggle)
      await user.click(toggle)

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    })
  })

  describe('create mode', () => {
    it('renders empty fields and a create action', () => {
      renderCreatePage()

      expect(screen.getByRole('heading', { name: 'New ad' })).toBeInTheDocument()
      expect(screen.getByLabelText('Title')).toHaveValue('')
      expect(screen.getByLabelText('Price in hours')).toHaveValue(null)
      expect(screen.getByLabelText('Description')).toHaveValue('')
      expect(screen.getByRole('button', { name: 'Create ad' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
    })

    it('keeps what was typed and reports that creating is not wired up', async () => {
      const user = userEvent.setup()
      renderCreatePage()

      await user.type(screen.getByLabelText('Title'), 'Cargo bike')
      await user.click(screen.getByRole('button', { name: 'Create ad' }))

      expect(screen.getByLabelText('Title')).toHaveValue('Cargo bike')
      expect(screen.getByRole('status')).toHaveTextContent(/not wired up/i)
    })
  })

  describe('unknown ad', () => {
    it('shows a not-found state with a way back', () => {
      renderAd('no-such-ad')

      expect(screen.getByRole('heading', { name: 'Ad not found' })).toBeInTheDocument()
      expect(screen.getByText(/no-such-ad/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Back to home' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Quick Buy/ })).not.toBeInTheDocument()
    })
  })
})
