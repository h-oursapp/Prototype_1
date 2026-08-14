import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { FinalReviewPage } from '../../pages/FinalReviewPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

/** trade-3 is 'Spanish tutoring' with Aisha M. — an agreed trade, the state Final Review is
 *  reached from. */
function renderFinalReview(tradeId = 'trade-3') {
  renderWithRouter(<FinalReviewPage />, {
    route: `/trades/${tradeId}/review`,
    path: '/trades/:tradeId/review',
  })
}

describe('FinalReviewPage', () => {
  it('shows the trade being closed', () => {
    renderFinalReview()

    expect(screen.getByRole('heading', { name: 'Spanish tutoring' })).toBeInTheDocument()
    expect(screen.getByText(/Aisha M\. · 4 h · Agreed/)).toBeInTheDocument()
  })

  it('keeps the skill rating and the personal rating as separate controls', () => {
    renderFinalReview()

    const skillRating = screen.getByRole('group', { name: 'Skill rating' })
    const personalRating = screen.getByRole('group', { name: 'Personal rating' })

    // 0–5★, so six choices per rating.
    expect(within(skillRating).getAllByRole('radio')).toHaveLength(6)
    expect(within(personalRating).getAllByRole('radio')).toHaveLength(6)
    expect(skillRating).not.toContainElement(personalRating)
  })

  it('takes a star selection for each rating independently', async () => {
    const user = userEvent.setup()
    renderFinalReview()

    await user.click(screen.getByRole('radio', { name: 'Skill rating: Rate 4 out of 5' }))
    await user.click(screen.getByRole('radio', { name: 'Personal rating: Rate 5 out of 5' }))

    expect(screen.getByRole('radio', { name: 'Skill rating: Rate 4 out of 5' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Personal rating: Rate 5 out of 5' })).toBeChecked()
    // Rating the person 5 must not drag the skill rating along with it.
    expect(screen.getByRole('radio', { name: 'Skill rating: Rate 5 out of 5' })).not.toBeChecked()
  })

  it('closes the trade on submit and reports both ratings', async () => {
    const user = userEvent.setup()
    renderFinalReview()

    await user.click(screen.getByRole('radio', { name: 'Skill rating: Rate 4 out of 5' }))
    await user.click(screen.getByRole('radio', { name: 'Personal rating: Rate 5 out of 5' }))
    await user.click(screen.getByRole('button', { name: 'Close trade' }))

    expect(screen.getByRole('heading', { name: 'Trade closed' })).toBeInTheDocument()
    expect(screen.getByText(/Skill rating 4 of 5, personal rating 5 of 5/)).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Skill rating' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Back to Trades' })).toBeInTheDocument()
  })

  it('says that closing the trade does not persist', async () => {
    const user = userEvent.setup()
    renderFinalReview()

    await user.click(screen.getByRole('button', { name: 'Close trade' }))
    expect(screen.getByText(/nothing is saved/i)).toBeInTheDocument()
  })

  it('notes the friend request or community invite without sending one', async () => {
    const user = userEvent.setup()
    renderFinalReview()

    await user.click(
      screen.getByRole('button', { name: 'Send Aisha M. a friend request or community invite' }),
    )

    const invite = screen.getByRole('button', { name: 'Invite noted for Aisha M.' })
    expect(invite).toBeDisabled()
    expect(screen.getByText(/pressing this sends nothing/i)).toBeInTheDocument()
  })

  it('shows a not-found state with a way back for an unknown trade id', async () => {
    const user = userEvent.setup()
    renderFinalReview('no-such-trade')

    expect(screen.getByRole('heading', { name: 'Trade not found' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close trade' })).toBeNull()

    // Navigating away leaves the review route, so the not-found state stops rendering.
    await user.click(screen.getByRole('button', { name: 'Back to Trades' }))
    expect(screen.queryByRole('heading', { name: 'Trade not found' })).toBeNull()
  })
})
