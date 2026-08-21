import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MOCK_SKILLS } from '../../data/mockUser'
import { SkillsPage } from '../../pages/SkillsPage'
import { LocationProbe, renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

/** Puts the grid density somewhere other than the default before the page reads it — same helper
 *  OffersPage.test.tsx uses for the same reason. */
function storeGridSize(gridSize: number) {
  window.localStorage.setItem('h-ours:settings', JSON.stringify({ colorTheme: 'light', gridSize }))
}

function renderSkillsPage(route = '/skills') {
  renderWithRouter(
    <>
      <SkillsPage />
      <LocationProbe />
    </>,
    { route },
  )
}

const yourSkills = () => within(screen.getByRole('list', { name: 'Your skills' }))

describe('SkillsPage', () => {
  it('shows one tile per skill, plus a tile to add one', () => {
    renderSkillsPage()

    expect(yourSkills().getAllByRole('listitem')).toHaveLength(MOCK_SKILLS.length + 1)
    expect(yourSkills().getByRole('button', { name: 'Web design, rated 5 out of 5' })).toBeInTheDocument()
    expect(yourSkills().getByRole('button', { name: 'Add a skill' })).toBeInTheDocument()
  })

  it('shows only the review rating for a skill, as a single badge (TODO #6)', () => {
    renderSkillsPage()

    expect(yourSkills().getByRole('button', { name: 'Web design, rated 5 out of 5' })).toBeInTheDocument()
    // The old two-stacked-StarRating look (self-rating and review rating) is gone from this tile.
    expect(screen.queryByRole('img', { name: "Web design's rating: rated 5 out of 5" })).not.toBeInTheDocument()
  })

  describe('search bar (TODO #6)', () => {
    it('narrows the grid to skills matching the typed text, leaving "Add a skill" untouched', async () => {
      const user = userEvent.setup()
      renderSkillsPage()

      await user.type(screen.getByLabelText('Search your skills'), 'pian')

      expect(yourSkills().getByRole('button', { name: /^piano/i })).toBeInTheDocument()
      expect(yourSkills().queryByRole('button', { name: /^web design/i })).not.toBeInTheDocument()
      expect(yourSkills().getByRole('button', { name: 'Add a skill' })).toBeInTheDocument()
    })

    it('says so when nothing matches', async () => {
      const user = userEvent.setup()
      renderSkillsPage()

      await user.type(screen.getByLabelText('Search your skills'), 'zzz')
      expect(screen.getByText('No skills match your search.')).toBeInTheDocument()
      expect(yourSkills().getByRole('button', { name: 'Add a skill' })).toBeInTheDocument()
    })
  })

  it('opens the Skill page when a tile is tapped', async () => {
    const user = userEvent.setup()
    renderSkillsPage()

    await user.click(yourSkills().getByRole('button', { name: 'Web design, rated 5 out of 5' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/skills/skill-1')
  })

  it('opens an empty Skill page from the add-skill tile', async () => {
    const user = userEvent.setup()
    renderSkillsPage()

    await user.click(yourSkills().getByRole('button', { name: 'Add a skill' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/skills/new')
  })

  it("follows the Settings grid-size setting for the grid's column count, uncapped in rows", () => {
    storeGridSize(2)
    renderSkillsPage()

    const grid = screen.getByRole('list', { name: 'Your skills' })
    expect(grid.style.gridTemplateColumns).toBe('repeat(2, 1fr)')
    // Unlike Home's grids, nothing is sliced off: every skill still renders at a small column count.
    expect(yourSkills().getAllByRole('listitem')).toHaveLength(MOCK_SKILLS.length + 1)
  })

  describe('transfer box (TODO #6)', () => {
    it('is absent outside a trading context', () => {
      renderSkillsPage()
      expect(screen.queryByRole('heading', { name: 'Your offer' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /add .* to your offer/i })).not.toBeInTheDocument()
    })

    it('appears at ?trade=<id>, naming the trade and showing an empty offer', () => {
      renderSkillsPage('/skills?trade=trade-1')

      expect(screen.getByText(/picking a skill for your trade with lena k\./i)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Your offer' })).toBeInTheDocument()
      expect(screen.getByText('Nothing in the offer yet.')).toBeInTheDocument()
    })

    it('adds a skill to the offer, then removes it again', async () => {
      const user = userEvent.setup()
      renderSkillsPage('/skills?trade=trade-1')

      await user.click(screen.getByRole('button', { name: 'Add Web design to your offer' }))

      expect(screen.queryByText('Nothing in the offer yet.')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Web design is already in your offer' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Remove Web design from your offer' }))
      expect(screen.getByText('Nothing in the offer yet.')).toBeInTheDocument()
    })

    it('accepts the offer', async () => {
      const user = userEvent.setup()
      renderSkillsPage('/skills?trade=trade-1')

      await user.click(screen.getByRole('button', { name: 'Add Web design to your offer' }))
      await user.click(screen.getByRole('button', { name: 'Accept' }))

      expect(screen.getByText(/offer accepted: 1 skill for the trade with lena k\./i)).toBeInTheDocument()
    })

    it('goes back to trading', async () => {
      const user = userEvent.setup()
      renderSkillsPage('/skills?trade=trade-1')

      await user.click(screen.getByRole('link', { name: 'Back to trading' }))
      expect(screen.getByTestId('location')).toHaveTextContent('/trading/trade-1')
    })
  })

  describe('picking a skill for a new ad (TODO #8)', () => {
    it('appears at ?forAd=new, with different wording than the trade context', () => {
      renderSkillsPage('/skills?forAd=new')

      expect(screen.getByText('Picking a skill for your new ad')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Your offer' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Use Web design for this ad' })).toBeInTheDocument()
    })

    it('picking a second skill replaces the first, since an ad has exactly one subject', async () => {
      const user = userEvent.setup()
      renderSkillsPage('/skills?forAd=new')
      const offer = () => within(screen.getByRole('group', { name: 'Your offer for this trade' }))

      await user.click(screen.getByRole('button', { name: 'Use Web design for this ad' }))
      expect(offer().getByText('Web design')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Use Piano for this ad' }))
      expect(offer().queryByText('Web design')).not.toBeInTheDocument()
      expect(offer().getByText('Piano')).toBeInTheDocument()
    })

    it('disables "Use this skill" until one has been picked, then sends it back to the new ad', async () => {
      const user = userEvent.setup()
      renderSkillsPage('/skills?forAd=new')

      expect(screen.getByRole('button', { name: 'Use this skill' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Use Web design for this ad' }))
      await user.click(screen.getByRole('button', { name: 'Use this skill' }))

      expect(screen.getByTestId('location')).toHaveTextContent('/ads/new')
      expect(screen.getByTestId('location')).toHaveTextContent('skillId=skill-1')
    })

    it('goes back to the new ad, abandoning the pick', async () => {
      const user = userEvent.setup()
      renderSkillsPage('/skills?forAd=new')

      await user.click(screen.getByRole('link', { name: 'Back to new ad' }))
      expect(screen.getByTestId('location')).toHaveTextContent('/ads/new')
    })
  })
})
