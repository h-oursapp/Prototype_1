import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import type { InventoryItem } from '../data/mockInventory'
import { findItem } from '../data/mockInventory'
import { findTrade } from '../data/mockTrades'
import { ROUTES, inventoryForTrade } from '../routes'
import './ItemPage.css'

/** The editable half of an item. Kept a plain object, same shape as AdDetailPage's `AdDraft` —
 *  nothing here is validated, and nothing is saved anywhere. */
interface ItemDraft {
  name: string
  icon: string
  description: string
  /** Appkarte §6: only public items are visible to a trading partner — the "plus public/private
   *  switch" TODO #10 asks for. */
  isPublic: boolean
}

/** §10: items pick their icon from a small predefined set rather than uploading a photo — the
 *  same substitute SkillPage's custom-skill icons already use, for the same reason (no photo
 *  upload exists in the prototype). Named so assistive tech reads out more than a bare emoji. */
const ITEM_ICONS = [
  { icon: '📦', name: 'Box' },
  { icon: '🛠️', name: 'Tools' },
  { icon: '🎸', name: 'Guitar' },
  { icon: '📷', name: 'Camera' },
  { icon: '🪑', name: 'Chair' },
  { icon: '🧵', name: 'Thread' },
  { icon: '🍞', name: 'Bread' },
  { icon: '📚', name: 'Books' },
]

const EMPTY_DRAFT: ItemDraft = { name: '', icon: ITEM_ICONS[0].icon, description: '', isPublic: true }

type Visibility = 'public' | 'private'

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

function toDraft(item: InventoryItem): ItemDraft {
  return { name: item.name, icon: item.icon, description: item.description ?? '', isPublic: item.isPublic }
}

interface ItemGalleryProps {
  icon: string
  isEditable: boolean
  onSelectIcon: (icon: string) => void
}

/** §10 "looks similar to the ad": the same picture-on-top frame AdDetailPage uses, standing in
 *  for a photo. There's no upload here either, so edit mode swaps AdDetailPage's "+ Photo" thumb
 *  for a small icon picker instead — the one way this item's picture can actually change. */
function ItemGallery({ icon, isEditable, onSelectIcon }: ItemGalleryProps) {
  return (
    <section className="page-section item-page__gallery">
      <div className="item-page__frame">
        <span className="item-page__icon" aria-hidden="true">
          {icon}
        </span>
      </div>

      {isEditable && (
        <fieldset className="item-page__icons">
          <legend>Icon</legend>
          <div className="item-page__icon-row">
            {ITEM_ICONS.map((option) => (
              <button
                key={option.icon}
                type="button"
                className={`item-page__icon-option ${icon === option.icon ? 'is-active' : ''}`}
                aria-pressed={icon === option.icon}
                aria-label={option.name}
                onClick={() => onSelectIcon(option.icon)}
              >
                <span aria-hidden="true">{option.icon}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <p className="page-note">
        Placeholder gallery: the item&apos;s icon stands in for a photo, and photo upload is not
        wired up.
      </p>
    </section>
  )
}

/** The text half, not editing (mirrors AdDetailPage's AdDetails). Visibility is the one fact this
 *  page has that an ad's details don't — TODO #10's whole reason for existing. */
function ItemDetails({ draft }: { draft: ItemDraft }) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">Details</h2>
      <div className="page-card">
        <dl className="item-page__facts">
          <div className="item-page__fact">
            <dt className="item-page__fact-label">Visibility</dt>
            <dd className="item-page__fact-value">{draft.isPublic ? 'Public' : 'Private'}</dd>
          </div>
        </dl>

        <p className="item-page__description">
          {draft.description.trim() === '' ? 'No description yet.' : draft.description}
        </p>
      </div>
    </section>
  )
}

interface ItemFormProps {
  draft: ItemDraft
  onChange: (patch: Partial<ItemDraft>) => void
}

/** The editable half — create mode renders this with an empty draft, same as AdDetailPage's
 *  AdForm. */
function ItemForm({ draft, onChange }: ItemFormProps) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">Details</h2>
      <div className="page-card">
        <label className="item-page__field">
          <span className="item-page__label">Name</span>
          <input
            className="item-page__input"
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </label>

        <OptionGroup
          legend="Visibility"
          options={VISIBILITY_OPTIONS}
          selected={draft.isPublic ? 'public' : 'private'}
          onSelect={(value: Visibility) => onChange({ isPublic: value === 'public' })}
        />
        <p className="page-note">§6: only public items are visible to a trading partner.</p>

        <label className="item-page__field">
          <span className="item-page__label">Description</span>
          <textarea
            className="item-page__input item-page__input--multiline"
            rows={4}
            value={draft.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </label>
      </div>
    </section>
  )
}

interface TradeOfferSectionProps {
  tradeId: string
  partnerName: string
  isAdded: boolean
  onAdd: () => void
}

/** §10's other new thing: reached as `/inventory/:itemId?trade=<id>`, the page gains a way to add
 *  itself to the trade being built — the counterpart to Inventory's own tile-tap picking, for
 *  when an item's own page was opened first. This page has no state in common with Inventory's
 *  transfer box (nothing in the prototype shares state across pages — see HANDOFF.md), so "Add to
 *  offer" here is the same kind of session-local acknowledgement TransferBox's own Accept already
 *  is, not a second copy of the offer itself. */
function TradeOfferSection({ tradeId, partnerName, isAdded, onAdd }: TradeOfferSectionProps) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">This trade</h2>
      <div className="page-card">
        <p className="item-page__trade-note">Trading with {partnerName}</p>

        <button
          type="button"
          className="item-page__action item-page__action--primary"
          disabled={isAdded}
          onClick={onAdd}
        >
          {isAdded ? 'Added to your offer' : 'Add to offer'}
        </button>

        {isAdded && (
          <p className="item-page__feedback" role="status">
            Noted for this page visit only — open Inventory&apos;s transfer box for this trade to
            see and confirm your full offer.
          </p>
        )}

        <Link className="item-page__link" to={inventoryForTrade(tradeId)}>
          Open Inventory for this trade
        </Link>
      </div>
    </section>
  )
}

