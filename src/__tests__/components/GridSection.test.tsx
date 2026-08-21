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
    render(<GridSection heading="Ads" offers={makeOffers(5)} gridSize={1} onSelectOffer={() => {}} />)

    expect(screen.getAllByRole('button', { name: /^Offer \d,/ })).toHaveLength(1)
  })

  // jsdom never lays anything out, so useFittingRows falls back to its minRows default (gridSize
  // itself) here — see useFittingRows.test.tsx for the real measured-height arithmetic.
  it('caps at N x N tiles at grid size N, before any real layout exists (TODO #3)', () => {
    render(<GridSection heading="Ads" offers={makeOffers(10)} gridSize={3} onSelectOffer={() => {}} />)

    expect(screen.getAllByRole('button', { name: /^Offer \d,/ })).toHaveLength(9)
  })

  it('shows every offer, not just a full page of them, when there are too few to fill the grid', () => {
    render(<GridSection heading="Ads" offers={makeOffers(2)} gridSize={3} onSelectOffer={() => {}} />)

    expect(screen.getAllByRole('button', { name: /^Offer \d,/ })).toHaveLength(2)
  })

  it('fits more rows onto the page once the grid area actually measures taller than the fallback', () => {
    const original = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = () => ({ width: 390, height: 900 }) as DOMRect

    try {
      // 3 columns (the given grid size) x 6 rows fit a 390x900 box with no pager to reserve room
      // for (GridSection passes reserveBottomPx={0}) — see useFittingRows.test.tsx for the
      // arithmetic this mirrors. 20 offers is more than the 18 cells that makes.
      render(<GridSection heading="Ads" offers={makeOffers(20)} gridSize={3} onSelectOffer={() => {}} />)

      expect(screen.getAllByRole('button', { name: /^Offer \d+,/ })).toHaveLength(18)
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original
    }
  })

  it('calls onSelectOffer with the tapped offer', async () => {
    const user = userEvent.setup()
    const onSelectOffer = vi.fn()
    const offers = makeOffers(4)
    render(<GridSection heading="Ads" offers={offers} gridSize={2} onSelectOffer={onSelectOffer} />)

    await user.click(screen.getByRole('button', { name: /^Offer 1,/ }))
    expect(onSelectOffer).toHaveBeenCalledWith(offers[1])
  })

  it('shows the offer name and a compact "N★" rating badge, not a full star row (TODO #3)', () => {
    render(
      <GridSection
        heading="Ads"
        offers={[{ id: '1', title: 'Guitar lessons', icon: '🎸', kind: 'skill', hours: 2, rating: 4 }]}
        gridSize={2}
        onSelectOffer={() => {}}
      />,
    )

    expect(screen.getByText('Guitar lessons')).toBeInTheDocument()
    expect(screen.getByText('4★')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guitar lessons, rated 4 out of 5' })).toBeInTheDocument()
    // A skill offer has no worth — that badge is item-only.
    expect(screen.queryByText('2h')).toBeNull()
  })

  it('shows a "Nh" worth badge on an item offer\'s tile, reading its existing `hours` price ("show the worth of item offers")', () => {
    render(
      <GridSection
        heading="Ads"
        offers={[{ id: '1', title: 'Wooden chair', icon: '🪑', kind: 'item', hours: 4, rating: 4 }]}
        gridSize={2}
        onSelectOffer={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Wooden chair, rated 4 out of 5, worth 4h' })).toBeInTheDocument()
    expect(screen.getByText('4h')).toBeInTheDocument()
  })

  it('names the grid after its heading for assistive tech', () => {
    render(<GridSection heading="Ads" offers={makeOffers(2)} gridSize={2} onSelectOffer={() => {}} />)

    expect(within(screen.getByRole('list', { name: 'Ads' })).getAllByRole('listitem')).toHaveLength(4)
  })
})
