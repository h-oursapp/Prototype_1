import { useEffect, useRef, useState, type FormEvent, type UIEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { PagedGrid } from '../components/PagedGrid'
import { SquareTile } from '../components/SquareTile'
import { StarRating } from '../components/StarRating'
import type { InventoryItem } from '../data/mockInventory'
import { MOCK_YOUR_INVENTORY } from '../data/mockInventory'
import type { ChatMessage, Trade } from '../data/mockTrades'
import { TRADE_STATUS_LABEL, canRespondToOffer, findTrade, statusAfterAccept } from '../data/mockTrades'
import type { Skill } from '../data/mockUser'
import { MOCK_HOURS_BALANCE, MOCK_PARTNER_SKILLS, MOCK_SKILLS } from '../data/mockUser'
import { finalReview, inventoryForTrade, partnerInventoryForTrade, skillsForTrade, ROUTES } from '../routes'
import { useTradeDraft } from '../trading/useTradeDraft'
import './TradingPage.css'

/** Trading (Appkarte §6, reworked by TODO #11, then reshaped again on direct feedback about the
 *  first cut) — a non-scrollable page: a skills row, the trading table, another skills row, and
 *  the chat all have to fit at once, so overflow within a row is paged through (PagedGrid) rather
 *  than scrolled past.
 *
 *  Judgement calls worth knowing about:
 *  - The first cut of this rework gave both sides a live, always-visible item grid right on this
 *    page. Direct feedback asked for that to go away entirely: items are picked on Inventory's own
 *    page (reached via the "Add items" button below), and the partner's items are browsed on their
 *    own read-only page (`PartnerInventoryPage`, via "Open her inventory") — this page only ever
 *    shows the *result* of picking, on the trading table in the middle.
 *  - Picking items elsewhere and expecting them to show up here on return is exactly the "cross-
 *    page store" this prototype had deliberately avoided until now (see git history / HANDOFF.md)
 *    — `TradeDraftContext` (src/trading/) is the small, session-only piece that makes the round
 *    trip work: it holds offered item ids per trade id, and both this page and Inventory's own
 *    read and write the same one. Skills and hours don't need this — nothing but this page ever
 *    changes them, so they stay in this component's own local state, same as before.
 *  - Skills stay directly on this page, one row per side, because there are few enough of them to
 *    browse in place — items don't get the same treatment because there can be many more of them,
 *    and Inventory already exists as the place to browse/manage them properly. "A row of your/her
 *    best skills" is taken literally: `bestSkills()` ranks by rating and caps the row to exactly
 *    one page's worth, rather than paginating through every skill — a page this height-constrained
 *    can't spare the extra room a pager needs on top of tiles small enough to stay legible; the
 *    "open full skills" tile is already the way to reach the rest.
 *  - Time is drawn as the first tile of your row on the trading table — "an inherent skill offer"
 *    per TODO #11 — but is never added to the Skills row above: the parenthetical is explicit that
 *    it must stay invisible among your actual skills.
 *  - The Accept button uses the real (session-local) status pipeline from mockTrades.ts
 *    (`canRespondToOffer`/`statusAfterAccept`) rather than a placeholder note — TODO #13's
 *    Accept/Decline loop and this button are the same piece of UI.
 *  - The partner's own offer on the table stays just their Time tile — which items or skills they
 *    put up isn't modelled yet (their side of the table always started empty before this rework
 *    too; nothing here changes that).
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

/* ---------- Grid entry types: an ordinary skill/item, or the last-cell link tile ---------- */

type SkillEntry = { kind: 'skill'; skill: Skill } | { kind: 'open-full' }
type TableEntry =
  | { kind: 'time'; hours: number; editable: boolean }
  | { kind: 'item'; item: InventoryItem }
  | { kind: 'skill'; skill: Skill }

function entryKey(entry: SkillEntry | TableEntry): string {
  if (entry.kind === 'open-full') return 'open-full'
  if (entry.kind === 'time') return 'time'
  if (entry.kind === 'item') return entry.item.id
  return entry.skill.id
}

/** How many tiles fit across a skills row — used both for PagedGrid's own `columns` and to size
 *  the "best skills" preview below it, so the two can never drift apart. */
const SKILLS_ROW_COLUMNS = 4

/** The highest-rated `count` skills, highest first — see the "best skills" comment where this is
 *  called. A plain sort-and-slice rather than assuming the mock data already happens to be in
 *  rating order. */
function bestSkills(skills: Skill[], count: number): Skill[] {
  return [...skills].sort((a, b) => b.rating - a.rating).slice(0, count)
}

/** Everything below the id lookup. Split out so the hooks only ever run for a trade that exists —
 *  a component can't call useState after an early return. */
function TradeScreen({ trade }: { trade: Trade }) {
  const navigate = useNavigate()
  const { getOfferedItemIds, clearItems } = useTradeDraft()
  const [status, setStatus] = useState(trade.status)
  const [offeredHours, setOfferedHours] = useState(trade.yourHours)
  const [isAdjustingHours, setIsAdjustingHours] = useState(false)
  const [offeredSkillIds, setOfferedSkillIds] = useState<string[]>([])
  const [isDeclined, setIsDeclined] = useState(false)
  const [searchParams] = useSearchParams()
  // TODO #13: AdDetailPage's Quick Buy sends you here with ?quick=1 instead of the plain trading
  // route — the one thing that actually differs is the chat starting expanded (see ChatZone).
  const isQuickOffer = searchParams.get('quick') === '1'

  const offeredItemIds = getOfferedItemIds(trade.id)

  const toggleSkill = (skillId: string) => {
    setOfferedSkillIds((ids) => (ids.includes(skillId) ? ids.filter((id) => id !== skillId) : [...ids, skillId]))
    setIsDeclined(false)
  }

  const changeOfferedHours = (hours: number) => {
    setOfferedHours(hours)
    setIsDeclined(false)
  }

  /** TODO #13: "when declined the other side can make a new offer." This prototype has one user
   *  acting as both sides of the negotiation, so the modelled effect is the practical one — the
   *  table clears so a new offer can be built — rather than a second status value. The trade
   *  itself stays 'open': it was never agreed, so there's nothing to revert. */
  const decline = () => {
    clearItems(trade.id)
    setOfferedSkillIds([])
    setOfferedHours(trade.yourHours)
    setIsDeclined(true)
  }

  const offeredItems = MOCK_YOUR_INVENTORY.filter((item) => offeredItemIds.includes(item.id))
  const offeredSkills = MOCK_SKILLS.filter((skill) => offeredSkillIds.includes(skill.id))

  // "A row of your/her best skills" (see file banner comment) — a curated preview, not a paged
  // browse of every skill: capped to fit one row with no pager, ranked so "best" is literal rather
  // than "however many happen to fit on page 1". Seeing the rest is what the "open full skills"
  // tile (yours only — there's no such link for the partner's) is for.
  const yourSkillEntries: SkillEntry[] = [
    ...bestSkills(MOCK_SKILLS, SKILLS_ROW_COLUMNS - 1).map((skill): SkillEntry => ({ kind: 'skill', skill })),
    { kind: 'open-full' },
  ]
  const partnerSkillEntries: SkillEntry[] = bestSkills(MOCK_PARTNER_SKILLS, SKILLS_ROW_COLUMNS).map((skill) => ({
    kind: 'skill',
    skill,
  }))

  return (
    <PageShell title={`Trading with ${trade.partner}`} compactTitle>
      <div className="trading-page">
        <SkillsRow
          ariaLabel="Your skills"
          entries={yourSkillEntries}
          offeredSkillIds={offeredSkillIds}
          onToggleSkill={toggleSkill}
          onOpenFull={() => navigate(skillsForTrade(trade.id))}
        />

        <ActionButtonRow label="Add items" onClick={() => navigate(inventoryForTrade(trade.id))} />

        <TradingTableZone
          trade={trade}
          status={status}
          offeredHours={offeredHours}
          offeredItems={offeredItems}
          offeredSkills={offeredSkills}
          isAdjustingHours={isAdjustingHours}
          isDeclined={isDeclined}
          onToggleAdjustingHours={() => setIsAdjustingHours((open) => !open)}
          onChangeOfferedHours={changeOfferedHours}
          onAccept={() => setStatus((current) => statusAfterAccept(current))}
          onDecline={decline}
        />

        <ActionButtonRow
          label={`Open ${trade.partner}'s inventory`}
          onClick={() => navigate(partnerInventoryForTrade(trade.id))}
        />

        <SkillsRow ariaLabel={`${trade.partner}'s skills`} entries={partnerSkillEntries} />

        <ChatZone partnerName={trade.partner} initialMessages={trade.messages} startExpanded={isQuickOffer} />
      </div>
    </PageShell>
  )
}

/* ---------- A single, prominent action button in its own row ---------- */

/** "Add items" and "Open her inventory" (see the file banner comment) — plain buttons in place of
 *  the live item grids the first cut of this page had, each its own fixed-height row rather than
 *  a full zone, since a button needs far less room than a grid did. */
function ActionButtonRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="trading-page__action-row">
      <button type="button" className="trading-page__action-button" onClick={onClick}>
        {label}
      </button>
    </div>
  )
}

