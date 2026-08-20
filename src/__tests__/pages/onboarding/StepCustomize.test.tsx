import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SEARCH_FILTERS } from '../../../data/searchFilters'
import { SettingsProvider } from '../../../settings/SettingsContext'
import { StepCustomize } from '../../../pages/onboarding/StepCustomize'

beforeEach(() => {
  window.localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
})

describe('StepCustomize', () => {
  it('lets the user change grid size and color theme, persisting via SettingsContext', async () => {
    const user = userEvent.setup()
    render(
      <SettingsProvider>
        <StepCustomize step={5} totalSteps={5} onFinish={vi.fn()} />
      </SettingsProvider>,
    )

    await user.click(screen.getByRole('button', { name: '4 per row' }))
    await user.click(screen.getByRole('button', { name: 'Dark' }))

    expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
      defaultSearchFilters: DEFAULT_SEARCH_FILTERS,
      inventoryScrollable: false,
    })
  })

  it('changes profile visibility selection locally without persisting it', async () => {
    const user = userEvent.setup()
    render(
      <SettingsProvider>
        <StepCustomize step={5} totalSteps={5} onFinish={vi.fn()} />
      </SettingsProvider>,
    )

    const privateButton = screen.getByRole('button', { name: 'Private' })
    await user.click(privateButton)
    expect(privateButton).toHaveAttribute('aria-pressed', 'true')

    const stored = JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')
    expect(stored).not.toHaveProperty('profileVisibility')
  })

  it('calls onFinish when Finish is pressed', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(
      <SettingsProvider>
        <StepCustomize step={5} totalSteps={5} onFinish={onFinish} />
      </SettingsProvider>,
    )

    await user.click(screen.getByText('Finish'))
    expect(onFinish).toHaveBeenCalledTimes(1)
  })
})
