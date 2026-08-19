import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RatingBadge } from '../../components/RatingBadge'

describe('RatingBadge', () => {
  it('shows the rating as a compact "N★" label', () => {
    render(<RatingBadge value={4} />)

    expect(screen.getByText('4★')).toBeInTheDocument()
  })

  it('is purely decorative, since callers fold the rating into the tile\'s own accessible name', () => {
    render(<RatingBadge value={5} />)

    expect(screen.getByText('5★')).toHaveAttribute('aria-hidden', 'true')
  })
})
