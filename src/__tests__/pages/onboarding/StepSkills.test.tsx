import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StepSkills } from '../../../pages/onboarding/StepSkills'

function renderStep(onNext = vi.fn(), onSkip = vi.fn()) {
  render(<StepSkills step={1} totalSteps={5} onNext={onNext} onSkip={onSkip} />)
  return { onNext, onSkip }
}

/** Picks "Guitar" from the catalogue and adds it with the default rating (no proof needed). */
async function addGuitar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Guitar/ }))
  await user.click(screen.getByRole('button', { name: 'Add skill' }))
}

describe('StepSkills', () => {
  it('starts with Continue disabled and a hint explaining why', () => {
    renderStep()

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    expect(screen.getByText(/Add at least one skill to continue/)).toBeInTheDocument()
  })

  it('adding a skill from the catalogue enables Continue and lists it', async () => {
    const user = userEvent.setup()
    renderStep()

    await addGuitar(user)

    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
    expect(screen.getByText('Guitar')).toBeInTheDocument()
  })

  it('calls onNext when Continue is pressed after a skill is added', async () => {
    const user = userEvent.setup()
    const { onNext } = renderStep()

    await addGuitar(user)
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('calls onSkip even with no skills added', async () => {
    const user = userEvent.setup()
    const { onSkip } = renderStep()

    await user.click(screen.getByText('Skip'))

    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('removing the only added skill disables Continue again', async () => {
    const user = userEvent.setup()
    renderStep()

    await addGuitar(user)
    await user.click(screen.getByRole('button', { name: 'Remove Guitar' }))

    // Guitar goes back into the catalogue's search results once removed from "added" — only the
    // removable chip itself (and the list it lived in) should be gone.
    expect(screen.queryByLabelText('Your added skills')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove Guitar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('creating a custom skill requires a name before it can be added', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.click(screen.getByRole('button', { name: 'Create a custom skill' }))
    await user.click(screen.getByRole('button', { name: 'Add skill' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Give the skill a name.')

    await user.type(screen.getByLabelText('Skill name'), 'Furniture restoration')
    await user.click(screen.getByRole('button', { name: 'Add skill' }))

    expect(screen.getByText('Furniture restoration')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  it('a 4★-and-up self-rating needs proof before it can be added', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.click(screen.getByRole('button', { name: /Guitar/ }))
    await user.click(screen.getByRole('button', { name: '4★' }))
    await user.click(screen.getByRole('button', { name: 'Add skill' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/needs proof/)

    await user.type(screen.getByLabelText('Proof'), 'Ten years of lessons')
    await user.click(screen.getByRole('button', { name: 'Add skill' }))

    expect(screen.getByText('Guitar')).toBeInTheDocument()
  })
})
