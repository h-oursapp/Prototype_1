import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StepPhoto } from '../../../pages/onboarding/StepPhoto'

function renderStep(onNext = vi.fn(), onSkip = vi.fn()) {
  render(<StepPhoto step={5} totalSteps={6} onNext={onNext} onSkip={onSkip} />)
  return { onNext, onSkip }
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  URL.revokeObjectURL = vi.fn()
})

describe('StepPhoto', () => {
  it('offers both a take-a-picture and a choose-from-phone button', () => {
    renderStep()

    expect(screen.getByLabelText('Take a picture')).toHaveAttribute('capture', 'user')
    expect(screen.getByLabelText('Choose from your phone')).not.toHaveAttribute('capture')
  })

  it('shows a preview once a picture is taken', async () => {
    const user = userEvent.setup()
    renderStep()

    const file = new File(['a'], 'me.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Take a picture'), file)

    expect(screen.getByRole('img', { name: 'Your chosen profile picture' })).toBeInTheDocument()
  })

  it('shows a preview once a picture is chosen from the phone instead', async () => {
    const user = userEvent.setup()
    renderStep()

    const file = new File(['a'], 'me.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Choose from your phone'), file)

    expect(screen.getByRole('img', { name: 'Your chosen profile picture' })).toBeInTheDocument()
  })

  it('calls onNext and onSkip regardless of whether a picture was chosen', async () => {
    const user = userEvent.setup()
    const { onNext, onSkip } = renderStep()

    await user.click(screen.getByText('Continue'))
    expect(onNext).toHaveBeenCalledTimes(1)

    await user.click(screen.getByText('Skip'))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})
