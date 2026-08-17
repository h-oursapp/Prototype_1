import { render, screen, within } from '@testing-library/react'
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

function renderCreatePage(route = '/ads/new') {
  renderWithRouter(<AdDetailPage mode="create" />, { route, path: '/ads/new' })
}

/** For tests that navigate *away* from AdDetailPage (Quick Buy, Open trading window, picking a
 *  skill/item): the plain single-route wrapping renderWithRouter uses would unmount everything
 *  once the URL stops matching the page's own path — a wildcard fallback route that renders
 *  LocationProbe, the same shape App.tsx's own catch-all uses, keeps it mounted wherever the
 *  navigation actually lands. */
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

function renderCreatePageAndTrackNavigation(route = '/ads/new') {
  render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/ads/new" element={<AdDetailPage mode="create" />} />
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

    it('opens Trading in quick-offer mode, preloading the ad hours (TODO #8/#13), when Quick Buy is pressed', async () => {
      const user = userEvent.setup()
      renderAdAndTrackNavigation('ad-1')

      await user.click(screen.getByRole('button', { name: /Quick Buy/ }))
      // 'Guitar lessons' matches trade-1's subject exactly (see mockTradeIdFor).
      expect(screen.getByTestId('location')).toHaveTextContent('/trading/trade-1')
      expect(screen.getByTestId('location')).toHaveTextContent('quick=1')
      expect(screen.getByTestId('location')).toHaveTextContent('hours=2') // ad-1's listed price
    })

    it('opens Trading plainly (no quick flag or hours) from "Open trading window"', async () => {
      const user = userEvent.setup()
      renderAdAndTrackNavigation('ad-1')

      await user.click(screen.getByRole('button', { name: 'Open trading window' }))
      expect(screen.getByTestId('location')).toHaveTextContent('/trading/trade-1')
      expect(screen.getByTestId('location')).not.toHaveTextContent('quick=1')
      expect(screen.getByTestId('location')).not.toHaveTextContent('hours=')
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

  describe('ratings (TODO #8)', () => {
    it("shows both ratings for a skill offer — the seller's own rating and the review rating", () => {
      renderAd('ad-1') // Guitar lessons: skill, rating 5, reviewRating 5

      expect(screen.getByRole('img', { name: "Guitar lessons's rating: rated 5 out of 5" })).toBeInTheDocument()
      expect(
        screen.getByRole('img', { name: "Guitar lessons's review rating: rated 5 out of 5" }),
      ).toBeInTheDocument()
    })

    it('shows only a condition rating for an item offer, not the generic rating', () => {
      renderAd('ad-5') // Wooden chair: item, rating 4, conditionRating 3

      expect(screen.getByRole('img', { name: "Wooden chair's condition: rated 3 out of 5" })).toBeInTheDocument()
      expect(screen.queryByRole('img', { name: /Wooden chair's rating/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('img', { name: /Wooden chair's review rating/ })).not.toBeInTheDocument()
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

      expect(screen.getByRole('heading', { name: 'New offer' })).toBeInTheDocument()
      expect(screen.getByLabelText('Title')).toHaveValue('')
      expect(screen.getByLabelText('Price in hours')).toHaveValue(null)
      expect(screen.getByLabelText('Description')).toHaveValue('')
      expect(screen.getByRole('button', { name: 'Create offer' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
    })

    it('keeps what was typed and reports that creating is not wired up', async () => {
      const user = userEvent.setup()
      renderCreatePage()

      await user.type(screen.getByLabelText('Title'), 'Cargo bike')
      await user.click(screen.getByRole('button', { name: 'Create offer' }))

      expect(screen.getByLabelText('Title')).toHaveValue('Cargo bike')
      expect(screen.getByRole('status')).toHaveTextContent(/not wired up/i)
    })

    describe('picking a skill or item (TODO #8)', () => {
      it('shows Skill/Item picker buttons in the picture area before anything is picked', () => {
        renderCreatePage()

        expect(screen.getByRole('button', { name: 'Skill' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Item' })).toBeInTheDocument()
        // The form underneath is unaffected — only the picture area changes.
        expect(screen.getByLabelText('Title')).toBeInTheDocument()
      })

      it('navigates to Skills when "Skill" is pressed', async () => {
        const user = userEvent.setup()
        renderCreatePageAndTrackNavigation()

        await user.click(screen.getByRole('button', { name: 'Skill' }))
        expect(screen.getByTestId('location')).toHaveTextContent('/skills')
        expect(screen.getByTestId('location')).toHaveTextContent('forAd=new')
      })

      it('navigates to Inventory when "Item" is pressed', async () => {
        const user = userEvent.setup()
        renderCreatePageAndTrackNavigation()

        await user.click(screen.getByRole('button', { name: 'Item' }))
        expect(screen.getByTestId('location')).toHaveTextContent('/inventory')
        expect(screen.getByTestId('location')).toHaveTextContent('forAd=new')
      })

      it('seeds the draft from a picked skill and swaps the picker for the ordinary gallery', () => {
        renderCreatePage('/ads/new?skillId=skill-1') // Web design

        expect(screen.queryByText('What are you offering?')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Title')).toHaveValue('Web design')
        expect(screen.getByRole('button', { name: 'Change skill or item' })).toBeInTheDocument()
        // The picker is gone, but the ordinary "Offer type" toggle is back, defaulted to Skill.
        expect(screen.getByRole('button', { name: 'Skill' })).toHaveAttribute('aria-pressed', 'true')
      })

      it('seeds the draft from a picked item, defaulting the offer type to Item', () => {
        renderCreatePage('/ads/new?itemId=item-1') // Acoustic guitar

        expect(screen.getByLabelText('Title')).toHaveValue('Acoustic guitar')
        expect(screen.getByRole('button', { name: 'Item' })).toHaveAttribute('aria-pressed', 'true')
      })

      it('shows a condition-rating field, defaulted to 3, once an item has been picked', () => {
        renderCreatePage('/ads/new?itemId=item-1')

        const condition = within(screen.getByRole('group', { name: 'Condition' }))
        expect(condition.getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'true')
      })

      it('shows no condition-rating field for a picked skill', () => {
        renderCreatePage('/ads/new?skillId=skill-1')

        expect(screen.queryByRole('group', { name: 'Condition' })).not.toBeInTheDocument()
      })

      it('lets you change the pick, bringing the picker buttons back without losing what was typed', async () => {
        const user = userEvent.setup()
        renderCreatePage('/ads/new?skillId=skill-1')

        await user.clear(screen.getByLabelText('Title'))
        await user.type(screen.getByLabelText('Title'), 'Web design, evenings only')
        await user.click(screen.getByRole('button', { name: 'Change skill or item' }))

        expect(screen.getByRole('button', { name: 'Skill' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Item' })).toBeInTheDocument()
        expect(screen.getByLabelText('Title')).toHaveValue('Web design, evenings only')
      })
    })
  })

  describe('unknown ad', () => {
    it('shows a not-found state with a way back', () => {
      renderAd('no-such-ad')

      expect(screen.getByRole('heading', { name: 'Offer not found' })).toBeInTheDocument()
      expect(screen.getByText(/no-such-ad/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Back to home' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Quick Buy/ })).not.toBeInTheDocument()
    })
  })
})
