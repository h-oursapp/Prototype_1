import { render, screen, within } from '@testing-library/react'
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
    rating: 4,
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
        arrowSide="right"
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
        arrowSide="right"
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
        arrowSide="right"
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
        arrowSide="right"
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
        arrowSide="right"
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
        arrowSide="right"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Offer 1' }))
    expect(onSelectOffer).toHaveBeenCalledWith(offers[1])
  })

  it('overlays each tile with the offer name and star rating (TODO #3)', () => {
    render(
      <GridSection
        heading="Ads"
        offers={[{ id: '1', title: 'Guitar lessons', icon: '🎸', kind: 'skill', hours: 2, rating: 4 }]}
        gridSize={2}
        openFullLabel="Open search"
        onOpenFull={vi.fn()}
        onSelectOffer={vi.fn()}
        arrowSide="right"
      />,
    )

    expect(screen.getByText('Guitar lessons')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: "Guitar lessons's rating: rated 4 out of 5" })).toBeInTheDocument()
  })

  it('puts the corner arrow on the given side and always centers the heading (TODO #3)', () => {
    render(
      <GridSection
        heading="Your offers"
        offers={[]}
        gridSize={2}
        openFullLabel="Open your offers"
        onOpenFull={vi.fn()}
        onSelectOffer={vi.fn()}
        arrowSide="left"
      />,
    )

    const header = screen.getByText('Your offers').closest('header') as HTMLElement
    expect(header).toHaveClass('grid-section__header--arrow-left')
    expect(within(header).getByText('←')).toBeInTheDocument()
  })

  it('reserves the grid\'s last cell for a create-new tile when there is room to spare', () => {
    render(
      <GridSection
        heading="Your offers"
        offers={makeOffers(3)}
        gridSize={2}
        openFullLabel="Open your offers"
        onOpenFull={vi.fn()}
        onSelectOffer={vi.fn()}
        arrowSide="left"
        onCreateNew={vi.fn()}
        createLabel="Create new offer"
      />,
    )

    // gridSize 2 -> 4 cells, one reserved for the create tile -> all 3 offers still fit.
    expect(screen.getAllByRole('button', { name: /Offer \d/ })).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Create new offer' })).toBeInTheDocument()
  })

  it('drops the last offer in favor of the create-new tile once the grid is already full', async () => {
    const user = userEvent.setup()
    const onCreateNew = vi.fn()
    render(
      <GridSection
        heading="Your offers"
        offers={makeOffers(4)}
        gridSize={2}
        openFullLabel="Open your offers"
        onOpenFull={vi.fn()}
        onSelectOffer={vi.fn()}
        arrowSide="left"
        onCreateNew={onCreateNew}
        createLabel="Create new offer"
      />,
    )

    expect(screen.getAllByRole('button', { name: /Offer \d/ })).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: 'Create new offer' }))
    expect(onCreateNew).toHaveBeenCalledTimes(1)
  })

  it('has no create-new tile when onCreateNew is omitted (Ads has nothing to create)', () => {
    render(
      <GridSection
        heading="Ads"
        offers={makeOffers(4)}
        gridSize={2}
        openFullLabel="Open search"
        onOpenFull={vi.fn()}
        onSelectOffer={vi.fn()}
        arrowSide="right"
      />,
    )

    expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument()
  })
})
