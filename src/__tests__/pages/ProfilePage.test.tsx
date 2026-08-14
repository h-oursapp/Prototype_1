import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_PROFILE, MOCK_REVIEWS } from '../../data/mockUser'
import { ProfilePage } from '../../pages/ProfilePage'
import { ROUTES } from '../../routes'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

/** The page navigates rather than calling props, so the spy replaces useNavigate. vi.hoisted is
 *  what lets the spy exist before vi.mock's factory runs. */
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

  it('shows the highest-rated skills with their ratings, and not the rest', () => {
    renderWithRouter(<ProfilePage />)
    const bestSkills = within(screen.getByRole('list', { name: 'Your best skills' }))

    expect(bestSkills.getByText('Web design')).toBeInTheDocument()
    expect(bestSkills.getByRole('img', { name: 'Web design: rated 5 out of 5' })).toBeInTheDocument()
    expect(bestSkills.getByText('Piano')).toBeInTheDocument()
    // Photography is the lowest-rated skill, so it doesn't make the shortlist.
    expect(bestSkills.queryByText('Photography')).not.toBeInTheDocument()
  })

  it('shows the reviews from recent trades with both ratings', () => {
    renderWithRouter(<ProfilePage />)
    const reviews = within(screen.getByRole('list', { name: 'Reviews from recent trades' }))
    const [first] = MOCK_REVIEWS

    expect(reviews.getByText(first.author)).toBeInTheDocument()
    expect(reviews.getByText(first.comment)).toBeInTheDocument()
    expect(
      reviews.getByRole('img', { name: `Personal rating from ${first.author}: rated ${first.personalRating} out of 5` }),
    ).toBeInTheDocument()
    expect(reviews.getAllByRole('listitem')).toHaveLength(MOCK_REVIEWS.length)
  })

  it('goes to Settings from the header button', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.settings)
  })

  it('goes to the Skills page', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: 'All skills' }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.skills)
  })
})
