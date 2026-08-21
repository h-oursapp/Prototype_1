import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { PagedGrid } from '../components/PagedGrid'
import { SquareTile } from '../components/SquareTile'
import type { InventoryItem } from '../data/mockInventory'
import { MOCK_PARTNER_INVENTORY, MOCK_YOUR_INVENTORY, publicItems } from '../data/mockInventory'
import type { ChatMessage, Trade } from '../data/mockTrades'
import { TRADE_STATUS_LABEL, canRespondToOffer, findTrade, statusAfterAccept } from '../data/mockTrades'
import type { Skill } from '../data/mockUser'
import { MOCK_HOURS_BALANCE, MOCK_PARTNER_SKILLS, MOCK_SKILLS } from '../data/mockUser'
import { finalReview, inventoryForTrade, partnerInventoryForTrade, ROUTES } from '../routes'
import { useTradeDraft } from '../trading/useTradeDraft'
import './TradingPage.css'

/** Trading (Appkarte §6, reworked repeatedly by TODO #11 — see HANDOFF.md for the fuller history)
 *  — a non-scrollable page: everything below the header has to fit inside PageShell's content area
 *  at once, so overflow within a row is paged through (PagedGrid) rather than scrolled past.
 *
 *  This round follows a second whiteboard sketch (`wireframes/trading2.png`) plus Márk's own
 *  words on top of it:
 *  - **Chat moved into a side window, hidden by default.** First built as a reuse of the favorites
 *    rail's own collapsible shell (see ChatOverlay's comment for how a follow-up feedback round
 *    changed that) — just holding chat instead of favorites now that favorites has nowhere left to
 *    live (its two jobs move elsewhere, next point). "Except in quick by" is Márk's own shorthand
 *    for TODO #13's existing Quick Buy flow (`?quick=1`): chat still starts open for that one case,
 *    same as the old ChatZone's `startExpanded` did.
 *  - **The favorites rail itself is gone.** Its two jobs move into the grids directly: "the first
 *    grid item opens the inventory" (`InventoryOpenerTile`, one per side, replacing both the old
 *    "+ Add items" and "Tradeables" buttons) and a curated favorites shortlist has no replacement
 *    — the slots it used to fill are mock suggestion tiles now (next point), not another
 *    quick-add shortcut. This also removes the only on-page way left to add a *skill* to the
 *    table (SkillsPage has its own `?trade=` picking UI, but it writes to nothing shared — see
 *    HANDOFF.md — so it was never actually reachable from here either way); flagged, not fixed,
 *    since Márk didn't ask for that this round.
 *  - **Empty slots show mock "suggestion" tiles at 50% white opacity** ("these will be later
 *    suggestions based on the trading partner's needs") — a real personalised-matching feature is
 *    well beyond this prototype, so `suggestionEntries` below just deterministically rotates
 *    through each side's own catalogue rather than actually reasoning about anyone's needs.
 *    Deliberately non-interactive (Márk's own "later", i.e. not yet) — see SuggestionTile.
 *  - **Both grids are bigger, "filling up all the available space"** — not a size-constant change
 *    (still 3×2, same "for now" qualifier as before), just freed-up room: with the stats
 *    row/action buttons gone and chat no longer a flex sibling at the bottom, this page's one
 *    growing row is entirely the table zone now.
 *  - **Accept/Decline moved again** — out of Final Review's row (see BottomBar) and into their own
 *    row *between* the two grids, "to the middle", beside the new generosity meter.
 *  - **A generosity meter is new** — Márk's own concept: how balanced the offer looks from your
 *    side, purely from the hours on each side (see `computeGenerosity`'s own comment for why
 *    items/skills don't move it — "the exact math is out of scope now", his words).
 *
 *  A follow-up feedback round on top of that tightened things further:
 *  - **The "N h available" line is gone** — direct feedback, no replacement; nothing else on the
 *    page needed it either.
 *  - **The generosity meter is now a single filled, chamfered bar** ("full of the current color...
 *    similar style as the buttons, with border and chamfer, have the text inside") rather than a
 *    5-segment strip with a caption underneath — see GenerosityBar.
 *  - **The chat rail's own floating toggle is gone too ("hide the chat completely")** — its open/
 *    close control moved into BottomBar, "next to the final review button... most of the space
 *    should be for final review". See ChatOverlay: with no control of its own left to render while
 *    collapsed, it now renders nothing at all rather than a barely-visible sliver.
 *  - **Final review is a real full-width `<button disabled>` now**, not a styled `<Link>` — "only
 *    enabled when the deal is agreed on" needed actual disabled semantics, not just a visual
 *    treatment a determined tap could still follow. Its old "about final review" info toggle had no
 *    room left in the new two-button bottom row, so it's dropped rather than squeezed in somewhere
 *    it wasn't asked for.
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

/* ---------- Grid entry types ---------- */

