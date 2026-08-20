import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PagedGrid } from '../../components/PagedGrid'

function makeItems(count: number): { id: string; label: string }[] {
  return Array.from({ length: count }, (_, i) => ({ id: `item-${i}`, label: `Item ${i}` }))
}

describe('PagedGrid', () => {
  it('shows every item and no pager when they all fit on one page', () => {
    render(
      <PagedGrid
        items={makeItems(4)}
        getKey={(item) => item.id}
        renderTile={(item) => <button type="button">{item.label}</button>}
        columns={2}
        rows={2}
        gridLabel="Items"
      />,
    )

    expect(screen.getAllByRole('button', { name: /Item \d/ })).toHaveLength(4)
    expect(screen.queryByRole('group', { name: 'Items pages' })).not.toBeInTheDocument()
  })

  it('shows only one page of columns x rows items when there are more than fit', () => {
    render(
      <PagedGrid
        items={makeItems(10)}
        getKey={(item) => item.id}
        renderTile={(item) => <button type="button">{item.label}</button>}
        columns={2}
        rows={2}
        gridLabel="Items"
      />,
    )

    expect(screen.getAllByRole('button', { name: /Item \d/ })).toHaveLength(4)
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })

  it('moves forward and back a page, disabling the button at each end', async () => {
    const user = userEvent.setup()
    render(
      <PagedGrid
        items={makeItems(9)}
        getKey={(item) => item.id}
        renderTile={(item) => <span>{item.label}</span>}
        columns={2}
        rows={2}
        gridLabel="Items"
      />,
    )

    const previous = screen.getByRole('button', { name: 'Previous page' })
    const next = screen.getByRole('button', { name: 'Next page' })
    expect(previous).toBeDisabled()

    await user.click(next)
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    expect(screen.getByText('Item 4')).toBeInTheDocument()
    expect(previous).toBeEnabled()

    await user.click(next)
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    expect(screen.getByText('Item 8')).toBeInTheDocument()
    expect(next).toBeDisabled()

    await user.click(previous)
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
  })

  it('renders a single-row grid (rows=1) as one row of columns items per page', () => {
    render(
      <PagedGrid
        items={makeItems(3)}
        getKey={(item) => item.id}
        renderTile={(item) => <span>{item.label}</span>}
        columns={4}
        rows={1}
        gridLabel="Skills"
      />,
    )

    // The actual column/row track sizing lives in PagedGrid.css's calc(), keyed off these two
    // custom properties — not a great fit for jsdom (no real layout), so this only checks the
    // counts were passed through correctly.
    const grid = screen.getByRole('list', { name: 'Skills' })
    expect(grid.style.getPropertyValue('--pg-columns')).toBe('4')
    expect(grid.style.getPropertyValue('--pg-rows')).toBe('1')
    expect(screen.getAllByText(/Item \d/)).toHaveLength(3)
  })

  it('pads a short page with visibly empty cells rather than leaving a gap', () => {
    render(
      <PagedGrid
        items={makeItems(2)}
        getKey={(item) => item.id}
        renderTile={(item) => <button type="button">{item.label}</button>}
        columns={2}
        rows={2}
        gridLabel="Items"
      />,
    )

    // 2x2 = 4 cells total; 2 are real items, 2 are empty padding.
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getAllByRole('button', { name: /Item \d/ })).toHaveLength(2)
  })

  it("shows a dot per page instead of the buttons row when pagerVariant is 'floating-dots'", () => {
    render(
      <PagedGrid
        items={makeItems(9)}
        getKey={(item) => item.id}
        renderTile={(item) => <span>{item.label}</span>}
        columns={2}
        rows={2}
        gridLabel="Items"
        pagerVariant="floating-dots"
      />,
    )

    expect(screen.queryByRole('button', { name: 'Previous page' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Page \d of \d/)).not.toBeInTheDocument()
    const dots = screen.getAllByRole('button', { name: /^Page \d of 3$/ })
    expect(dots).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Page 1 of 3' })).toHaveAttribute('aria-current', 'true')
  })

  it('still shows a single dot when everything fits on one page (direct feedback)', () => {
    render(
      <PagedGrid
        items={makeItems(3)}
        getKey={(item) => item.id}
        renderTile={(item) => <span>{item.label}</span>}
        columns={2}
        rows={2}
        gridLabel="Items"
        pagerVariant="floating-dots"
      />,
    )

    const dots = screen.getAllByRole('button', { name: /^Page \d of 1$/ })
    expect(dots).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Page 1 of 1' })).toHaveAttribute('aria-current', 'true')
  })

  it('jumps straight to the tapped dot, no need to step through pages in between', async () => {
    const user = userEvent.setup()
    render(
      <PagedGrid
        items={makeItems(9)}
        getKey={(item) => item.id}
        renderTile={(item) => <span>{item.label}</span>}
        columns={2}
        rows={2}
        gridLabel="Items"
        pagerVariant="floating-dots"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Page 3 of 3' }))

    expect(screen.getByText('Item 8')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 3 of 3' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Page 1 of 3' })).not.toHaveAttribute('aria-current')
  })

  it('keeps empty padding cells out of the accessibility tree', () => {
    render(
      <PagedGrid
        items={makeItems(1)}
        getKey={(item) => item.id}
        renderTile={(item) => <button type="button">{item.label}</button>}
        columns={2}
        rows={1}
        gridLabel="Items"
      />,
    )

    const grid = screen.getByRole('list', { name: 'Items' })
    expect(grid.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
  })
})