/* ---------- A single row of skill tiles (one per side) ---------- */

interface SkillsRowProps {
  ariaLabel: string
  entries: SkillEntry[]
  /** Present only for your own row — the partner's tiles are read-only browsing, same rule §6
   *  already applies everywhere else on this page. */
  offeredSkillIds?: string[]
  onToggleSkill?: (skillId: string) => void
  /** Only your row's `entries` end with an `{ kind: 'open-full' }` tile — there's no "their full
   *  skills" page to link the partner's row to, so it's simply omitted there instead of rendered
   *  disabled or hidden. */
  onOpenFull?: () => void
}

/** No visible "You"/partner-name heading (direct feedback: decluttering pass) — the row's own
 *  `aria-label` still names whose skills these are for assistive tech, and sighted users get the
 *  same information for free from the row's fixed position on the page (top = yours, bottom =
 *  hers), so a repeated visible label wasn't adding anything worth its line of height. */
function SkillsRow({ ariaLabel, entries, offeredSkillIds, onToggleSkill, onOpenFull }: SkillsRowProps) {
  return (
    <section className="trading-page__row" role="group" aria-label={ariaLabel}>
      <PagedGrid
        items={entries}
        getKey={entryKey}
        columns={SKILLS_ROW_COLUMNS}
        rows={1}
        gridLabel={ariaLabel}
        renderTile={(entry) =>
          entry.kind === 'open-full' ? (
            <OpenFullTile label="Open your full skills" onOpen={onOpenFull ?? (() => {})} />
          ) : (
            <SkillTile
              skill={entry.skill}
              isOffered={offeredSkillIds?.includes(entry.skill.id)}
              onToggle={onToggleSkill ? () => onToggleSkill(entry.skill.id) : undefined}
            />
          )
        }
      />
    </section>
  )
}