/** Everything either grid can show, in one union: the real offer (`time`/`add-time`/`item`), each
 *  side's own inventory shortcut (`open-inventory`), and the mock filler that pads out whatever's
 *  left (`suggested-item`/`suggested-skill`) — see the file banner comment for why all three kinds
 *  of "not a real offered thing" exist. One type rather than three separate ones because every
 *  slot in a grid is interchangeable from PagedGrid's point of view; TableTileView is the only
 *  place that needs to tell them apart. */
type TableEntry =
  | { kind: 'time'; hours: number; editable: boolean }
  | { kind: 'add-time' }
  | { kind: 'item'; item: InventoryItem }
  | { kind: 'open-inventory'; label: string; onOpen: () => void }
  | { kind: 'suggested-item'; item: InventoryItem }
  | { kind: 'suggested-skill'; skill: Skill }

function entryKey(entry: TableEntry): string {
  switch (entry.kind) {
    case 'time':
      return 'time'
    case 'add-time':
      return 'add-time'
    case 'item':
      return entry.item.id
    case 'open-inventory':
      return 'open-inventory'
    case 'suggested-item':
      return `suggested-item-${entry.item.id}`
    case 'suggested-skill':
      return `suggested-skill-${entry.skill.id}`
  }
}

/** Your side of the table, "for now" (Márk's own qualifier, kept from the first sketch) — a plain
 *  constant rather than a setting, same bar TODO #9's grid-size setting exists for things meant to
 *  actually vary. */
const YOUR_GRID_COLUMNS = 3
const YOUR_GRID_ROWS = 2

/** The partner's side matches yours, 3×2 (direct feedback from the first sketch's rework: "both
 *  sides should have 6 items") — even though only their Time tile is ever real, the rest of their
 *  grid is suggestion filler (see the file banner comment). */
const PARTNER_GRID_COLUMNS = 3
const PARTNER_GRID_ROWS = 2

const SUGGESTION_LABEL_PREFIX = 'Suggested:'

/** A tiny, deterministic stand-in for "pick something to show" — stable across re-renders (the
 *  grid shouldn't reshuffle itself every time you adjust the hour stepper) and predictable in
 *  tests, unlike `Math.random()`. Real personalised matching is a data/algorithm problem well
 *  beyond this prototype's placeholder scope; this only has to look varied from trade to trade. */
function seedFromString(seed: string): number {
  return [...seed].reduce((total, char) => total + char.charCodeAt(0), 0)
}

/** Rotates `list` by `amount` positions — e.g. `rotated([1,2,3], 1)` is `[2,3,1]`. The modulo twice
 *  (once to wrap a seed bigger than the list, once more to fix JavaScript's `%` returning negative
 *  for a negative left side, which `amount` never actually is here but a general-purpose rotate
 *  shouldn't assume) keeps `offset` a valid, always-non-negative index. */
function rotated<T>(list: T[], amount: number): T[] {
  if (list.length === 0) return list
  const offset = ((amount % list.length) + list.length) % list.length
  return [...list.slice(offset), ...list.slice(0, offset)]
}

