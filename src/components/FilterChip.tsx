import type { ReactNode } from 'react'
import './FilterChip.css'

interface FilterChipProps {
  /** The trigger button's own text — typically the filter's current value ("All", "Within 3 km"),
   *  so the row reads as a set of small value pickers rather than unlabelled icons. */
  label: string
  /** Whether the filter currently holds something other than its default — drawn as `is-active`,
   *  the same "this control isn't at its default" idiom OptionGroup and PageShell's header actions
   *  already use elsewhere in the app. */
  isActive: boolean
  isOpen: boolean
  onToggle: () => void
  /** The panel's contents, only mounted while `isOpen` — whatever picker fits the filter (an
   *  OptionGroup, a range input, a StarRatingInput, ...). This component only owns the "small
   *  button that reveals a floating panel underneath it" shell, not what's inside the panel. */
  children: ReactNode
}

/** First built for Search's three filters (TODO #13: "make the filters simple buttons that open a
 *  floating page"), reused as-is for Inventory's one visibility filter (TODO #9) — the shell is
 *  identical between them, only the panel content differs, which is exactly what `children` is
 *  for. Which filter is open, and whether that counts as "closed" for this one, is the caller's
 *  own state (SearchPage juggles three; Inventory just one) — this component only renders whatever
 *  it's told.
 *
 *  Must be rendered inside a `position: relative` row (SearchPage.css's `.search-page__filters`,
 *  Inventory's `.inventory-page__filters`) — the panel anchors to that row, not to this button, so
 *  it never has to worry about overflowing past the row's own right edge. That row must also never
 *  set `overflow-x`/`overflow-y`: CSS computes *both* axes to `auto` the moment either one isn't
 *  `visible`, and `overflow: auto` clips any descendant painting outside the box — including this
 *  panel, an absolutely-positioned descendant that needs to paint well past the row's own one-line
 *  height. That combination silently clipped the panel to invisible the first time this was
 *  written (see HANDOFF.md §8) — the three/one buttons involved are short enough to fit at any
 *  width this app targets, so there's no real need for the guard it would have provided anyway. */
export function FilterChip({ label, isActive, isOpen, onToggle, children }: FilterChipProps) {
  return (
    <>
      <button
        type="button"
        className={`filter-chip__trigger ${isActive ? 'is-active' : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        {label}
        <span aria-hidden="true"> ▾</span>
      </button>
      {isOpen && <div className="filter-chip__panel">{children}</div>}
    </>
  )
}

/** The "Done" button both of FilterChip's non-self-closing panels (Search's distance and rating,
 *  Inventory has none of these yet) end with — pulled out alongside FilterChip itself so a panel
 *  that adjusts rather than picks in one tap doesn't have to restyle its own closing button. */
export function FilterChipDone({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="filter-chip__done" onClick={onClick}>
      Done
    </button>
  )
}
