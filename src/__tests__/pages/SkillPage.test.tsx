import { screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SkillPage } from '../../pages/SkillPage'
import { ROUTES, reviewedTrades } from '../../routes'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

/** SkillPage needs a real :skillId route match for useParams() to resolve, which means it has to
 *  render behind a <Route> (via renderWithRouter's `path` option) — and a <Route> unmounts its
 *  element the moment the URL moves somewhere that pattern doesn't match. Asserting navigation by
 *  watching the URL (as TradesPage.test.tsx and SkillsPage.test.tsx do, where no `path` is needed)
 *  would break here, so this file uses the same navigate-spy pattern ProfilePage.test.tsx already
 *  established: real useParams, a fake useNavigate. */
const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigate }
})

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
  navigate.mockClear()
})

function renderSkill(skillId: string) {
  renderWithRouter(<SkillPage />, { route: `/skills/${skillId}`, path: '/skills/:skillId' })
}

function renderNewSkill() {
  renderWithRouter(<SkillPage mode="create" />, { route: '/skills/new' })
}

async function startAdding(user: UserEvent, name: string) {
  await user.type(screen.getByLabelText('Search skills'), name)
  await user.click(within(screen.getByRole('list', { name: 'Search results' })).getByRole('button', { name }))
}

describe('SkillPage', () => {
  describe('viewing an existing skill', () => {
    it('shows the name, description and both ratings', () => {
      renderSkill('skill-1')

      // Level 2: PageShell's own header title is also "Web design", one level up.
      expect(screen.getByRole('heading', { level: 2, name: 'Web design' })).toBeInTheDocument()
      expect(
        screen.getByText('Responsive sites and shop pages, from a blank page to something you can launch.'),
      ).toBeInTheDocument()
      expect(screen.getByRole('img', { name: "Web design's rating: rated 5 out of 5" })).toBeInTheDocument()
      expect(screen.getByRole('img', { name: "Web design's review rating: rated 5 out of 5" })).toBeInTheDocument()
    })

    it('shows recent reviews of this specific skill', () => {
      renderSkill('skill-1')

      expect(within(screen.getByRole('list', { name: 'Reviews of Web design' })).getByText('Lena K.')).toBeInTheDocument()
      expect(screen.getByText(/redesigned my shop page/i)).toBeInTheDocument()
    })

    it('says so when a skill has no reviews yet', () => {
      renderSkill('skill-4') // Gardening
      expect(screen.getByText('No reviews of this skill yet.')).toBeInTheDocument()
    })

    it('shows a public skill\'s visibility (TODO #7: "items and skills have to be similar")', () => {
      renderSkill('skill-1') // Web design, public
      expect(screen.getByText('Visibility')).toBeInTheDocument()
      expect(screen.getByText('Public')).toBeInTheDocument()
    })

    it('shows a private skill\'s visibility', () => {
      renderSkill('skill-5') // Photography, private
      expect(screen.getByText('Private')).toBeInTheDocument()
    })

    it('opens this skill’s reviewed trades', async () => {
      const user = userEvent.setup()
      renderSkill('skill-1')

      await user.click(screen.getByRole('button', { name: 'All reviewed trades for this skill' }))
      expect(navigate).toHaveBeenCalledWith(reviewedTrades('skill-1'))
    })

    it('shows a "not found" state for an unknown id, with a way back', async () => {
      const user = userEvent.setup()
      renderSkill('skill-does-not-exist')

      expect(screen.getByText(/there is no skill with the id/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Back to Skills' }))
      expect(navigate).toHaveBeenCalledWith(ROUTES.skills)
    })
  })

  describe('editing an existing skill', () => {
    it('does not let you rename a catalogue skill, only a custom one', async () => {
      const user = userEvent.setup()
      renderSkill('skill-1') // Web design, not custom

      await user.click(screen.getByRole('button', { name: 'Edit' }))
      expect(screen.queryByLabelText('Skill name')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Save' }))
      expect(screen.getByRole('img', { name: "Web design's rating: rated 5 out of 5" })).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent(/nothing is saved/i)
    })

    it('lets you rename a custom skill', async () => {
      const user = userEvent.setup()
      renderSkill('skill-5') // Photography, custom

      await user.click(screen.getByRole('button', { name: 'Edit' }))
      expect(screen.getByLabelText('Skill name')).toHaveValue('Photography')
    })

    it('shows the edited value once Save is pressed', async () => {
      const user = userEvent.setup()
      renderSkill('skill-3') // Cooking, rating 3, no proof yet

      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: '2★' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByRole('img', { name: "Cooking's rating: rated 2 out of 5" })).toBeInTheDocument()
    })

    it('toggles visibility (TODO #7\'s "add private/public property", now with a real editing control)', async () => {
      const user = userEvent.setup()
      renderSkill('skill-1') // Web design, public to start

      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(within(screen.getByRole('group', { name: 'Visibility' })).getByRole('button', { name: 'Private' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByText('Visibility')).toBeInTheDocument()
      expect(screen.getByText('Private')).toBeInTheDocument()
    })

    it('blocks raising the rating to 4★+ with no proof, and says why', async () => {
      const user = userEvent.setup()
      renderSkill('skill-3') // Cooking, no proof on file

      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: '4★' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByRole('alert')).toHaveTextContent(/needs proof/i)

      await user.type(screen.getByLabelText('Proof'), 'Cooking course certificate')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByRole('img', { name: "Cooking's rating: rated 4 out of 5" })).toBeInTheDocument()
    })

    it('does not flag a rename-free save as a duplicate of itself', async () => {
      const user = userEvent.setup()
      renderSkill('skill-5') // Photography, custom, name unchanged in this test

      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('still catches a real duplicate name', async () => {
      const user = userEvent.setup()
      renderSkill('skill-5') // Photography, custom — renaming it to an existing skill's name

      await user.click(screen.getByRole('button', { name: 'Edit' }))
      const nameField = screen.getByLabelText('Skill name')
      await user.clear(nameField)
      await user.type(nameField, 'Cooking')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByRole('alert')).toHaveTextContent(/already have a skill called Cooking/i)
    })
  })

  describe('creating a skill', () => {
    it('filters the predefined list by the search text, leaving out skills you already have', async () => {
      const user = userEvent.setup()
      renderNewSkill()

      await user.type(screen.getByLabelText('Search skills'), 'cooking')
      expect(screen.getByText(/nothing in the list matches/i)).toBeInTheDocument()

      await user.clear(screen.getByLabelText('Search skills'))
      await user.type(screen.getByLabelText('Search skills'), 'gui')
      const results = within(screen.getByRole('list', { name: 'Search results' })).getAllByRole('button')
      expect(results).toHaveLength(1)
      expect(results[0]).toHaveAccessibleName('Guitar')
    })

    it('creates a catalogue skill below 4 stars without asking for proof', async () => {
      const user = userEvent.setup()
      renderNewSkill()

      await startAdding(user, 'Guitar')
      await user.click(screen.getByRole('button', { name: 'Create skill' }))

      expect(screen.getByRole('status')).toHaveTextContent(/not wired up/i)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('blocks a rating of 4 stars or more with no proof, and accepts it once given', async () => {
      const user = userEvent.setup()
      renderNewSkill()

      await startAdding(user, 'Guitar')
      await user.click(screen.getByRole('button', { name: '5★' }))
      await user.click(screen.getByRole('button', { name: 'Create skill' }))
      expect(screen.getByRole('alert')).toHaveTextContent(/needs proof/i)

      await user.type(screen.getByLabelText('Proof'), 'Ten years of lessons')
      await user.click(screen.getByRole('button', { name: 'Create skill' }))
      expect(screen.getByRole('status')).toHaveTextContent(/not wired up/i)
    })

    it('creates a custom skill with an icon from the predefined set', async () => {
      const user = userEvent.setup()
      renderNewSkill()

      await user.click(screen.getByRole('button', { name: 'Create a custom skill' }))
      await user.type(screen.getByLabelText('Skill name'), 'Beekeeping')
      await user.click(screen.getByRole('button', { name: 'Books' }))
      await user.click(screen.getByRole('button', { name: 'Create skill' }))

      expect(screen.getByRole('status')).toHaveTextContent(/not wired up/i)
    })

    it('refuses a custom skill with no name, and one you already have', async () => {
      const user = userEvent.setup()
      renderNewSkill()

      await user.click(screen.getByRole('button', { name: 'Create a custom skill' }))
      await user.click(screen.getByRole('button', { name: 'Create skill' }))
      expect(screen.getByRole('alert')).toHaveTextContent(/name/i)

      await user.type(screen.getByLabelText('Skill name'), 'Cooking')
      await user.click(screen.getByRole('button', { name: 'Create skill' }))
      expect(screen.getByRole('alert')).toHaveTextContent(/already have a skill called Cooking/i)
    })

    it('backs out of a chosen draft to the chooser', async () => {
      const user = userEvent.setup()
      renderNewSkill()

      await startAdding(user, 'Guitar')
      expect(screen.getByLabelText('Description')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.getByLabelText('Search skills')).toBeInTheDocument()
    })
  })
})
