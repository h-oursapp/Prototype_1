import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StepVerify } from '../../../pages/onboarding/StepVerify'

function renderStep(onNext = vi.fn(), onSkip = vi.fn()) {
  render(<StepVerify step={3} totalSteps={5} onNext={onNext} onSkip={onSkip} />)
  return { onNext, onSkip }
}

beforeEach(() => {
  // jsdom doesn't implement the object-URL half of the URL API at all (unlike
  // navigator.clipboard, which exists but is getter-only) — these are plain stand-ins, not a
  // getter-workaround.
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  URL.revokeObjectURL = vi.fn()
})

describe('StepVerify', () => {
  it('shows a 5-digit verification code', () => {
    renderStep()

    expect(screen.getByLabelText(/Your verification code: \d{5}/)).toBeInTheDocument()
  })

  it('shows a photo preview once a picture is chosen, and relabels the button to "Retake"', async () => {
    const user = userEvent.setup()
    renderStep()

    const file = new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Take a picture'), file)

    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(screen.getByRole('img', { name: /verification picture/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Retake picture')).toBeInTheDocument()
  })

  it('revokes the previous object URL when a second photo replaces the first', async () => {
    const user = userEvent.setup()
    renderStep()

    const first = new File(['a'], 'first.jpg', { type: 'image/jpeg' })
    const second = new File(['b'], 'second.jpg', { type: 'image/jpeg' })

    await user.upload(screen.getByLabelText('Take a picture'), first)
    await user.upload(screen.getByLabelText('Retake picture'), second)

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('calls onNext and onSkip regardless of whether a photo was taken', async () => {
    const user = userEvent.setup()
    const { onNext, onSkip } = renderStep()

    await user.click(screen.getByText('Continue'))
    expect(onNext).toHaveBeenCalledTimes(1)

    await user.click(screen.getByText('Skip'))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})
