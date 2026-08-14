import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { SquareTile } from '../components/SquareTile'
import type { InventoryItem } from '../data/mockInventory'
import { MOCK_PARTNER_INVENTORY, MOCK_YOUR_INVENTORY, publicItems } from '../data/mockInventory'
import type { ChatMessage, Trade } from '../data/mockTrades'
import { TRADE_STATUS_LABEL, findTrade } from '../data/mockTrades'
import type { Skill } from '../data/mockUser'
import { MOCK_HOURS_BALANCE, MOCK_PARTNER_SKILLS, MOCK_SKILLS } from '../data/mockUser'
import { ROUTES, finalReview, inventoryForTrade } from '../routes'
import './TradingPage.css'

/** Trading (Appkarte §6) — one trade, three stacked zones: both inventories on top, the trading
 *  table in the middle, the chat at the bottom.
 *
 *  Judgement calls worth knowing about:
 *  - The partner's inventory always goes through publicItems(). Their private entries are never
 *    put in the document at all (not hidden with CSS), so nothing private can leak.
 *  - §6 hides the partner's *available* hours from you. The row is still rendered, masked with
 *    "???", because that asymmetry is the point of this screen — dropping the row would hide the
 *    rule rather than show it.
 *  - Drag-and-drop is out of scope by agreement. The drop area sits exactly where the real one
 *    will, labelled as not wired up, and every item of yours carries an "Add to table" button so
 *    the flow is still demonstrable with a click or the keyboard.
 *  - The partner's offered hours come from the trade record and are shown plainly: §6 hides their
 *    balance, not what they've already put on the table. Which *items* sit on either side isn't
 *    modelled yet, so both trays start empty.
 *
 *  The page reads its own :tradeId, so it takes no props. An id that isn't in the mock data
 *  renders a "trade not found" card rather than crashing. */
export function TradingPage() {
  const { tradeId } = useParams()
  const trade = findTrade(tradeId)

  if (!trade) {
    return <TradeNotFound />
  }

  return <TradeScreen trade={trade} />
}

function TradeNotFound() {
  return (
    <PageShell title="Trading">
      <div className="trading-page">
        <div className="page-card">
          <h2 className="trading-page__panel-title">Trade not found</h2>
          <p className="page-note">
            No trade with this id exists in the prototype&apos;s mock data. It may have been closed
            and removed, or the link is wrong.
          </p>
          <Link className="trading-page__link" to={ROUTES.trades}>
            Back to trades
          </Link>
        </div>
      </div>
    </PageShell>
  )
}

/** Everything below the id lookup. Split out so the hooks only ever run for a trade that exists —
 *  a component can't call useState after an early return. */
function TradeScreen({ trade }: { trade: Trade }) {
  const [offeredHours, setOfferedHours] = useState(trade.yourHours)
  const [offeredItems, setOfferedItems] = useState<InventoryItem[]>([])

  const addToTable = (item: InventoryItem) =>
    setOfferedItems((items) => (items.some((onTable) => onTable.id === item.id) ? items : [...items, item]))

  const removeFromTable = (itemId: string) =>
    setOfferedItems((items) => items.filter((item) => item.id !== itemId))

  return (
    <PageShell title={`Trading with ${trade.partner}`}>
      <div className="trading-page">
        <p className="trading-page__summary">
          <span aria-hidden="true">{trade.icon}</span> {trade.subject} · {TRADE_STATUS_LABEL[trade.status]}
        </p>

        <InventoriesZone tradeId={trade.id} partnerName={trade.partner} onAddToTable={addToTable} />

        <TradingTableZone
          trade={trade}
          offeredHours={offeredHours}
          offeredItems={offeredItems}
          onChangeOfferedHours={setOfferedHours}
          onRemoveFromTable={removeFromTable}
        />

        <ChatZone partnerName={trade.partner} initialMessages={trade.messages} />
      </div>
    </PageShell>
  )
}

/* ---------- Zone 1: the two inventories ---------- */

interface InventoriesZoneProps {
  /** Passed through so the Inventory link can open in trading context (§6). */
  tradeId: string
  partnerName: string
  onAddToTable: (item: InventoryItem) => void
}

