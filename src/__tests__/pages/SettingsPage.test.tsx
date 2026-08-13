import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsProvider } from '../../settings/SettingsContext'
import { SettingsPage } from '../../pages/SettingsPage'

beforeEach(() => {
  window.localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
})

function renderSettingsPage(onBack = vi.fn()) {
  render(
    <SettingsProvider>
      <SettingsPage onBack={onBack} />
    </SettingsProvider>,
  )
  return onBack
}

describe('SettingsPage', () => {
  it('reflects the current grid size and color theme', () => {
    renderSettingsPage()
    expect(screen.getByRole('button', { name: '3 per row' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('updates and persists grid size and color theme', async () => {
    const user = userEvent.setup()
    renderSettingsPage()

    await user.click(screen.getByRole('button', { name: '2 per row' }))
    await user.click(screen.getByRole('button', { name: 'Dark' }))

    expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toEqual({
      colorTheme: 'dark',
      gridSize: 2,
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('calls onBack when the back button is pressed', async () => {
    const user = userEvent.setup()
    const onBack = renderSettingsPage()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
