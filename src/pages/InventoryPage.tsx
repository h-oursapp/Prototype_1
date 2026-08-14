import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { SquareTile } from '../components/SquareTile'
import type { InventoryItem } from '../data/mockInventory'
import { MOCK_SHELVES, MOCK_YOUR_INVENTORY, publicItems } from '../data/mockInventory'
import type { Trade } from '../data/mockTrades'
import { findTrade } from '../data/mockTrades'
import { trading } from '../routes'
import './InventoryPage.css'

/** A shelf is its name, and nothing else.
 *
 *  §6 allows shelves exactly one level deep — no shelves inside shelves. That rule is carried by
 *  the shape rather than by discipline: a shelf is a string, and a string has no field a child
 *  shelf could go in, so nesting one is not something this file declines to do — it is something
 *  it cannot express. The same holds from the item's side: InventoryItem.shelf is a single
 *  optional name, so an item is on one shelf or on none, never on two and never on a sub-shelf. */
type ShelfName = string

/** The heading for items that aren't on a shelf. They are a real group with a real home on the
 *  page, not a leftover — §6 never says every item must be shelved. */
const UNSHELVED_HEADING = 'No shelf'

/** One shelf's worth of the grid, or — when `name` is null — the home for everything unshelved.
 *  A group holds items and only items: there is no `groups` field here either, so the one-level
 *  rule survives grouping as well as storage. */
interface ShelfGroup {
  name: ShelfName | null
  items: InventoryItem[]
}

/** Every item lands in exactly one group: its own shelf if that shelf exists, the unshelved group
 *  otherwise. The unshelved group is always produced, even empty, so a newly emptied inventory
 *  still shows where loose items would go. */
function groupByShelf(items: InventoryItem[], shelves: ShelfName[]): ShelfGroup[] {
  const onShelves = shelves.map((name) => ({
    name,
    items: items.filter((item) => item.shelf === name),
  }))
  const unshelved = items.filter((item) => item.shelf === undefined || !shelves.includes(item.shelf))
  return [...onShelves, { name: null, items: unshelved }]
}

/** The shelf the picker should show. An item naming a shelf that doesn't exist reads as unshelved,
 *  which is exactly where groupByShelf puts it — the two views of "which shelf" can't disagree. */
function selectedShelf(item: InventoryItem, shelves: ShelfName[]): string {
  return item.shelf !== undefined && shelves.includes(item.shelf) ? item.shelf : ''
}

/** Why this shelf name can't be used, or null if it can. One pure function, in the same shape as
 *  SkillsPage's findProblem, so both forms state their rules in one readable place. */
function findShelfProblem(name: string, shelves: ShelfName[]): string | null {
  const trimmed = name.trim()

  if (trimmed === '') return 'Give the shelf a name.'
  if (shelves.some((shelf) => shelf.toLowerCase() === trimmed.toLowerCase())) {
    return `You already have a shelf called ${trimmed}.`
  }
  return null
}

/** Inventory (Appkarte §6): the grid of your items, organised into one level of shelves, plus the
 *  extra offer-building zone the card asks for when you come here from a trade.
 *
 *  Judgement calls worth knowing about:
 *  - Trading context arrives as `?trade=<id>` rather than a separate route. §6 describes one
 *    Inventory page that *gains* controls in a trading context, not a second screen, and a query
 *    parameter is the smallest thing that says "same page, extra context". An id that isn't in the
 *    mock data resolves to nothing and the page is simply the plain inventory — a stale link
 *    degrades, it never crashes.
 *  - Shelves are one level by construction, not by convention — see ShelfName above.
 *  - Items can be moved between shelves and flipped public/private for real, in local state. §6
 *    only lists "create shelf", but a shelf you can never put anything in isn't a shelf, and §6's
 *    public/private rule is the whole reason this screen matters before a trade.
 *  - Drag-and-drop stays a placeholder, as everywhere else in the prototype: the drop area sits
 *    where the real one will, labelled as not wired up, and every item carries an "Add to offer"
 *    button so the flow still works with a click or the keyboard. TradingPage's table does the
 *    same, so the two screens behave alike.
 *  - Private items can still be put in the offer — TradingPage allows the same — but the offer
 *    flags them, because §6 says the partner only ever sees public entries. Silently publishing an
 *    item on your behalf would be inventing a decision the card doesn't make.
 *  - Uploading is left out. §6 says "grid of uploaded items" and nothing at all about how items get
 *    there, so the page says so rather than inventing an upload flow. */