/** Fills up to `count` mock suggestion tiles from `items`/`skills`, rotated by `seed` so the same
 *  trade always shows the same filler (stable across re-renders) while different trades/sides show
 *  a different slice of the same catalogue. Returns fewer than `count` once the catalogue itself
 *  runs out — there's no wraparound padding, since a repeated "suggestion" would look like a bug,
 *  not a feature. */
function suggestionEntries(seed: string, items: InventoryItem[], skills: Skill[], count: number): TableEntry[] {
  if (count <= 0) return []
  const pool: TableEntry[] = [
    ...items.map((item): TableEntry => ({ kind: 'suggested-item', item })),
    ...skills.map((skill): TableEntry => ({ kind: 'suggested-skill', skill })),
  ]
  return rotated(pool, seedFromString(seed)).slice(0, count)
}

/** TODO #8: Quick Buy passes the ad's listed hours through as `?hours=`, so the table starts
 *  already showing that offer instead of your usual default (`trade.yourHours`). A plain (non-
 *  quick) open, or a missing/unparseable value, falls back to that default — and the result is
 *  clamped to what you actually have, so a stale or tampered URL can never smuggle in more than
 *  your balance allows. */
function initialOfferedHours(trade: Trade, isQuickOffer: boolean, searchParams: URLSearchParams): number {
  if (!isQuickOffer) return trade.yourHours
  const hoursParam = searchParams.get('hours')
  if (hoursParam === null) return trade.yourHours
  const parsed = Number(hoursParam)
  return Number.isNaN(parsed) ? trade.yourHours : Math.min(parsed, MOCK_HOURS_BALANCE)
}

/* ---------- The generosity meter ---------- */

type GenerosityZone = 'you-extreme' | 'you-generous' | 'fair' | 'partner-generous' | 'partner-extreme' | 'empty'

interface Generosity {
  zone: GenerosityZone
  message: string
}

/** How far your offer's hours are from the partner's — Márk's own idea, "based on the offers
 *  items, skills and time how balanced is the trade from my generosity's perspective", with "the
 *  exact math is out of scope now" (his words) taken literally: items/skills sit on the table
 *  without moving this meter at all, since putting a real number of hours on an arbitrary item is
 *  exactly the kind of math that line rules out. Only the two Time tiles — the one number both
 *  sides of this page already agree means the same thing — feed it.
 *
 *  The band constants below were picked to match Márk's own three worked examples: offering 100h
 *  (+ an item, ignored) against 5h back lands past `GENEROSITY_EXTREME_BAND` ("extremely
 *  generous"), against 50h+10h lands past `GENEROSITY_FAIR_BAND` ("generous"), against 70h lands
 *  inside the fair band ("a fair trade") — the fair band's reciprocal and the extreme band's
 *  reciprocal then give the other side's two zones for free, by symmetry. */
const GENEROSITY_FAIR_BAND = 1.6
const GENEROSITY_EXTREME_BAND = 3

function computeGenerosity(yourHours: number, partnerHours: number): Generosity {
  if (yourHours === 0 && partnerHours === 0) {
    return { zone: 'empty', message: 'Add something to the table to see how the trade balances.' }
  }
  if (partnerHours === 0) {
    return { zone: 'you-extreme', message: 'You are extremely generous!' }
  }
  const ratio = yourHours / partnerHours
  if (ratio > GENEROSITY_EXTREME_BAND) return { zone: 'you-extreme', message: 'You are extremely generous!' }
  if (ratio > GENEROSITY_FAIR_BAND) return { zone: 'you-generous', message: 'You are generous.' }
  if (ratio >= 1 / GENEROSITY_FAIR_BAND) return { zone: 'fair', message: "That's a fair trade!" }
  if (ratio >= 1 / GENEROSITY_EXTREME_BAND) return { zone: 'partner-generous', message: 'Good deal!' }
  return { zone: 'partner-extreme', message: 'This is too good to be true.' }
}

