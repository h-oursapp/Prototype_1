import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { fittingRows, useFittingRows } from '../../hooks/useFittingRows'

describe('fittingRows', () => {
  it('fits more rows into a taller box at the same width and column count', () => {
    const short = fittingRows(390, 300, 3, 1)
    const tall = fittingRows(390, 700, 3, 1)

    expect(tall).toBeGreaterThan(short)
  })

  it('never returns fewer than minRows, however little height is given', () => {
    expect(fittingRows(390, 1, 3, 2)).toBe(2)
  })

  it('falls back to minRows when the box has no real size yet (width or height is 0)', () => {
    expect(fittingRows(0, 500, 3, 3)).toBe(3)
    expect(fittingRows(500, 0, 3, 3)).toBe(3)
  })

  it('falls back to minRows for a nonsensical column count instead of dividing by zero', () => {
    expect(fittingRows(390, 500, 0, 1)).toBe(1)
  })
})

/** A tiny harness so useFittingRows' own state/effect wiring — not just the pure math above — gets
 *  exercised: it renders the measured row count as text, using whatever `getBoundingClientRect`
 *  the test has stubbed onto the ref'd element beforehand. */
function FittingRowsProbe({ columns, minRows }: { columns: number; minRows?: number }) {
  const { containerRef, rows } = useFittingRows(columns, minRows)
  return (
    <div ref={containerRef}>
      <p>Rows: {rows}</p>
    </div>
  )
}

describe('useFittingRows', () => {
  it('reports minRows (defaulting to columns) before any real layout exists, as in jsdom', () => {
    render(<FittingRowsProbe columns={3} />)

    expect(screen.getByText('Rows: 3')).toBeInTheDocument()
  })

  it('reports more than the fallback once the container measures tall enough for it', () => {
    const getBoundingClientRect = () =>
      ({ width: 390, height: 900 }) as DOMRect

    // jsdom's default is a real (if inert) getBoundingClientRect, always {0,0,0,0} — replacing it
    // on the prototype for this one test is what stands in for "the browser actually laid this
    // out", without needing a real browser (see CLAUDE.md: skip visual/browser testing).
    const original = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = getBoundingClientRect

    try {
      render(<FittingRowsProbe columns={3} />)
      const expectedRows = fittingRows(390, 900, 3, 3)

      expect(screen.getByText(`Rows: ${expectedRows}`)).toBeInTheDocument()
      expect(expectedRows).toBeGreaterThan(3)
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original
    }
  })
})