export function InventoryPage() {
  const [searchParams] = useSearchParams()
  const trade = findTrade(searchParams.get('trade') ?? undefined)

  return <InventoryScreen trade={trade} />
}

/** Everything stateful, below the URL lookup. Split out for the same reason TradingPage splits
 *  TradeScreen off: the state belongs to the inventory, not to the question of which trade (if
 *  any) is in play, and keeping it here means no hook ever sits behind a condition. */
function InventoryScreen({ trade }: { trade: Trade | undefined }) {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_YOUR_INVENTORY)
  const [shelves, setShelves] = useState<ShelfName[]>(MOCK_SHELVES)
  const [isShelfFormOpen, setIsShelfFormOpen] = useState(false)
  // Ids, not copies of the items: something already in the offer can still be made public or moved
  // to a shelf, and the offer has to show it as it is now, not as it was when it was added.
  const [offeredIds, setOfferedIds] = useState<string[]>([])
  const [isAccepted, setIsAccepted] = useState(false)

  const groups = groupByShelf(items, shelves)
  const offeredItems = items.filter((item) => offeredIds.includes(item.id))

  const togglePublic = (itemId: string) =>
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, isPublic: !item.isPublic } : item)),
    )

  const moveToShelf = (itemId: string, shelf: ShelfName | null) =>
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, shelf: shelf ?? undefined } : item)),
    )

  const createShelf = (name: ShelfName) => {
    setShelves((current) => [...current, name])
    setIsShelfFormOpen(false)
  }

  /** Any change to the offer withdraws an acceptance — accepting something and then quietly
   *  changing what was accepted is the one behaviour this screen must not have. */
  const addToOffer = (itemId: string) => {
    setOfferedIds((current) => (current.includes(itemId) ? current : [...current, itemId]))
    setIsAccepted(false)
  }

  const removeFromOffer = (itemId: string) => {
    setOfferedIds((current) => current.filter((id) => id !== itemId))
    setIsAccepted(false)
  }

  return (
    <PageShell
      title="Inventory"
      headerAction={
        // §6's "create shelf" button. It lives in PageShell's headerAction because it acts on the
        // whole page rather than on any one shelf, and it opens a form because a shelf needs a name.
        <button
          type="button"
          className="page-shell__action page-shell__action--icon"
          aria-label="New shelf"
          aria-expanded={isShelfFormOpen}
          onClick={() => setIsShelfFormOpen((isOpen) => !isOpen)}
        >
          <span aria-hidden="true">🗂️</span>
        </button>
      }
    >
      <div className="inventory-page">
        {trade && <TradeContextBanner trade={trade} />}

        <p className="inventory-page__summary">
          {publicItems(items).length} of {items.length} items are visible to a trading partner.
        </p>

        {isShelfFormOpen && (
          <CreateShelfForm
            shelves={shelves}
            onCreate={createShelf}
            onCancel={() => setIsShelfFormOpen(false)}
          />
        )}

        {groups.map((group) => (
          <ShelfSection
            key={group.name ?? UNSHELVED_HEADING}
            group={group}
            shelves={shelves}
            offeredIds={offeredIds}
            onTogglePublic={togglePublic}
            onMoveToShelf={moveToShelf}
            onAddToOffer={trade ? addToOffer : undefined}
          />
        ))}

        <p className="page-note">
          §6 calls this a grid of uploaded items but says nothing about how items get uploaded, so
          the prototype shows the mock inventory and leaves the upload flow undecided.
        </p>

        {trade && (
          <OfferZone
            trade={trade}
            offeredItems={offeredItems}
            isAccepted={isAccepted}
            onRemoveFromOffer={removeFromOffer}
            onAccept={() => setIsAccepted(true)}
          />
        )}

        <p className="page-note">
          Prototype scope: shelves, item visibility and the offer live in this screen&apos;s memory
          only, so a reload brings back the starting inventory.
        </p>
      </div>
    </PageShell>
  )
}

/* ---------- Trading context ---------- */

/** Makes it obvious you are picking items *for a trade*, and says whose. Without this the trading
 *  controls at the bottom would be the only clue that the page is in a different mode. */