interface OpenFullTileProps {
  label: string
  onOpen: () => void
}

/** TODO #11's "last gridcell is a button for their respective pages" — a tile like any other,
 *  navigating like SkillsPage's own "+ Add a skill" tile already does. */
function OpenFullTile({ label, onOpen }: OpenFullTileProps) {
  return (
    <SquareTile label={label} onClick={onOpen} overlay={<span className="trading-page__tile-name">More…</span>}>
      <span className="square-tile__icon" aria-hidden="true">
        ➜
      </span>
    </SquareTile>
  )
}

/** A read-only tile — every item shown on this page (the trading table) is already offered by
 *  virtue of being there, so unlike a browsing grid there's nothing left to toggle. */
function ItemTile({ item }: { item: InventoryItem }) {
  return (
    <SquareTile label={item.name} overlay={<span className="trading-page__tile-name">{item.name}</span>}>
      <span className="square-tile__icon" aria-hidden="true">
        {item.icon}
      </span>
    </SquareTile>
  )
}

interface SkillTileProps {
  skill: Skill
  isOffered?: boolean
  onToggle?: () => void
}

function SkillTile({ skill, isOffered, onToggle }: SkillTileProps) {
  const label = onToggle
    ? isOffered
      ? `Remove ${skill.name} from the table`
      : `Add ${skill.name} to the table`
    : skill.name

  return (
    <SquareTile
      label={label}
      onClick={onToggle}
      overlay={
        <>
          <span className="trading-page__tile-name">{skill.name}</span>
          <StarRating value={skill.rating} subject={`${skill.name}'s rating`} />
          {isOffered && <span className="trading-page__tile-flag">On table</span>}
        </>
      }
    >
      <span className="square-tile__icon" aria-hidden="true">
        {skill.icon}
      </span>
    </SquareTile>
  )
}

/* ---------- The trading table ---------- */

interface TradingTableZoneProps {
  trade: Trade
  status: Trade['status']
  offeredHours: number
  offeredItems: InventoryItem[]
  offeredSkills: Skill[]
  isAdjustingHours: boolean
  /** Whether Decline's "the other side can make a new offer" note should still be showing —
   *  cleared the moment the offer changes again (TODO #13). */
  isDeclined: boolean
  onToggleAdjustingHours: () => void
  onChangeOfferedHours: (hours: number) => void
  onAccept: () => void
  onDecline: () => void
}

