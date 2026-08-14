import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { trading } from '../routes'
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
  items: TransferBoxItem[]
  /** Singular/plural for what's being transferred — "item"/"items" or "skill"/"skills". This was
   *  the only real difference between InventoryPage's and SkillsPage's versions of this box. */
  noun: string
  pluralNoun: string
  tradeId: string
  partnerName: string
  /** Shows the "offer accepted" confirmation below the actions. Optional — a caller whose Accept
   *  navigates straight away (InventoryPage, on direct feedback) has nothing to confirm in place,
   *  so it simply never passes this. */
  isAccepted?: boolean
  onRemove: (id: string) => void
  onAccept: () => void
  /** Extra context between the drop area and the actions — Inventory's "still private" count.
   *  Optional: most callers have nothing to add here. */
  extraNote?: ReactNode
}

/** The "build an offer" zone shared by Inventory (§6) and Skills (TODO #6): a drop area
 *  (drag-and-drop is a placeholder everywhere in the prototype — items arrive via each page's own
 *  "Add to offer" button), Accept, and a link back to the trade being built.
 *
 *  Pulled out once both pages' versions were identical but for wording — the bar HANDOFF.md sets
 *  before extracting anything (see StarRating's own history): two real call sites, not a guess
 *  that a third might show up. */
export function TransferBox({
  items,
  noun,
  pluralNoun,
  tradeId,
  partnerName,
  isAccepted = false,
  onRemove,
  onAccept,
  extraNote,
}: TransferBoxProps) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">Your offer</h2>

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
            Drag-and-drop is not wired up in the prototype — use &quot;Add to offer&quot; on a{' '}
            {noun} above.
          </p>
        </div>

        {extraNote}

        <div className="transfer-box__actions">
          <Link className="transfer-box__secondary" to={trading(tradeId)}>
            Back to trading
          </Link>
          <button type="button" className="transfer-box__primary" onClick={onAccept}>
            Accept
          </button>
        </div>

        {isAccepted && (
          <p className="transfer-box__accepted" role="status">
            Offer accepted: {items.length} {items.length === 1 ? noun : pluralNoun} for the trade
            with {partnerName}.
          </p>
        )}

        <p className="page-note">
          Accept and Back-to-trading don't send anything anywhere — they confirm the offer in this
          screen's state only, and changing the offer afterwards withdraws that confirmation again.
        </p>
      </div>
    </section>
  )
}
