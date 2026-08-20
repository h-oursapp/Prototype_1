import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_PROFILE } from '../../data/mockUser'
import { ProfilePage } from '../../pages/ProfilePage'
import { ROUTES, skillDetail } from '../../routes'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

/** The page navigates rather than calling props, so the spy replaces useNavigate. vi.hoisted is
 *  what lets the spy exist before vi.mock's factory runs. */
const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigate }
})

/** Puts the grid density somewhere other than the default before the page reads it — same helper
 *  SkillsPage.test.tsx/OffersPage.test.tsx use for the same reason. */
function storeGridSize(gridSize: number) {
  window.localStorage.setItem('h-ours:settings', JSON.stringify({ colorTheme: 'light', gridSize }))
}

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
  navigate.mockClear()
})

describe('ProfilePage', () => {
  it('shows the profile picture with the personal info beside it', () => {
    renderWithRouter(<ProfilePage />)

    expect(screen.getByRole('img', { name: `${MOCK_PROFILE.name}'s profile picture` })).toBeInTheDocument()
    expect(screen.getByText(MOCK_PROFILE.name)).toBeInTheDocument()
    expect(screen.getByText(MOCK_PROFILE.location)).toBeInTheDocument()
    expect(screen.getByText(`Member since ${MOCK_PROFILE.memberSince}`)).toBeInTheDocument()
  })

  it('shows the intro as plain text and flags the unresolved field type', () => {
    renderWithRouter(<ProfilePage />)

    expect(screen.getByText(MOCK_PROFILE.intro)).toBeInTheDocument()
    expect(screen.getByText(/nessi wants an html field/i)).toBeInTheDocument()
  })

  describe('your best skills (TODO #5)', () => {
    it('shows exactly one row: as many highest-rated skills as the grid-size setting, one review rating each', () => {
      storeGridSize(3)
      renderWithRouter(<ProfilePage />)
      const bestSkills = within(screen.getByRole('list', { name: 'Your best skills' }))

      // Ratings, highest first, ties broken by original order: Web design (5), Piano (4),
      // Cooking (4 review, 3 self) make the top 3; Gardening and Photography don't.
      expect(bestSkills.getAllByRole('listitem')).toHaveLength(3)
      expect(bestSkills.getByRole('button', { name: 'Web design, rated 5 out of 5' })).toBeInTheDocument()
      expect(bestSkills.getByRole('button', { name: 'Piano, rated 4 out of 5' })).toBeInTheDocument()
      expect(bestSkills.getByRole('button', { name: 'Cooking, rated 4 out of 5' })).toBeInTheDocument()
      expect(bestSkills.queryByText('Gardening')).not.toBeInTheDocument()
      expect(bestSkills.queryByText('Photography')).not.toBeInTheDocument()

      // Only the review rating shows — no self-rating star row left on the tile.
      expect(bestSkills.queryByRole('img', { name: "Web design's rating: rated 5 out of 5" })).not.toBeInTheDocument()
    })

    it('follows the Settings grid-size setting for how many best skills show', () => {
      storeGridSize(2)
      renderWithRouter(<ProfilePage />)
      const bestSkills = within(screen.getByRole('list', { name: 'Your best skills' }))

      expect(bestSkills.getAllByRole('listitem')).toHaveLength(2)
      const grid = screen.getByRole('list', { name: 'Your best skills' })
      expect(grid.style.gridTemplateColumns).toBe('repeat(2, 1fr)')
    })

    it("opens a skill's own page when it's tapped", async () => {
      const user = userEvent.setup()
      renderWithRouter(<ProfilePage />)

      await user.click(
        within(screen.getByRole('list', { name: 'Your best skills' })).getByRole('button', {
          name: 'Web design, rated 5 out of 5',
        }),
      )
      expect(navigate).toHaveBeenCalledWith(skillDetail('skill-1'))
    })
  })

  describe('all skills (TODO #5: "loads all skills with filter public/private")', () => {
    it('expands the same grid to every skill, with a visibility filter, when tapped', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ProfilePage />)

      await user.click(screen.getByRole('button', { name: 'All skills' }))

      const allSkills = within(screen.getByRole('list', { name: 'All skills' }))
      expect(allSkills.getAllByRole('listitem')).toHaveLength(5)
      expect(allSkills.getByText('Photography')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Show best skills only' })).toBeInTheDocument()
    })

    it('narrows to public or private skills via the filter', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ProfilePage />)

      await user.click(screen.getByRole('button', { name: 'All skills' }))
      await user.click(screen.getByRole('button', { name: 'All' }))
      await user.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Private' }))

      // Photography is the only skill marked private in the mock data.
      const allSkills = within(screen.getByRole('list', { name: 'All skills' }))
      expect(allSkills.getAllByRole('listitem')).toHaveLength(1)
      expect(allSkills.getByText('Photography')).toBeInTheDocument()
    })

    it('collapses back to the best-skills row and drops the filter', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ProfilePage />)

      await user.click(screen.getByRole('button', { name: 'All skills' }))
      await user.click(screen.getByRole('button', { name: 'All' }))
      await user.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Private' }))
      await user.click(screen.getByRole('button', { name: 'Show best skills only' }))

      expect(screen.getByRole('list', { name: 'Your best skills' })).toBeInTheDocument()

      // Reopening starts from "All" again, not still "Private" from before.
      await user.click(screen.getByRole('button', { name: 'All skills' }))
      expect(within(screen.getByRole('list', { name: 'All skills' })).getAllByRole('listitem')).toHaveLength(5)
    })
  })

  it('has no reviews section (TODO #5: "remove reviews")', () => {
    renderWithRouter(<ProfilePage />)

    expect(screen.queryByRole('heading', { name: 'Reviews from recent trades' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reviewed trades' })).not.toBeInTheDocument()
  })

  it('goes to Settings from the header button', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.settings)
  })
})