/** No "Trading table" heading (direct feedback: decluttering pass) — a darker/lighter panel
 *  background (`--surface-alt`, light in dark mode and darker in light mode — see index.css) marks
 *  out the table's extent instead, the same "no label, a surface change carries it" idea the "You"/
 *  partner-name skills rows above and below already use for their own row-vs-row distinction. */
function TradingTableZone({
  trade,
  status,
  offeredHours,
  offeredItems,
  offeredSkills,
  isAdjustingHours,
  isDeclined,
  onToggleAdjustingHours,
  onChangeOfferedHours,
  onAccept,
  onDecline,
}: TradingTableZoneProps) {
  const [isNoteOpen, setIsNoteOpen] = useState(false)

  const yourEntries: TableEntry[] = [
    { kind: 'time', hours: offeredHours, editable: true },
    ...offeredItems.map((item): TableEntry => ({ kind: 'item', item })),
    ...offeredSkills.map((skill): TableEntry => ({ kind: 'skill', skill })),
  ]
  // §6: which items/skills the partner puts up isn't modelled — their tray has only their Time
  // tile, same as their drop area always started empty before this rework too.
  const partnerEntries: TableEntry[] = [{ kind: 'time', hours: trade.partnerHours, editable: false }]

  return (
    <section className="trading-page__zone">
      <div className="trading-page__table-stack">
        <div className="trading-page__side" role="group" aria-label="Your side of the trading table">
          <PagedGrid
            items={yourEntries}
            getKey={entryKey}
            columns={4}
            rows={1}
            gridLabel="Your offer on the table"
            renderTile={(entry) => (
              <TableTileView entry={entry} onOpenTime={onToggleAdjustingHours} />
            )}
          />
          {isAdjustingHours && (
            <HoursStepper hours={offeredHours} max={MOCK_HOURS_BALANCE} onChange={onChangeOfferedHours} />
          )}
        </div>

        {/* "You" sits between your table row and the respond row (direct feedback) — no longer
         *  nested inside the "Your side" group above, but it's still exactly the same information,
         *  just relocated; the group's own aria-label already names the region for anyone not
         *  reading it visually. */}
        <h3 className="trading-page__panel-title trading-page__you-label">You</h3>

        {/* Accept/Decline (when there's an open offer to respond to) and the final-review link
         *  (always) share one row — direct feedback asked for final review to sit "next to the
         *  reject button" rather than in its own row below the whole table, which also reclaims
         *  that row's height for the table itself. Final review has to stay reachable even when
         *  there's nothing left to accept/decline (an agreed trade is exactly when you'd use it),
         *  so it's not gated behind the same canRespondToOffer check the two buttons are. */}
        <div className="trading-page__respond" role="group" aria-label="Respond to this offer">
          {canRespondToOffer(status) && (
            <>
              <button
                type="button"
                className="trading-page__accept"
                aria-label="Accept trade"
                onClick={onAccept}
              >
                <span aria-hidden="true">✅</span>
              </button>
              <button type="button" className="trading-page__decline" aria-label="Decline offer" onClick={onDecline}>
                <span aria-hidden="true">✕</span>
              </button>
            </>
          )}
          {/* Appkarte §6 [OFFEN]: the icon language for the trading table beyond the Time tile is
           *  not defined yet. */}
          <Link className="trading-page__link" to={finalReview(trade.id)}>
            Final review
          </Link>
          <button
            type="button"
            className="trading-page__button"
            aria-label="About final review"
            aria-expanded={isNoteOpen}
            onClick={() => setIsNoteOpen((isOpen) => !isOpen)}
          >
            <span aria-hidden="true">ⓘ</span>
          </button>
        </div>

        <div
          className="trading-page__side"
          role="group"
          aria-label={`${trade.partner}'s side of the trading table`}
        >
          <h3 className="trading-page__panel-title">{trade.partner}</h3>
          <PagedGrid
            items={partnerEntries}
            getKey={entryKey}
            columns={4}
            rows={1}
            gridLabel={`${trade.partner}'s offer on the table`}
            renderTile={(entry) => <TableTileView entry={entry} />}
          />
        </div>
      </div>

      {/* Positioned out of the normal flow on purpose — see the comment on
       *  .trading-page__info-popover in TradingPage.css for why. */}
      {isNoteOpen && (
        <div className="trading-page__info-popover">
          <p className="page-note">§8: once a trade is agreed, final review is what officially closes it.</p>
          <p className="page-note">
            TODO #13: a trade that doesn't exist yet isn't modelled — opening Trading (plain or Quick
            Buy) always resolves to one of the mock trades above. Real trade creation is a bigger
            step than this page covers.
          </p>
        </div>
      )}

      {!canRespondToOffer(status) && (
        <p className="page-note">
          This trade is {TRADE_STATUS_LABEL[status].toLowerCase()} — there is no open offer left to
          accept.
        </p>
      )}

      {isDeclined && (
        <p className="trading-page__declined" role="status">
          Offer declined — build a new one above.
        </p>
      )}
    </section>
  )
}