function InventoriesZone({ tradeId, partnerName, onAddToTable }: InventoriesZoneProps) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">Inventories</h2>
      <div className="trading-page__inventories">
        <YourInventoryPanel tradeId={tradeId} partnerName={partnerName} onAddToTable={onAddToTable} />
        <PartnerInventoryPanel partnerName={partnerName} />
      </div>
    </section>
  )
}

function YourInventoryPanel({ tradeId, partnerName, onAddToTable }: InventoriesZoneProps) {
  return (
    <div className="page-card trading-page__inventory">
      <h3 className="trading-page__panel-title">Your inventory</h3>

      <div className="trading-page__inventory-body">
        <SkillSidebar title="Your skills" skills={MOCK_SKILLS} />
        <ul className="trading-page__items">
          {MOCK_YOUR_INVENTORY.map((item) => (
            <InventoryItemRow
              key={item.id}
              item={item}
              privateNote={`Private — not visible to ${partnerName}`}
              onAddToTable={onAddToTable}
            />
          ))}
        </ul>
      </div>

      <Link className="trading-page__link" to={inventoryForTrade(tradeId)}>
        Open your full inventory
      </Link>
      <p className="page-note">
        You see everything, including your private entries. {partnerName} only ever sees the items
        you marked public.
      </p>
    </div>
  )
}