/** In the order `computeGenerosity`'s zones fall along the yourHours/partnerHours ratio — used both
 *  to look up which colour a zone gets and, via its index, as the meter's `aria-valuenow`.
 *  `'empty'` isn't in here (see GenerosityBar): there's no colour to show yet. */
const GENEROSITY_ZONES: { zone: GenerosityZone; colorClass: 'is-red' | 'is-yellow' | 'is-green' }[] = [
  { zone: 'you-extreme', colorClass: 'is-red' },
  { zone: 'you-generous', colorClass: 'is-yellow' },
  { zone: 'fair', colorClass: 'is-green' },
  { zone: 'partner-generous', colorClass: 'is-yellow' },
  { zone: 'partner-extreme', colorClass: 'is-red' },
]

/** "Full of the current color... similar style as the buttons, with border and chamfer, have the
 *  text inside" (Márk) — one solid, chamfered bar rather than the 5-segment strip this started as:
 *  the message *is* the bar's own content now, not a caption underneath it. `role="meter"` still
 *  carries the same numeric semantics as before for assistive tech — `aria-valuetext` is the actual
 *  message, since the zones aren't evenly spaced enough for the raw index to mean much alone. */
function GenerosityBar({ yourHours, partnerHours }: { yourHours: number; partnerHours: number }) {
  const { zone, message } = computeGenerosity(yourHours, partnerHours)
  const activeIndex = GENEROSITY_ZONES.findIndex((entry) => entry.zone === zone)
  const colorClass = activeIndex >= 0 ? GENEROSITY_ZONES[activeIndex].colorClass : ''

  return (
    <div
      className={`trading-page__generosity ${colorClass}`}
      role="meter"
      aria-label="Generosity meter"
      aria-valuemin={0}
      aria-valuemax={GENEROSITY_ZONES.length - 1}
      {...(activeIndex >= 0 ? { 'aria-valuenow': activeIndex } : {})}
      aria-valuetext={message}
    >
      {message}
    </div>
  )
}

/** Everything below the id lookup. Split out so the hooks only ever run for a trade that exists —
 *  a component can't call useState after an early return. */
function TradeScreen({ trade }: { trade: Trade }) {
  const navigate = useNavigate()
  const { getOfferedItemIds, clearItems } = useTradeDraft()
  const [status, setStatus] = useState(trade.status)
  const [searchParams] = useSearchParams()
  // TODO #13: AdDetailPage's Quick Buy sends you here with ?quick=1 instead of the plain trading
  // route — the chat starting expanded (see ChatOverlay) and, per TODO #8, the offered hours below
  // being preloaded from the ad's listed price are the two things that actually differ.
  const isQuickOffer = searchParams.get('quick') === '1'
  const [offeredHours, setOfferedHours] = useState(() => initialOfferedHours(trade, isQuickOffer, searchParams))
  const [isTimeOffered, setIsTimeOffered] = useState(true)
  const [isAdjustingHours, setIsAdjustingHours] = useState(false)
  const [isDeclined, setIsDeclined] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(isQuickOffer)

  const offeredItemIds = getOfferedItemIds(trade.id)
  const offeredItems = MOCK_YOUR_INVENTORY.filter((item) => offeredItemIds.includes(item.id))

  const changeOfferedHours = (hours: number) => {
    setOfferedHours(hours)
    setIsDeclined(false)
  }

  /** "Delete it entirely" (Márk, re: the Time tile) — distinct from the stepper reaching 0h: this
   *  removes the tile from the table altogether, same end state an item has before it's ever
   *  toggled on. Re-added via the grid's own "add-time" tile (TableTileView), which reopens the
   *  stepper rather than guessing an amount. */
  const removeTime = () => {
    setIsTimeOffered(false)
    setIsAdjustingHours(false)
    setIsDeclined(false)
  }

  const addTimeBack = () => {
    setIsTimeOffered(true)
    setIsAdjustingHours(true)
    setIsDeclined(false)
  }

  /** TODO #13: "when declined the other side can make a new offer." This prototype has one user
   *  acting as both sides of the negotiation, so the modelled effect is the practical one — the
   *  table clears so a new offer can be built — rather than a second status value. The trade
   *  itself stays 'open': it was never agreed, so there's nothing to revert. */
  const decline = () => {
    clearItems(trade.id)
    setOfferedHours(trade.yourHours)
    setIsTimeOffered(true)
    setIsDeclined(true)
  }

  return (
    <PageShell title={`Trading with ${trade.partner}`} compactTitle>
      <div className="trading-page">
        <TradingTableZone
          trade={trade}
          status={status}
          isDeclined={isDeclined}
          offeredHours={offeredHours}
          offeredItems={offeredItems}
          isTimeOffered={isTimeOffered}
          isAdjustingHours={isAdjustingHours}
          onToggleAdjustingHours={() => setIsAdjustingHours((open) => !open)}
          onChangeOfferedHours={changeOfferedHours}
          onRemoveTime={removeTime}
          onAddTimeBack={addTimeBack}
          onOpenYourInventory={() => navigate(inventoryForTrade(trade.id))}
          onOpenPartnerInventory={() => navigate(partnerInventoryForTrade(trade.id))}
          onAccept={() => setStatus((current) => statusAfterAccept(current))}
          onDecline={decline}
        />

        <BottomBar
          trade={trade}
          status={status}
          isChatExpanded={isChatExpanded}
          onToggleChat={() => setIsChatExpanded((open) => !open)}
        />

        {/* Always mounted, not just while expanded — see ChatOverlay's own comment for why. */}
        <ChatOverlay partnerName={trade.partner} initialMessages={trade.messages} isExpanded={isChatExpanded} />
      </div>
    </PageShell>
  )
}

