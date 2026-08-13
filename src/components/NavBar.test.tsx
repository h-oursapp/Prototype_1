import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NavBar } from './NavBar'

describe('NavBar', () => {
  it('renders all six nav items and marks the active one', () => {
    render(<NavBar hoursBalance={12} activeKey="home" onNavigate={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Profile' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Hours balance: 12, open wallet' })).toBeInTheDocument()
  })

  it('calls onNavigate with the pressed item key and label', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<NavBar hoursBalance={12} activeKey="home" onNavigate={onNavigate} />)

    await user.click(screen.getByRole('button', { name: 'Profile' }))
    expect(onNavigate).toHaveBeenCalledWith('profile', 'Profile')
  })
})
