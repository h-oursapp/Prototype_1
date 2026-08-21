import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import './PagedGrid.css'

/** `--pg-columns`/`--pg-rows` are CSS custom properties, not standard style fields, so
 *  `CSSProperties` needs a cast to accept them — the same shape React's own docs use for custom
 *  properties. PagedGrid.css does the actual square-cell math from these two counts. */
interface GridStyle extends CSSProperties {
  '--pg-columns': number
  '--pg-rows': number
}

interface PagedGridProps<T> {
  items: T[]
  /** React key for each item — same job as any other list's `key`, just pulled out as a prop so
   *  this component never has to assume items carry an `id` field. */
  getKey: (item: T) => string
  /** What one cell renders. Whatever it returns is expected to fill its cell on its own — the
   *  same assumption GridSection makes about SquareTile — so a cell is exactly one tile, never a
   *  tile plus extra controls underneath. Callers that need a "pick this" action alongside "view
   *  this" (as SkillsPage and InventoryPage's transfer boxes both do) render that as its own
   *  affordance on the tile itself, not as separate cell content — there's no spare vertical room
   *  for one in a page that isn't allowed to scroll. */
  renderTile: (item: T) => ReactNode
  columns: number
  rows: number
  /** Names the grid for assistive tech, and prefixes the pager's own group label. */
  gridLabel: string
  /** The pager's own look: 'buttons' (default) is the "← Page N of M →" row every existing caller
   *  (Inventory, Trading) already shows, flowing right after the grid — hidden entirely on a
   *  single page, since there's nothing to page through. 'dots' is a small dot-per-page strip,
   *  also flowing right after the grid (TODO #16's Offers page asked for it first, as a strip
   *  pinned to the viewport's own bottom edge instead — TODO #20's direct feedback moved it back
   *  in-flow once that collided with the nav bar itself; see PagedGrid.css for the fuller story).
   *  Tapping a dot jumps straight to that page — the only way to change pages at all once the
   *  prev/next buttons are gone. Unlike the buttons variant, a single dot still shows even on a
   *  single page (direct feedback, Inventory's Skills view): it's the one visible sign that this
   *  grid pages at all, which a page that always fits on one page (few skills, a small grid size)
   *  would otherwise never show. */
  pagerVariant?: 'buttons' | 'dots'
}

/** A non-scrollable, paged grid: one page of `columns × rows` tiles at a time, every page always
 *  showing exactly that many cells — real tiles first, then visibly empty ones — so a partial
 *  last page still reads as a complete, balanced grid rather than a lopsided short row.
 *
 *  This is GridSection's fixed-frame idea (a locked N×N grid that never grows past its own
 *  space) with paging instead of GridSection's "cap it and link to a full page" behaviour.
 *  That distinction is the whole reason this is a new component rather than a change to
 *  GridSection: Home links overflow *away*, to a page that scrolls (Offers/Search); Inventory and
 *  Trading (TODO #9/#11) *are* that page, and must stay non-scrolling regardless — so overflow is
 *  paged through in place instead.
 *
 *  `columns` and `rows` don't have to be equal — a single row (`rows={1}`) is exactly how the
 *  Trading page's skill and trading-table strips (TODO #11) use this same component. Cells always
 *  stay square: PagedGrid.css works out the largest cell size that fits `columns` of them across
 *  the frame's width *and* `rows` of them down its height *including the gaps between them*, then
 *  sizes the grid to exactly that many cells — so it uses as much of the available space as it can
 *  without ever distorting a cell, the same trick GridSection's own frame uses for the square-only
 *  case. Whichever dimension the frame is "generous" in is left over as even margin around the
 *  grid (via the frame's own centering) — that's an unavoidable consequence of staying square, not
 *  a bug. */
export function PagedGrid<T>({
  items,
  getKey,
  renderTile,
  columns,
  rows,
  gridLabel,
  pagerVariant = 'buttons',
}: PagedGridProps<T>) {
  const perPage = columns * rows
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const [page, setPage] = useState(0)
  // Clamped rather than reset by an effect: if `items` shrinks out from under a page that no
  // longer exists (e.g. a filter changes elsewhere), this settles on the new last page on the
  // very next render instead of needing a useEffect to notice and correct it.
  const currentPage = Math.min(page, totalPages - 1)
  const visibleItems = items.slice(currentPage * perPage, currentPage * perPage + perPage)
  // Always exactly `perPage` slots — a page short of real items pads out with empty ones instead
  // of leaving a gap-shaped hole in the last row.
  const slots: (T | null)[] = Array.from({ length: perPage }, (_, index) => visibleItems[index] ?? null)

  const gridStyle = { '--pg-columns': columns, '--pg-rows': rows } as GridStyle

  return (
    <div className="paged-grid">
      <div className="paged-grid__frame">
        <ul className="paged-grid__grid" style={gridStyle} aria-label={gridLabel}>
          {slots.map((item, index) =>
            item === null ? (
              <li className="paged-grid__cell" key={`empty-${index}`}>
                <span className="paged-grid__empty" aria-hidden="true" />
              </li>
            ) : (
              <li className="paged-grid__cell" key={getKey(item)}>
                {renderTile(item)}
              </li>
            ),
          )}
        </ul>
      </div>

      {pagerVariant === 'dots' ? (
        // No `totalPages > 1` gate here (unlike the buttons variant below) — see this prop's own
        // doc comment: a single dot on a single page is the point, not a bug.
        <div className="paged-grid__dots" role="group" aria-label={`${gridLabel} pages`}>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`paged-grid__dot ${index === currentPage ? 'is-active' : ''}`}
              aria-label={`Page ${index + 1} of ${totalPages}`}
              aria-current={index === currentPage ? 'true' : undefined}
              onClick={() => setPage(index)}
            />
          ))}
        </div>
      ) : (
        totalPages > 1 && (
          <div className="paged-grid__pager" role="group" aria-label={`${gridLabel} pages`}>
            <button
              type="button"
              className="paged-grid__pager-button"
              aria-label="Previous page"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <span aria-hidden="true">←</span>
            </button>
            <span className="paged-grid__pager-label" aria-live="polite">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              type="button"
              className="paged-grid__pager-button"
              aria-label="Next page"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )
      )}
    </div>
  )
}
