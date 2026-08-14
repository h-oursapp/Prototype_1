import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StarRating } from '../../components/StarRating'

describe('StarRating', () => {
  it('spells the rating out in its accessible name rather than as bare glyphs', () => {
    render(<StarRating value={4} subject="Web design" />)
    expect(screen.getByRole('img', { name: 'Web design: rated 4 out of 5' })).toBeInTheDocument()
  })

  it('draws filled and empty stars adding up to five', () => {
    const { container } = render(<StarRating value={3} subject="Cooking" />)
    expect(container.textContent).toBe('★★★☆☆')
  })

  it('handles both ends of the 0–5 range from §7/§8', () => {
    const { container: zero } = render(<StarRating value={0} subject="New skill" />)
    expect(zero.textContent).toBe('☆☆☆☆☆')

    const { container: full } = render(<StarRating value={5} subject="Piano" />)
    expect(full.textContent).toBe('★★★★★')
  })

  it('names the subject, so several ratings on one page stay tellable apart', () => {
    render(
      <>
        <StarRating value={5} subject="Web design" />
        <StarRating value={2} subject="Photography" />
      </>,
    )
    expect(screen.getByRole('img', { name: 'Web design: rated 5 out of 5' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Photography: rated 2 out of 5' })).toBeInTheDocument()
  })
})
