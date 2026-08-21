import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './TransferBox.css'

export interface TransferBoxItem {
  id: string
  name: string
  icon: string
  /** A small flag next to the item — e.g. Inventory's "Private" badge on something that won't
   *  reach the trading partner. Only some callers have anything to say here; Skills doesn't. */
  note?: string
}

interface TransferBoxProps {
  /** TODO #9.1: "the text 'your offer' replace it with 'Trading with XY'" — only Inventory's
   *  trade-context call site passes this; the ad-picker keeps the generic default below, since
   *  there's no partner name to put in its place. */
  heading?: string
  items: TransferBoxItem[]
  /** Singular noun for what's being transferred — named in the drag-and-drop note below
   *  ("use '{pickActionLabel}' on a {noun} above"). */
  noun: string
  /** What the picking control on the page above is actually called — "Add to offer" while
   *  building a trade, "Use for this ad" while picking a new ad's one subject (TODO #8). Named by
   *  the caller rather than assumed, since the two contexts use different words for it. */
  pickActionLabel: string
  /** Link back to wherever this box was opened from. A trade goes "Back to trading"; picking a
   *  new ad's subject goes back to the ad draft instead — generalized out of a hardcoded
   *  `tradeId`/"Back to trading" so both contexts (TODO #8) can share this component. */
  backTo: { label: string; path: string }
  primaryLabel: string
  onPrimary: () => void
  /** Disables the primary button — e.g. the ad-picker has nothing to confirm until something has
   *  been picked. Trades never disable it (an empty offer can still be "Accept"ed today), so this
   *  defaults to false. */
  primaryDisabled?: boolean
  /** Shows a confirmation message below the actions once the primary action has been taken
   *  without navigating away. Optional — a caller whose primary action leaves the page immediately
   *  (InventoryPage's Accept, on direct feedback, and the ad-picker's confirm) has nothing left to
   *  confirm in place. */
  confirmedMessage?: string
  onRemove: (id: string) => void
  /** Extra context between the drop area and the actions — Inventory's "still private" count.
   *  Optional: most callers have nothing to add here. */
  extraNote?: ReactNode
}

/** The "build an offer" zone shared by Inventory (§6), Skills (TODO #6) and, since TODO #8, both
 *  pages again while picking the one subject of a brand-new ad: a drop area (drag-and-drop is a
 *  placeholder everywhere in the prototype — items arrive via each page's own picking control),
 *  a primary confirm action, and a link back to wherever the box was opened from.
 *
 *  Pulled out once both pages' trade-context versions were identical but for wording — the bar
 *  HANDOFF.md sets before extracting anything (see StarRating's own history): two real call sites,
 *  not a guess that a third might show up. TODO #8 generalized `tradeId`/`partnerName`/"Back to
 *  trading" into `backTo`/`primaryLabel`/`onPrimary` for the same reason, once picking a new ad's
 *  subject became a second real context this same box needed to serve. */
export function TransferBox({
  heading = 'Your offer',
  items,
  noun,
  pickActionLabel,
  backTo,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  confirmedMessage,
  onRemove,
  extraNote,
}: TransferBoxProps) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">{heading}</h2>

      <div className="page-card transfer-box">
        <div className="transfer-box__drop" role="group" aria-label="Your offer for this trade">
          {items.length === 0 ? (
            <p className="transfer-box__empty">Nothing in the offer yet.</p>
          ) : (
            <ul className="transfer-box__items">
              {items.map((item) => (
                <li className="transfer-box__item" key={item.id}>
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="transfer-box__name">{item.name}</span>
                  {item.note !== undefined && <span className="transfer-box__flag">{item.note}</span>}
                  <button
                    type="button"
                    className="transfer-box__remove"
                    aria-label={`Remove ${item.name} from your offer`}
                    onClick={() => onRemove(item.id)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="page-note">
            Drag-and-drop is not wired up in the prototype — use &quot;{pickActionLabel}&quot; on a{' '}
            {noun} above.
          </p>
        </div>

        {extraNote}

        <div className="transfer-box__actions">
          <Link className="transfer-box__secondary" to={backTo.path}>
            {backTo.label}
          </Link>
          <button type="button" className="transfer-box__primary" onClick={onPrimary} disabled={primaryDisabled}>
            {primaryLabel}
          </button>
        </div>

        {confirmedMessage !== undefined && (
          <p className="transfer-box__accepted" role="status">
            {confirmedMessage}
          </p>
        )}

        <p className="page-note">
          {backTo.label} and {primaryLabel} don&apos;t send anything anywhere — they confirm the
          offer in this screen&apos;s state only, and changing the offer afterwards withdraws that
          confirmation again.
        </p>
      </div>
    </section>
  )
}