/* ---------- Tile overlays (items, the Time tile, inventory shortcuts, suggestions) ---------- */

/** Always read-only on the table now — nothing on this page toggles an item on/off any more (see
 *  the file banner comment on the favorites rail's removal); an item only ever appears here because
 *  Inventory's own page already put it on the shared draft. */
function ItemTile({ item }: { item: InventoryItem }) {
  return (
    <SquareTile label={item.name} overlay={<span className="trading-page__tile-name">{item.name}</span>}>
      <span className="square-tile__icon" aria-hidden="true">
        {item.icon}
      </span>
    </SquareTile>
  )
}

/** The grid's own first cell, both sides — Márk's own correction: "remove the add items button,
 *  also Lena's inventory... they should be replaced with the first grid item that opens the
 *  inventory, give it the inventory icon." Same two destinations the removed buttons had: yours
 *  opens your own inventory, the partner's opens their public-filtered one. */
function InventoryOpenerTile({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <SquareTile label={label} onClick={onOpen} overlay={<span className="trading-page__tile-name">Inventory</span>}>
      <span className="square-tile__icon" aria-hidden="true">
        ➜
      </span>
    </SquareTile>
  )
}

/** "The rest of the items" (Márk) — mock filler for whatever grid slots the real offer doesn't
 *  use, so both grids always read as full even though nothing on this page actually suggests
 *  anything yet. Deliberately non-interactive (no `onClick`, so SquareTile falls back to its
 *  read-only `role="img"` shape) — Márk's own words, "these will be *later* suggestions", i.e. not
 *  yet. Which item/skill lands in which slot comes from `suggestionEntries` above. */
function SuggestionTile({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="trading-page__suggestion-tile">
      <SquareTile
        label={`${SUGGESTION_LABEL_PREFIX} ${name} — matching coming soon`}
        overlay={<span className="trading-page__tile-name">{name}</span>}
      >
        <span className="square-tile__icon" aria-hidden="true">
          {icon}
        </span>
      </SquareTile>
    </div>
  )
}

/* ---------- The trading table ---------- */

