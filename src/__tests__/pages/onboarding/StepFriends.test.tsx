import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_INVITE_LINK } from '../../../data/mockCommunity'
import { StepFriends } from '../../../pages/onboarding/StepFriends'

function renderStep({ onNext = vi.fn(), onSkip = vi.fn(), copyLink = vi.fn().mockResolvedValue(undefined) } = {}) {
  render(<StepFriends step={2} totalSteps={5} onNext={onNext} onSkip={onSkip} copyLink={copyLink} />)
  return { onNext, onSkip, copyLink }
}

describe('StepFriends', () => {
  it('shows the invite link in a read-only field', () => {
    renderStep()

    const input = screen.getByLabelText('Your invite link')
    expect(input).toHaveValue(MOCK_INVITE_LINK)
    expect(input).toHaveAttribute('readonly')
  })

  it('copies the link and confirms it, when copying succeeds', async () => {
    const user = userEvent.setup()
    const { copyLink } = renderStep()

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(copyLink).toHaveBeenCalledWith(MOCK_INVITE_LINK)
    expect(await screen.findByRole('status')).toHaveTextContent('Copied to your clipboard.')
  })

  it('fails quietly, without a confirmation, when copying is rejected', async () => {
    const user = userEvent.setup()
    renderStep({ copyLink: vi.fn().mockRejectedValue(new Error('denied')) })

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('calls onNext on Continue and onSkip on Skip', async () => {
    const user = userEvent.setup()
    const { onNext, onSkip } = renderStep()

    await user.click(screen.getByText('Continue'))
    expect(onNext).toHaveBeenCalledTimes(1)

    await user.click(screen.getByText('Skip'))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})
