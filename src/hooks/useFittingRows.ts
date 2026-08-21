import { useLayoutEffect, useRef, useState } from 'react'

/** Mirrors PagedGrid.css's own `--pg-gap` formula (`clamp(2px, 2cqw, 12px)`, read against the
 *  frame's own width) so the row count this file computes lines up with the cell size PagedGrid
 *  actually renders at. Kept in sync by hand rather than shared code — the CSS can't call into
 *  JS, so *some* duplication between the two is unavoidable; this comment is the tripwire. */
function gapForWidth(width: number): number {
  return Math.min(12, Math.max(2, width * 0.02))
}

/** PagedGrid's pager row ("← Page 1 of 3 →") only appears once there's more than one page, which
 *  isn't known until after rows are decided — a real chicken-and-egg. Reserving its height up
 *  front avoids the alternative (rows computed too high, then the pager itself squeezing the grid
 *  smaller than PagedGrid.css's own math assumed); the cost is a few spare pixels at the bottom on
 *  the rare page that turns out not to need a pager at all. */
const PAGER_ALLOWANCE_PX = 40

/** Same idea as `PAGER_ALLOWANCE_PX`, sized for PagedGrid's `pagerVariant="dots"` row instead —
 *  exported (unlike `PAGER_ALLOWANCE_PX` above) because that variant isn't the default, so every
 *  caller using it has to pass this explicitly (TODO #20: the dots used to float fixed over the
 *  viewport, needing no reserved room at all — see PagedGrid.css's own history on why that stopped
 *  working — and now flow after the grid like the buttons row does, so callers reserve space for
 *  them the same way). Kept in sync by hand with `.paged-grid__dots`' own height (PagedGrid.css:
 *  an 8px dot plus its padding) — there's no way for CSS to hand this number to JS, same tradeoff
 *  `gapForWidth`'s own comment already makes peace with. */
export const DOTS_ALLOWANCE_PX = 24

/** How many rows of square, `columns`-wide cells fit a `width`×`height` box, without any row
 *  spilling past its bottom edge. `columns` is a fixed setting (the grid-size picker); rows is the
 *  one this solves for — see useFittingRows below for why that split exists.
 *
 *  `reserveBottomPx` defaults to PagedGrid's own pager allowance, since that's who this was
 *  written for — a caller whose grid never pages (Home's Ads grid, TODO #3) has no such row to
 *  reserve and passes 0 instead, recovering every pixel a pager would otherwise have sat in.
 *
 *  Exported on its own (rather than folded into the hook) so the arithmetic can be tested directly
 *  with plain numbers, no DOM or ResizeObserver involved. */
export function fittingRows(
  width: number,
  height: number,
  columns: number,
  minRows: number,
  reserveBottomPx: number = PAGER_ALLOWANCE_PX,
): number {
  if (width <= 0 || height <= 0 || columns <= 0) return minRows

  const gap = gapForWidth(width)
  const cell = (width - (columns - 1) * gap) / columns
  const usableHeight = height - reserveBottomPx
  const rows = Math.floor((usableHeight + gap) / (cell + gap))

  return Math.max(minRows, rows)
}

/** TODO #9: "columns by the setting and rows as many as fits" — Inventory's grid used to run the
 *  same gridSize setting into *both* PagedGrid dimensions (a fixed N×N page); this measures the
 *  actual space available instead, so a tall viewport gets more rows per page rather than more
 *  pages.
 *
 *  Before the first real measurement (and in jsdom, which never lays anything out — see
 *  useFittingRows.test.tsx) `width`/`height` read as 0, and `fittingRows` falls back to
 *  `minRows`. Defaulting `minRows` to `columns` itself means that fallback is exactly today's old
 *  N×N behaviour, not an arbitrary single row — a reasonable guess for the one frame before layout
 *  is known, and the reason existing Inventory tests don't need any DOM-geometry stubbing to keep
 *  seeing a 3×3 page at the default grid size.
 *
 *  `reserveBottomPx` passes straight through to `fittingRows` — see its own doc comment. */
export function useFittingRows(
  columns: number,
  minRows: number = columns,
  reserveBottomPx: number = PAGER_ALLOWANCE_PX,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState(minRows)

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return

    const measure = () => {
      const { width, height } = element.getBoundingClientRect()
      setRows(fittingRows(width, height, columns, minRows, reserveBottomPx))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [columns, minRows, reserveBottomPx])

  return { containerRef, rows }
}