/** Time is drawn "as an inherent skill offer" (TODO #11) — same tile shape as an item or skill,
 *  just never added to the Skills row itself (see the parenthetical in TODO #11). Tapping your
 *  own Time tile opens the hour stepper; the partner's is a plain read-out, same as their other
 *  tiles everywhere else on this page. */
function TableTileView({ entry, onOpenTime }: { entry: TableEntry; onOpenTime?: () => void }) {
  if (entry.kind === 'time') {
    const label = entry.editable
      ? `Your offered hours: ${entry.hours}. Tap to adjust.`
      : `Offered hours: ${entry.hours}`
    return (
      <SquareTile label={label} onClick={entry.editable ? onOpenTime : undefined} overlay={<span>{entry.hours} h</span>}>
        <span className="square-tile__icon" aria-hidden="true">
          ⏱️
        </span>
      </SquareTile>
    )
  }
  if (entry.kind === 'item') {
    return <ItemTile item={entry.item} />
  }
  return <SkillTile skill={entry.skill} />
}

interface HoursStepperProps {
  hours: number
  max: number
  onChange: (hours: number) => void
}

/** Adjusting your own offer is in scope — a stepper rather than a free-text field, so the offer
 *  can never exceed the hours you actually have. Revealed by tapping the Time tile above it
 *  (TODO #11), rather than always visible the way it was before this rework. */
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

/* ---------- The chat ---------- */

interface ChatZoneProps {
  partnerName: string
  initialMessages: ChatMessage[]
  /** TODO #13: Quick Buy "jumps to the chat" — the one behavioural difference from opening
   *  Trading normally. Whether the composer should also come pre-typed is left open (the TODO
   *  itself asks it as a question); this only starts the chat expanded. */
  startExpanded?: boolean
}

/** How far the collapsed peek has to be scrolled away from its pinned-to-bottom rest position
 *  before it counts as "scrolling up" (TODO #11) rather than layout noise. */
const SCROLL_EXPAND_THRESHOLD_PX = 4

function ChatZone({ partnerName, initialMessages, startExpanded = false }: ChatZoneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [isExpanded, setIsExpanded] = useState(startExpanded)
  const messagesRef = useRef<HTMLUListElement>(null)

  // Collapsed, the peek is meant to show only the last message (TODO #11) — pinning scrollTop to
  // the bottom on every render is what makes that true regardless of how many messages exist.
  useEffect(() => {
    if (!isExpanded && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [isExpanded, messages])

  /** TODO #11: "on scrolling up, extend the chat window to the full screen" — the manual expand
   *  button (kept "as is") is the deliberate control; this is the same result reached by
   *  scrolling the collapsed peek away from its pinned bottom instead. */
  const handleScroll = (event: UIEvent<HTMLUListElement>) => {
    if (isExpanded) return
    const el = event.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight > SCROLL_EXPAND_THRESHOLD_PX) {
      setIsExpanded(true)
    }
  }

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
      className={`trading-page__chat ${isExpanded ? 'is-expanded' : ''}`}
      aria-label={`Chat with ${partnerName}`}
    >
      <header className="trading-page__chat-header">
        <h2 className="trading-page__chat-heading">Chat</h2>
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

      <ul
        className="trading-page__messages"
        ref={messagesRef}
        onScroll={handleScroll}
        aria-label={isExpanded ? 'Full chat history' : 'Latest message'}
      >
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

      {/* Only shown expanded — collapsed, this page is already tight on vertical room (see
       *  TradingTableFooter's comment on the same trade-off), and this note matters far less when
       *  the peek is showing just one line anyway. */}
      {isExpanded && (
        <p className="page-note">
          §8 stores the chat log locally and lets you delete it — the prototype keeps messages in
          page state only, so they reset on reload.
        </p>
      )}
    </section>
  )
}
