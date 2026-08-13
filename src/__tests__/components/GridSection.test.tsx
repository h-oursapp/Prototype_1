import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Offer } from '../../data/mockOffers'
import { GridSection } from '../../components/GridSection'

const OFFERS: Offer[] = [
  { id: '1', title: 'Guitar lessons', icon: '🎸' },
  { id: '2', title: 'Bike repair', icon: '🚲' },
]

describe('GridSection', () => {
  it('renders a tile per offer and applies the given grid size as columns', () => {
    render(
      <GridSection
        heading="Ads"
        offers={OFFERS}
        gridSize={3}
        openFullLabel="Open search"
        onOpenFull={vi.fn()}
        onSelectOffer={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Guitar lessons' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bike repair' })).toBeInTheDocument()
    const grid = document.querySelector('.grid-section__grid') as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)')
  })

  it('calls onOpenFull when the corner arrow is pressed', async () => {
    const user = userEvent.setup()
    const onOpenFull = vi.fn()
    render(
      <GridSection
        heading="Ads"
        offers={OFFERS}
        gridSize={3}
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
    render(
      <GridSection
        heading="Ads"
        offers={OFFERS}
        gridSize={3}
        openFullLabel="Open search"
        onOpenFull={vi.fn()}
        onSelectOffer={onSelectOffer}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Bike repair' }))
    expect(onSelectOffer).toHaveBeenCalledWith(OFFERS[1])
  })
})