function ItemNotFound({ itemId }: { itemId: string | undefined }) {
  const navigate = useNavigate()

  return (
    <PageShell title="Item not found">
      <div className="item-page">
        <section className="page-section">
          <div className="page-card">
            <p className="item-page__description">
              There is no item with the id <strong>{itemId ?? 'unknown'}</strong>. It may have been
              removed, or the link may be wrong.
            </p>
          </div>
        </section>
        <button
          type="button"
          className="item-page__action item-page__action--primary"
          onClick={() => navigate(ROUTES.inventory)}
        >
          Back to Inventory
        </button>
      </div>
    </PageShell>
  )
}

/** Item (TODO #10): one page in three modes — the same view/edit/create shape as AdDetailPage and
 *  SkillPage, applied to an inventory item instead of an ad or a skill. There's no "someone
 *  else's" branch: every item in the prototype's inventory is yours, so this is simpler than
 *  AdDetailPage in exactly the way SkillPage already is.
 *
 *  Judgement calls:
 *  - Nothing here persists — editing an item and pressing Save shows the edited value with a note
 *    that it isn't saved, and creating one behaves like AdDetailPage's/SkillPage's create modes:
 *    real (light) validation, nowhere for the result to go once it passes. Matches the rest of
 *    the prototype rather than making Inventory the one screen with a real backing store.
 *  - The public/private switch drives the same `InventoryItem.isPublic` field InventoryPage's own
 *    summary line and TransferBox already read — this page is just the other place that value is
 *    editable now (it used to be a toggle button on each row in the old Inventory grid). */
export function ItemPage({ mode }: { mode?: 'create' }) {
  const { itemId } = useParams()
  const [searchParams] = useSearchParams()
  const trade = findTrade(searchParams.get('trade') ?? undefined)

  const isCreate = mode === 'create'
  const item = isCreate ? undefined : findItem(itemId)

  const [draft, setDraft] = useState<ItemDraft>(() => (item ? toDraft(item) : EMPTY_DRAFT))
  const [isEditing, setIsEditing] = useState(isCreate)
  const [actionNote, setActionNote] = useState<string | null>(null)
  const [isAddedToOffer, setIsAddedToOffer] = useState(false)
  const [loadedItemId, setLoadedItemId] = useState(itemId)

  // Same reload-on-param-change guard AdDetailPage/SkillPage both use: react-router can keep this
  // component mounted while the URL moves from one item to another, so the draft has to be
  // refreshed by hand or the previous item's data would flash on screen first.
  if (itemId !== loadedItemId) {
    setLoadedItemId(itemId)
    setDraft(item ? toDraft(item) : EMPTY_DRAFT)
    setIsEditing(isCreate)
    setActionNote(null)
  }

  if (!isCreate && item === undefined) {
    return <ItemNotFound itemId={itemId} />
  }

  const primaryLabel = () => {
    if (isCreate) return 'Create item'
    return isEditing ? 'Save' : 'Edit'
  }

  const handlePrimary = () => {
    if (isCreate) {
      setActionNote('The item exists on this page only — creating an item is not wired up.')
      return
    }
    if (isEditing) {
      setIsEditing(false)
      setActionNote('Changes are kept for this page visit only — nothing is saved.')
      return
    }
    setIsEditing(true)
    setActionNote(null)
  }

  return (
    <PageShell title={draft.name.trim() === '' ? (isCreate ? 'New item' : 'Untitled item') : draft.name}>
      <div className="item-page">
        <ItemGallery
          icon={draft.icon}
          isEditable={isEditing}
          onSelectIcon={(icon) => setDraft((current) => ({ ...current, icon }))}
        />

        {isEditing ? (
          <ItemForm draft={draft} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
        ) : (
          <ItemDetails draft={draft} />
        )}

        {trade && !isEditing && (
          <TradeOfferSection
            tradeId={trade.id}
            partnerName={trade.partner}
            isAdded={isAddedToOffer}
            onAdd={() => setIsAddedToOffer(true)}
          />
        )}

        <section className="page-section">
          <p className="page-note">
            Nothing on this page is saved: edits and creation both live in this page visit only.
          </p>
        </section>

        <div className="item-page__actions">
          {actionNote !== null && (
            <p className="item-page__feedback" role="status">
              {actionNote}
            </p>
          )}

          <div className="item-page__buttons">
            <button
              type="button"
              className="item-page__action item-page__action--primary"
              onClick={handlePrimary}
            >
              {primaryLabel()}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