function PartnerInventoryPanel({ partnerName }: { partnerName: string }) {
  const [isFullInventoryOpen, setIsFullInventoryOpen] = useState(false)
  // §6: a trading partner only ever sees the public entries — so the private ones are filtered out
  // here, before anything is rendered, rather than being hidden afterwards.
  const visibleItems = publicItems(MOCK_PARTNER_INVENTORY)

  return (
    <div className="page-card trading-page__inventory">
      <h3 className="trading-page__panel-title">{partnerName}&apos;s inventory</h3>

      <div className="trading-page__inventory-body">
        <PartnerSkillSidebar partnerName={partnerName} />
        <ul className="trading-page__items">
          {visibleItems.map((item) => (
            <InventoryItemRow key={item.id} item={item} />
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="trading-page__button"
        aria-expanded={isFullInventoryOpen}
        onClick={() => setIsFullInventoryOpen((isOpen) => !isOpen)}
      >
        {isFullInventoryOpen ? 'Close' : 'Open'} {partnerName}&apos;s full inventory
      </button>

      {/* §6 asks for full detail inspection of the partner's public entries. Their own Inventory
       *  page isn't ours to link to, so the detail lives in this panel. */}
      {isFullInventoryOpen && (
        <dl className="trading-page__detail">
          {visibleItems.map((item) => (
            <div className="trading-page__detail-row" key={item.id}>
              <dt className="trading-page__detail-term">
                <span aria-hidden="true">{item.icon}</span> {item.name}
              </dt>
              <dd className="trading-page__detail-value">
                Shelf: {item.shelf ?? 'none'} · Public entry
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className="page-note">
        Public entries only. Anything {partnerName} keeps private is never sent to your side of the
        trade.
      </p>
    </div>
  )
}

function SkillSidebar({ title, skills }: { title: string; skills: Skill[] }) {
  return (
    <div className="trading-page__skills">
      <h4 className="trading-page__skills-title">{title}</h4>
      <ul className="trading-page__skill-list">
        {skills.map((skill) => (
          <li className="trading-page__skill" key={skill.id}>
            <span className="trading-page__skill-icon" aria-hidden="true">
              {skill.icon}
            </span>
            <span className="trading-page__skill-name">{skill.name}</span>
            <span className="trading-page__skill-rating">{skill.rating}★</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** §6 mirrors the skills sidebar onto the partner's side. */
function PartnerSkillSidebar({ partnerName }: { partnerName: string }) {
  return <SkillSidebar title={`${partnerName}'s skills`} skills={MOCK_PARTNER_SKILLS} />
}

interface InventoryItemRowProps {
  item: InventoryItem
  /** Shown when the item isn't public. Only your own side passes it — the partner's list is
   *  filtered to public items, so it can never need one. */
  privateNote?: string
  /** Only your own items can go on the table: §6's drop area builds *your* offer. */
  onAddToTable?: (item: InventoryItem) => void
}

function InventoryItemRow({ item, privateNote, onAddToTable }: InventoryItemRowProps) {
  return (
    <li className="trading-page__item">
      <div className="trading-page__item-tile">
        <SquareTile label={item.name}>
          <span className="square-tile__icon" aria-hidden="true">
            {item.icon}
          </span>
        </SquareTile>
      </div>

      <div className="trading-page__item-text">
        <span className="trading-page__item-name">{item.name}</span>
        <span className="trading-page__item-meta">{item.shelf ?? 'No shelf'}</span>
        {!item.isPublic && privateNote !== undefined && (
          <span className="trading-page__item-private">{privateNote}</span>
        )}
      </div>

      {onAddToTable && (
        <button
          type="button"
          className="trading-page__button"
          aria-label={`Add ${item.name} to the table`}
          onClick={() => onAddToTable(item)}
        >
          Add to table
        </button>
      )}
    </li>
  )
}

/* ---------- Zone 2: the trading table ---------- */

interface TradingTableZoneProps {
  trade: Trade
  offeredHours: number
  offeredItems: InventoryItem[]
  onChangeOfferedHours: (hours: number) => void
  onRemoveFromTable: (itemId: string) => void
}

function TradingTableZone({
  trade,
  offeredHours,
  offeredItems,
  onChangeOfferedHours,
  onRemoveFromTable,
}: TradingTableZoneProps) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">Trading table</h2>

      <div className="page-card trading-page__table">
        <div className="trading-page__side" role="group" aria-label="Your side of the trading table">
          <h3 className="trading-page__panel-title">You</h3>

          <HoursRow label="Available hours" value={`${MOCK_HOURS_BALANCE} h`} />

          <p className="trading-page__hours-row">
            <span className="trading-page__hours-label">Offered hours</span>
          </p>
          <HoursStepper hours={offeredHours} max={MOCK_HOURS_BALANCE} onChange={onChangeOfferedHours} />

          <DropArea
            label="Your offer on the table"
            items={offeredItems}
            emptyText="Nothing on the table yet."
            note='Drag-and-drop is not wired up in the prototype — use "Add to table" on an item above.'
            onRemoveFromTable={onRemoveFromTable}
          />
        </div>

        <div
          className="trading-page__side"
          role="group"
          aria-label={`${trade.partner}'s side of the trading table`}
        >
          <h3 className="trading-page__panel-title">{trade.partner}</h3>

          {/* §6: the partner's available hours stay hidden from you. Masked rather than removed, so
           *  the asymmetry with your own side is visible in the layout. */}
          <p className="trading-page__hours-row">
            <span className="trading-page__hours-label">Available hours</span>
            <span
              className="trading-page__hours-value is-masked"
              aria-label={`${trade.partner}'s available hours are hidden from you`}
            >
              ???
            </span>
          </p>

          {/* Their *balance* is hidden above, but what they've actually put on the table is
            * public — that asymmetry is the point of §6's middle zone. */}
          <HoursRow label="Offered hours" value={`${trade.partnerHours} h`} />

          <DropArea
            label={`${trade.partner}'s offer on the table`}
            items={[]}
            emptyText="Nothing on the table yet."
            note={`Only ${trade.partner} can fill this side.`}
          />
        </div>
      </div>

      {/* Appkarte §6 [OFFEN]: the icon language for the trading table is not defined yet. The rows
       *  stay worded — picking icons here would quietly settle a decision the card leaves open. */}
      <p className="page-note">
        [OFFEN] §6 leaves the trading table&apos;s icons undefined, so every row is labelled in words
        only for now.
      </p>

      <Link className="trading-page__link" to={finalReview(trade.id)}>
        Open final review
      </Link>
      <p className="page-note">§8: once a trade is agreed, final review is what officially closes it.</p>
    </section>
  )
}

function HoursRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="trading-page__hours-row">
      <span className="trading-page__hours-label">{label}</span>
      <span className="trading-page__hours-value">{value}</span>
    </p>
  )
}

interface HoursStepperProps {
  hours: number
  max: number
  onChange: (hours: number) => void
}

/** Adjusting your own offer is in scope — a stepper rather than a free-text field, so the offer
 *  can never exceed the hours you actually have. */
function HoursStepper({ hours, max, onChange }: HoursStepperProps) {
  return (
    <div className="trading-page__stepper" role="group" aria-label="Your offered hours">
      <button
        type="button"
        className="trading-page__stepper-button"
        aria-label="Offer one hour less"
        disabled={hours <= 0}
        onClick={() => onChange(hours - 1)}
      >
        <span aria-hidden="true">−</span>
      </button>
      <span className="trading-page__stepper-value" aria-live="polite">
        {hours} h
      </span>
      <button
        type="button"
        className="trading-page__stepper-button"
        aria-label="Offer one hour more"
        disabled={hours >= max}
        onClick={() => onChange(hours + 1)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}

interface DropAreaProps {
  label: string
  items: InventoryItem[]
  emptyText: string
  note: string
  onRemoveFromTable?: (itemId: string) => void
}

/** The drag-and-drop area from §6, laid out where the real one will sit but deliberately inert:
 *  items arrive through the "Add to table" buttons instead. */
function DropArea({ label, items, emptyText, note, onRemoveFromTable }: DropAreaProps) {
  return (
    <div className="trading-page__drop" role="group" aria-label={label}>
      {items.length === 0 ? (
        <p className="trading-page__drop-empty">{emptyText}</p>
      ) : (
        <ul className="trading-page__drop-items">
          {items.map((item) => (
            <li className="trading-page__drop-item" key={item.id}>
              <span aria-hidden="true">{item.icon}</span>
              <span className="trading-page__drop-name">{item.name}</span>
              {onRemoveFromTable && (
                <button
                  type="button"
                  className="trading-page__drop-remove"
                  aria-label={`Remove ${item.name} from the table`}
                  onClick={() => onRemoveFromTable(item.id)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="page-note">{note}</p>
    </div>
  )
}

/* ---------- Zone 3: the chat ---------- */

interface ChatZoneProps {
  partnerName: string
  initialMessages: ChatMessage[]
}

function ChatZone({ partnerName, initialMessages }: ChatZoneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const sendMessage = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (text === '') {
      return
    }
    // §8 keeps the chat log locally; the prototype's "locally" is page state, so it resets on
    // reload. Nothing here talks to the mock data.
    setMessages((current) => [...current, { id: `local-${current.length}`, from: 'you', text, time: 'Now' }])
    setDraft('')
  }

  return (
    <section
      className={`page-section trading-page__chat ${isExpanded ? 'is-expanded' : ''}`}
      aria-label={`Chat with ${partnerName}`}
    >
      <header className="trading-page__chat-header">
        <h2 className="page-section__heading">Chat</h2>
        <button
          type="button"
          className="trading-page__button"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse chat' : 'Expand chat to full screen'}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <span aria-hidden="true">{isExpanded ? '↙' : '↗'}</span>
        </button>
      </header>

      <ul className="trading-page__messages">
        {messages.map((message) => (
          <li
            className={`trading-page__message ${message.from === 'you' ? 'is-yours' : ''}`}
            key={message.id}
          >
            <span className="trading-page__message-author">
              {message.from === 'you' ? 'You' : partnerName}
            </span>
            <span className="trading-page__message-text">{message.text}</span>
            <span className="trading-page__message-time">{message.time}</span>
          </li>
        ))}
      </ul>

      <form className="trading-page__composer" onSubmit={sendMessage}>
        <input
          className="trading-page__composer-input"
          type="text"
          aria-label="Message"
          placeholder={`Message ${partnerName}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="trading-page__button">
          Send
        </button>
      </form>

      <p className="page-note">
        §8 stores the chat log locally and lets you delete it — the prototype keeps messages in page
        state only, so they reset on reload.
      </p>
    </section>
  )
}