interface TradingTableZoneProps {
  trade: Trade
  status: Trade['status']
  isDeclined: boolean
  offeredHours: number
  offeredItems: InventoryItem[]
  isTimeOffered: boolean
  isAdjustingHours: boolean
  onToggleAdjustingHours: () => void
  onChangeOfferedHours: (hours: number) => void
  onRemoveTime: () => void
  onAddTimeBack: () => void
  onOpenYourInventory: () => void
  onOpenPartnerInventory: () => void
  onAccept: () => void
  onDecline: () => void
}

/** The one bordered panel from Márk's sketch: your grid, the respond row (Accept/Decline + the
 *  generosity meter, "in the middle, between the two grids"), then the partner's grid, all inside
 *  the same `--surface-alt` panel. No "You"/partner-name headings any more — direct feedback
 *  ("make both grids bigger, fill up all the available space") means every row here has to earn
 *  its height; each side's own `role="group"` label still carries the distinction for assistive
 *  tech. */
function TradingTableZone({
  trade,
  status,
  isDeclined,
  offeredHours,
  offeredItems,
  isTimeOffered,
  isAdjustingHours,
  onToggleAdjustingHours,
  onChangeOfferedHours,
  onRemoveTime,
  onAddTimeBack,
  onOpenYourInventory,
  onOpenPartnerInventory,
  onAccept,
  onDecline,
}: TradingTableZoneProps) {
  const yourRealEntries: TableEntry[] = [
    { kind: 'open-inventory', label: 'Open your inventory', onOpen: onOpenYourInventory },
    isTimeOffered ? { kind: 'time', hours: offeredHours, editable: true } : { kind: 'add-time' },
    ...offeredItems.map((item): TableEntry => ({ kind: 'item', item })),
  ]
  const yourPerPage = YOUR_GRID_COLUMNS * YOUR_GRID_ROWS
  // Never suggest something you're already offering — it would show up twice, once for real.
  const yourSuggestionPool = MOCK_YOUR_INVENTORY.filter(
    (item) => !offeredItems.some((offered) => offered.id === item.id),
  )
  const yourEntries: TableEntry[] = [
    ...yourRealEntries,
    ...suggestionEntries(`${trade.id}-you`, yourSuggestionPool, MOCK_SKILLS, yourPerPage - yourRealEntries.length),
  ]

  // §6: which items/skills the partner puts up isn't modelled beyond their Time tile — same gap
  // this page has always had; their remaining slots are suggestion filler like yours.
  const partnerRealEntries: TableEntry[] = [
    { kind: 'open-inventory', label: `Open ${trade.partner}'s inventory`, onOpen: onOpenPartnerInventory },
    { kind: 'time', hours: trade.partnerHours, editable: false },
  ]
  const partnerPerPage = PARTNER_GRID_COLUMNS * PARTNER_GRID_ROWS
  const partnerEntries: TableEntry[] = [
    ...partnerRealEntries,
    ...suggestionEntries(
      `${trade.id}-partner`,
      publicItems(MOCK_PARTNER_INVENTORY),
      MOCK_PARTNER_SKILLS,
      partnerPerPage - partnerRealEntries.length,
    ),
  ]

  return (
    <section className="trading-page__zone">
      <div className="trading-page__table-stack">
        <div className="trading-page__side" role="group" aria-label="Your side of the trading table">
          <PagedGrid
            items={yourEntries}
            getKey={entryKey}
            columns={YOUR_GRID_COLUMNS}
            rows={YOUR_GRID_ROWS}
            gridLabel="Your offer on the table"
            renderTile={(entry) => (
              <TableTileView entry={entry} onOpenTime={onToggleAdjustingHours} onAddTimeBack={onAddTimeBack} />
            )}
          />
          {isAdjustingHours && (
            <HoursStepper
              hours={offeredHours}
              max={MOCK_HOURS_BALANCE}
              onChange={onChangeOfferedHours}
              onRemove={onRemoveTime}
            />
          )}
        </div>

        <OfferRespondRow
          status={status}
          isDeclined={isDeclined}
          yourHours={isTimeOffered ? offeredHours : 0}
          partnerHours={trade.partnerHours}
          onAccept={onAccept}
          onDecline={onDecline}
        />

        <div
          className="trading-page__side"
          role="group"
          aria-label={`${trade.partner}'s side of the trading table`}
        >
          <PagedGrid
            items={partnerEntries}
            getKey={entryKey}
            columns={PARTNER_GRID_COLUMNS}
            rows={PARTNER_GRID_ROWS}
            gridLabel={`${trade.partner}'s offer on the table`}
            renderTile={(entry) => <TableTileView entry={entry} />}
          />
        </div>
      </div>
    </section>
  )
}

