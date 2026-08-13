import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsProvider } from '../../settings/SettingsContext'
import { OnboardingPage } from './OnboardingPage'

beforeEach(() => {
  window.localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
})

function renderOnboarding(onComplete = vi.fn()) {
  render(
    <SettingsProvider>
      <OnboardingPage onComplete={onComplete} />
    </SettingsProvider>,
  )
  return onComplete
}

describe('OnboardingPage', () => {
  it('starts on the skills step and advances through Skip on each skippable step', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    expect(screen.getByText('Add your skills')).toBeInTheDocument()
    await user.click(screen.getByText('Skip'))
    expect(screen.getByText('Add friends')).toBeInTheDocument()
    await user.click(screen.getByText('Skip'))
    expect(screen.getByText('Verify your identity')).toBeInTheDocument()
    await user.click(screen.getByText('Skip'))
    expect(screen.getByText('How h_OURs works')).toBeInTheDocument()
  })

  it('advances via Continue just like Skip', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await user.click(screen.getByText('Continue'))
    expect(screen.getByText('Add friends')).toBeInTheDocument()
  })

  it('has no Skip button on the intro step, and Next leads to the customize step', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Skip'))
    expect(screen.getByText('How h_OURs works')).toBeInTheDocument()
    expect(screen.queryByText('Skip')).not.toBeInTheDocument()

    await user.click(screen.getByText('Next'))
    expect(screen.getByText('Make it yours')).toBeInTheDocument()
  })

  it('calls onComplete when Finish is pressed on the last step', async () => {
    const user = userEvent.setup()
    const onComplete = renderOnboarding()

    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Next'))
    expect(onComplete).not.toHaveBeenCalled()

    await user.click(screen.getByText('Finish'))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
