import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Offer } from '../../data/mockOffers'
import { GridSection } from '../../components/GridSection'

function makeOffers(count: number): Offer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i}`,
    title: `Offer ${i}`,
    icon: '🎸',
    kind: 'skill',
    hours: 1,
  }))
}

describe('GridSection', () => {
  it('shows a single tile in a 1x1 grid at grid size 1', () => {
    render(
      <GridSection
        heading="Ads"
        offers={makeOffers(5)}
        gridSize={1}
        openFullLabel="Open search"
        onOpenFull={vi.fn()}
        onSelectOffer={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('button', { name: /Offer \d/ })).toHaveLength(1)
    const grid = document.querySelector('.grid-section__grid') as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(1, 1fr)')
    expect(grid.style.gridTemplateRows).toBe('repeat(1, 1fr)')
  })

  it('shows an N x N grid of tiles, capped at N*N even with more offers available', () => {
    render(
      <GridSection
        heading="Ads"
        offers={makeOffers(10)}
        gridSize={3}
        openFullLabel="Open search"
        onOpenFull={vi.fn()}
        onSelectOffer={vi.fn()}
      />,
    )

    const grid = document.querySelector('.grid-section__grid') as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)')
    expect(grid.style.gridTemplateRows).toBe('repeat(3, 1fr)')
    expect(screen.getAllByRole('button', { name: /Offer \d/ })).toHaveLength(9)
  })

  it('keeps the full N x N grid frame (same locked cell size/spacing) even with too few offers to fill it', () => {
    render(
      <GridSection
        heading="Ads"
        offers={makeOffers(2)}
        gridSize={3}
        openFullLabel="Open search"
        onOpenFull={vi.fn()}
        onSelectOffer={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('button', { name: /Offer \d/ })).toHaveLength(2)
    const grid = document.querySelector('.grid-section__grid') as HTMLElement
    // Rows stay locked to grid size, not reduced to fit fewer offers — cells stay the same size.
    expect(grid.style.gridTemplateRows).toBe('repeat(3, 1fr)')
  })

  it('scales to a 4x4 grid at grid size 4', () => {
    render(
      <GridSection
        heading="Ads"
        offers={makeOffers(16)}
        gridSize={4}
        openFullLabel="Open search"
        onOpenFull={vi.fn()}
        onSelectOffer={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('button', { name: /Offer \d+/ })).toHaveLength(16)
  })

  it('calls onOpenFull when the corner arrow is pressed', async () => {
    const user = userEvent.setup()
    const onOpenFull = vi.fn()
    render(
      <GridSection
        heading="Ads"
        offers={makeOffers(4)}
        gridSize={2}
        openFullLabel="Open search"
        onOpenFull={onOpenFull}
        onSelectOffer={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Open search' }))
    expect(onOpenFull).toHaveBeenCalledTimes(1)
  })

  it('calls onSelectOffer with the tapped offer', async () => {
    const user = userEvent.setup()
    const onSelectOffer = vi.fn()
    const offers = makeOffers(4)
    render(
      <GridSection
        heading="Ads"
        offers={offers}
        gridSize={2}
        openFullLabel="Open search"
        onOpenFull={vi.fn()}
        onSelectOffer={onSelectOffer}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Offer 1' }))
    expect(onSelectOffer).toHaveBeenCalledWith(offers[1])
  })
})