interface OfferRespondRowProps {
  status: Trade['status']
  isDeclined: boolean
  yourHours: number
  partnerHours: number
  onAccept: () => void
  onDecline: () => void
}

/** Accept/Decline + the generosity meter, "in the middle, between the two grids, [with the meter]
 *  to the right" (Márk) — moved out of Final Review's row (see BottomBar) now that this row has
 *  its own reason to exist. */
function OfferRespondRow({ status, isDeclined, yourHours, partnerHours, onAccept, onDecline }: OfferRespondRowProps) {
  return (
    <div className="trading-page__respond">
      <div className="trading-page__respond-row" role="group" aria-label="Respond to this offer">
        <div className="trading-page__respond-actions">
          {canRespondToOffer(status) && (
            <>
              <button type="button" className="trading-page__accept" aria-label="Accept trade" onClick={onAccept}>
                <span aria-hidden="true">✅</span>
              </button>
              <button type="button" className="trading-page__decline" aria-label="Decline offer" onClick={onDecline}>
                <span aria-hidden="true">✕</span>
              </button>
            </>
          )}
        </div>

        <GenerosityBar yourHours={yourHours} partnerHours={partnerHours} />
      </div>

      {!canRespondToOffer(status) && (
        <p className="page-note trading-page__respond-note">
          This trade is {TRADE_STATUS_LABEL[status].toLowerCase()} — there is no open offer left to
          accept.
        </p>
      )}

      {isDeclined && (
        <p className="trading-page__declined" role="status">
          Offer declined — build a new one above.
        </p>
      )}
    </div>
  )
}

/** Time is drawn "as an item" (Márk, from the first sketch) — same tile shape as an item. Tapping
 *  your own Time tile opens the hour stepper; tapping the "add it back" tile (shown once it's been
 *  removed entirely) reopens the stepper too, so there's always a way back in. The partner's is a
 *  plain read-out, same as their other tiles everywhere else on this page. */
function TableTileView({
  entry,
  onOpenTime,
  onAddTimeBack,
}: {
  entry: TableEntry
  onOpenTime?: () => void
  onAddTimeBack?: () => void
}) {
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
  if (entry.kind === 'add-time') {
    return (
      <SquareTile label="Add a time offer" onClick={onAddTimeBack} overlay={<span>+ Time</span>}>
        <span className="square-tile__icon" aria-hidden="true">
          ⏱️
        </span>
      </SquareTile>
    )
  }
  if (entry.kind === 'item') {
    return <ItemTile item={entry.item} />
  }
  if (entry.kind === 'open-inventory') {
    return <InventoryOpenerTile label={entry.label} onOpen={entry.onOpen} />
  }
  if (entry.kind === 'suggested-item') {
    return <SuggestionTile name={entry.item.name} icon={entry.item.icon} />
  }
  return <SuggestionTile name={entry.skill.name} icon={entry.skill.icon} />
}

interface HoursStepperProps {
  hours: number
  max: number
  onChange: (hours: number) => void
  onRemove: () => void
}

/** Adjusting your own offer is in scope — a stepper rather than a free-text field, so the offer
 *  can never exceed the hours you actually have. Revealed by tapping the Time tile above it. The
 *  Remove button is the "delete it entirely" action — distinct from stepping down to 0h, which
 *  still just means "offering zero hours," not "no time tile at all". */