function TradeContextBanner({ trade }: { trade: Trade }) {
  return (
    <section className="page-card inventory-page__trade-banner" aria-label="Trading context">
      <h2 className="inventory-page__banner-title">
        Picking items for your trade with {trade.partner}
      </h2>
      <p className="inventory-page__banner-subject">
        <span aria-hidden="true">{trade.icon}</span> {trade.subject}
      </p>
      <p className="page-note">
        §6: {trade.partner} only ever sees the items you marked public — check each item&apos;s badge
        before you offer it.
      </p>
    </section>
  )
}

/* ---------- The grid, one section per shelf ---------- */

interface ShelfSectionProps {
  group: ShelfGroup
  shelves: ShelfName[]
  offeredIds: string[]
  onTogglePublic: (itemId: string) => void
  onMoveToShelf: (itemId: string, shelf: ShelfName | null) => void
  /** Passed only in a trading context — outside one there is no offer to add anything to. */
  onAddToOffer?: (itemId: string) => void
}

function ShelfSection({
  group,
  shelves,
  offeredIds,
  onTogglePublic,
  onMoveToShelf,
  onAddToOffer,
}: ShelfSectionProps) {
  const isUnshelved = group.name === null
  const heading = group.name ?? UNSHELVED_HEADING
  // Named for the grid's own list so tests and screen readers can tell two shelves apart.
  const listLabel = isUnshelved ? 'Items without a shelf' : `${heading} shelf`

  return (
    <section className="page-section inventory-page__shelf">
      <h2 className="page-section__heading">{heading}</h2>
      <p className="inventory-page__shelf-count">
        {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
      </p>

      {group.items.length === 0 ? (
        <p className="page-card inventory-page__empty">
          {isUnshelved
            ? 'Every item is on a shelf.'
            : 'This shelf is empty. Move an item here with its shelf picker.'}
        </p>
      ) : (
        <ul className="inventory-page__grid" aria-label={listLabel}>
          {group.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              shelves={shelves}
              isOffered={offeredIds.includes(item.id)}
              onTogglePublic={onTogglePublic}
              onMoveToShelf={onMoveToShelf}
              onAddToOffer={onAddToOffer}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface ItemCardProps {
  item: InventoryItem
  shelves: ShelfName[]
  isOffered: boolean
  onTogglePublic: (itemId: string) => void
  onMoveToShelf: (itemId: string, shelf: ShelfName | null) => void
  onAddToOffer?: (itemId: string) => void
}

/** One box of the grid: the item's picture, its name, whether it is public, and the controls for
 *  the two things §6 says about an item — which shelf it is on, and who can see it. */
function ItemCard({
  item,
  shelves,
  isOffered,
  onTogglePublic,
  onMoveToShelf,
  onAddToOffer,
}: ItemCardProps) {
  return (
    <li className="inventory-page__item">
      <span className="inventory-page__item-tile">
        <SquareTile label={item.name}>
          <span className="square-tile__icon" aria-hidden="true">
            {item.icon}
          </span>
        </SquareTile>
      </span>

      <span className="inventory-page__item-name">{item.name}</span>

      {/* The badge carries the state, the button carries the action. One control doing both would
       *  have to read "Public" while meaning "make private", which is a coin toss for the reader. */}
      <span className={`inventory-page__badge ${item.isPublic ? 'is-public' : 'is-private'}`}>
        {item.isPublic ? 'Public' : 'Private'}
      </span>

      <button
        type="button"
        className="inventory-page__button"
        aria-label={item.isPublic ? `Make ${item.name} private` : `Make ${item.name} public`}
        onClick={() => onTogglePublic(item.id)}
      >
        {item.isPublic ? 'Make private' : 'Make public'}
      </button>

      {/* A picker, not a nested tree: the only things this can choose between are the one level of
       *  shelves and no shelf at all (§6). */}
      <select
        className="inventory-page__select"
        aria-label={`Shelf for ${item.name}`}
        value={selectedShelf(item, shelves)}
        onChange={(event) =>
          onMoveToShelf(item.id, event.target.value === '' ? null : event.target.value)
        }
      >
        <option value="">{UNSHELVED_HEADING}</option>
        {shelves.map((shelf) => (
          <option key={shelf} value={shelf}>
            {shelf}
          </option>
        ))}
      </select>

      {onAddToOffer && (
        <button
          type="button"
          className="inventory-page__button"
          aria-label={
            isOffered ? `${item.name} is already in your offer` : `Add ${item.name} to your offer`
          }
          disabled={isOffered}
          onClick={() => onAddToOffer(item.id)}
        >
          {isOffered ? 'In the offer' : 'Add to offer'}
        </button>
      )}
    </li>
  )
}

/* ---------- The trading-context zone: drop area, Accept, Back to trading ---------- */

interface OfferZoneProps {
  trade: Trade
  offeredItems: InventoryItem[]
  isAccepted: boolean
  onRemoveFromOffer: (itemId: string) => void
  onAccept: () => void
}

/** §6's extra zone. It sits last, directly above the nav bar, following the same placement §5 uses
 *  for a page's action buttons — and it means the grid you pick from stays at the top where you
 *  arrived. */
function OfferZone({ trade, offeredItems, isAccepted, onRemoveFromOffer, onAccept }: OfferZoneProps) {
  const privateCount = offeredItems.filter((item) => !item.isPublic).length

  return (
    <section className="page-section">
      <h2 className="page-section__heading">Your offer</h2>

      <div className="page-card inventory-page__offer">
        <div className="inventory-page__drop" role="group" aria-label="Your offer for this trade">
          {offeredItems.length === 0 ? (
            <p className="inventory-page__drop-empty">Nothing in the offer yet.</p>
          ) : (
            <ul className="inventory-page__drop-items">
              {offeredItems.map((item) => (
                <li className="inventory-page__drop-item" key={item.id}>
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="inventory-page__drop-name">{item.name}</span>
                  {!item.isPublic && <span className="inventory-page__drop-flag">Private</span>}
                  <button
                    type="button"
                    className="inventory-page__drop-remove"
                    aria-label={`Remove ${item.name} from your offer`}
                    onClick={() => onRemoveFromOffer(item.id)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="page-note">
            Drag-and-drop is not wired up in the prototype — use &quot;Add to offer&quot; on an item
            above.
          </p>
        </div>

        {privateCount > 0 && (
          <p className="page-note">
            Still private, so invisible to {trade.partner}: {privateCount} of {offeredItems.length}.
          </p>
        )}

        <div className="inventory-page__actions">
          <Link className="inventory-page__secondary" to={trading(trade.id)}>
            Back to trading
          </Link>
          <button type="button" className="inventory-page__primary" onClick={onAccept}>
            Accept
          </button>
        </div>

        {isAccepted && (
          <p className="inventory-page__accepted" role="status">
            Offer accepted: {offeredItems.length}{' '}
            {offeredItems.length === 1 ? 'item' : 'items'} for the trade with {trade.partner}.
          </p>
        )}

        <p className="page-note">
          §6 lists Accept and Back-to-trading here but not what Accept sends anywhere. It confirms
          the offer in this screen&apos;s state only, and changing the offer withdraws it again.
        </p>
      </div>
    </section>
  )
}

/* ---------- Creating a shelf ---------- */

interface CreateShelfFormProps {
  shelves: ShelfName[]
  onCreate: (name: ShelfName) => void
  onCancel: () => void
}

/** The form behind §6's "create shelf" button. Validation follows SkillsPage: the problem is
 *  reported on submit through role="alert" rather than by disabling the button, because a disabled
 *  button cannot say what is wrong with it. */
function CreateShelfForm({ shelves, onCreate, onCancel }: CreateShelfFormProps) {
  const [name, setName] = useState('')
  const [problem, setProblem] = useState<string | null>(null)

  /** Editing clears the message, so a problem you have already fixed stops being complained about. */
  const editName = (next: string) => {
    setName(next)
    setProblem(null)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const found = findShelfProblem(name, shelves)
    if (found !== null) {
      setProblem(found)
      return
    }

    onCreate(name.trim())
    setName('')
  }

  return (
    <section className="page-section">
      <h2 className="page-section__heading">New shelf</h2>

      <form className="inventory-page__form" onSubmit={submit}>
        <div className="inventory-page__field">
          <label className="inventory-page__label" htmlFor="new-shelf-name">
            Shelf name
          </label>
          <input
            id="new-shelf-name"
            className="inventory-page__input"
            type="text"
            value={name}
            placeholder="e.g. Garage"
            onChange={(event) => editName(event.target.value)}
          />
        </div>

        {problem !== null && (
          <p className="inventory-page__problem" role="alert">
            {problem}
          </p>
        )}

        <div className="inventory-page__actions">
          <button type="button" className="inventory-page__secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="inventory-page__primary">
            Create shelf
          </button>
        </div>
      </form>

      <p className="page-note">
        Shelves are one level deep (§6): a shelf holds items, never other shelves — which is why the
        only thing this form asks for is a name.
      </p>
    </section>
  )
}
