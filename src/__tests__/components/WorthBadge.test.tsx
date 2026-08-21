import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WorthBadge } from '../../components/WorthBadge'

describe('WorthBadge', () => {
  it('shows the worth as a compact "Nh" label', () => {
    render(<WorthBadge hours={6} />)

    expect(screen.getByText('6h')).toBeInTheDocument()
  })

  it('shows fractional hours as-is, no rounding', () => {
    render(<WorthBadge hours={0.25} />)

    expect(screen.getByText('0.25h')).toBeInTheDocument()
  })

  it('is purely decorative, since callers fold the worth into the tile\'s own accessible name', () => {
    render(<WorthBadge hours={2} />)

    expect(screen.getByText('2h')).toHaveAttribute('aria-hidden', 'true')
  })
})