function HoursStepper({ hours, max, onChange, onRemove }: HoursStepperProps) {
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
      <button type="button" className="trading-page__stepper-remove" aria-label="Remove time from the table" onClick={onRemove}>
        Remove
      </button>
    </div>
  )
}

/* ---------- Bottom bar: final review + the chat toggle ---------- */

/** The page's one footer row now: Final review ("most of the space should be for the final
 *  review", Márk) and the chat's own open/close control beside it ("the extension button next to
 *  the final review button, on the right") — the chat's own floating side toggle from the previous
 *  round is gone entirely ("hide the chat completely"); this is its only control left anywhere.
 *
 *  Final review is a real `<button disabled>` rather than a styled `<Link>` — "only enabled when
 *  the deal is agreed on" needs actual disabled semantics (unclickable, announced as disabled to
 *  assistive tech), not just a dimmed link a determined tap could still follow. Its old "about
 *  final review" info toggle had no room left in a two-button row and isn't asked for here, so it's
 *  dropped rather than squeezed in. */
function BottomBar({
  trade,
  status,
  isChatExpanded,
  onToggleChat,
}: {
  trade: Trade
  status: Trade['status']
  isChatExpanded: boolean
  onToggleChat: () => void
}) {
  const navigate = useNavigate()
  const canReview = status === 'agreed'

  return (
    <div className="trading-page__bottom-row">
      <button
        type="button"
        className="trading-page__final-review"
        disabled={!canReview}
        title={canReview ? undefined : 'Available once this trade is agreed'}
        onClick={() => navigate(finalReview(trade.id))}
      >
        Final review
      </button>
      <button
        type="button"
        className="trading-page__chat-toggle"
        aria-expanded={isChatExpanded}
        aria-label={isChatExpanded ? 'Close chat' : 'Open chat'}
        onClick={onToggleChat}
      >
        <span aria-hidden="true">{isChatExpanded ? '✕' : '💬'}</span>
      </button>
    </div>
  )
}

/* ---------- The chat overlay ---------- */

/** "Move the chat to the side window, completely hidden by default (except in quick by)" (Márk) —
 *  a fixed overlay panel, not a wider flex sibling, for the same "don't let a toggled panel steal a
 *  flex sibling's space" reason this page has already shipped the bug for once (HANDOFF.md §8).
 *  "Quick by" is Márk's own shorthand for TODO #13's existing Quick Buy flow (`?quick=1`): chat
 *  still starts open for that one case, same as the old ChatZone's `startExpanded` prop did.
 *
 *  Collapsed, this renders nothing at all — direct follow-up feedback, "hide the chat completely" —
 *  not even a toggle handle of its own any more; that control now lives in BottomBar instead. Kept
 *  mounted unconditionally by its caller regardless (see TradeScreen) rather than conditionally
 *  rendered from outside, so `messages`/`draft` below survive being closed and reopened instead of
 *  resetting from `initialMessages` on every toggle. */
function ChatOverlay({
  partnerName,
  initialMessages,
  isExpanded,
}: {
  partnerName: string
  initialMessages: ChatMessage[]
  isExpanded: boolean
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const messagesRef = useRef<HTMLUListElement>(null)

  // Opening the chat (or sending into it) jumps straight to the newest message.
  useEffect(() => {
    if (isExpanded && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [isExpanded, messages])

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

  if (!isExpanded) {
    return null
  }

  return (
    <section className="trading-page__chat-overlay" aria-label={`Chat with ${partnerName}`}>
      <h2 className="trading-page__chat-heading">Chat</h2>

      <ul className="trading-page__messages" ref={messagesRef} aria-label="Full chat history">
        {messages.map((message) => (
          <li className={`trading-page__message ${message.from === 'you' ? 'is-yours' : ''}`} key={message.id}>
            <span className="trading-page__message-author">{message.from === 'you' ? 'You' : partnerName}</span>
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
