import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

beforeEach(() => {
  window.localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
})

describe('App', () => {
  it('walks from login through onboarding to the main page', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(screen.getByText('Add your skills')).toBeInTheDocument()
    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Skip'))
    await user.click(screen.getByText('Next'))

    expect(screen.getByText('Make it yours')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '4 per row' }))
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    await user.click(screen.getByText('Finish'))

    expect(screen.getByText('Ads')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(JSON.parse(window.localStorage.getItem('h-ours:settings') ?? '{}')).toEqual({
      colorTheme: 'dark',
      gridSize: 4,
    })
  })
})
