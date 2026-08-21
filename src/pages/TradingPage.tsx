import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { GenerosityBar } from '../components/GenerosityBar'
import { PageShell } from '../components/PageShell'
import { PagedGrid } from '../components/PagedGrid'
import { SquareTile } from '../components/SquareTile'
import { TimeScrollPicker } from '../components/TimeScrollPicker'
import { WorthBadge } from '../components/WorthBadge'
import type { InventoryItem } from '../data/mockInventory'
import { MOCK_PARTNER_INVENTORY, MOCK_YOUR_INVENTORY, publicItems } from '../data/mockInventory'
import type { ChatMessage, Trade } from '../data/mockTrades'
import { TRADE_STATUS_LABEL, canRespondToOffer, findTrade, statusAfterAccept } from '../data/mockTrades'
import type { Skill } from '../data/mockUser'
import { MOCK_HOURS_BALANCE, MOCK_PARTNER_SKILLS, MOCK_SKILLS } from '../data/mockUser'
import {
  finalReview,
  inventoryForTrade,
  itemDetail,
  partnerInventoryForTrade,
  ROUTES,
} from '../routes'
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
 *  TODO #11's next round, on top of both of the above:
 *  - **Your own grid's opener tile disappears once the real offer alone fills all 6 slots** —
 *    "when the grid is full of items (6), open inventory is not available anymore". See
 *    `hasRoomToAddMore` below.
 *  - **"A button that opens my trading partner's profile" is still an open question** (Márk's own
 *    words: "not sure where") — a grid tile was tried here for one round, but got pulled back out
 *    (direct feedback) since the placement itself wasn't settled yet, not because a tile is
 *    necessarily wrong. TODO #11 keeps the request open rather than the tile as a placeholder
 *    answer; `PartnerProfilePage` (routes.ts's `partnerProfileForTrade`) still exists and is still
 *    reachable directly by URL, just not linked from anywhere in the UI yet.
 *  - **Time already was the slot right after the inventory opener, pre-filled on a quick offer**
 *    — this round found that already true from the "both grids bigger" rework, not something
 *    that needed changing.
 *
 *  A later round changed what "pre-filled" actually means the rest of the time: **opening the
 *  table plainly (not via Quick Buy) now starts Time as a suggestion, not a real offer** —
 *  "opening the trading window the time should be just a suggestion, opaque like the others, and
 *  show 1 hour... if its added make it active like now, if its removed make it a suggestion
 *  again" (Márk's own words). `SUGGESTED_TIME_HOURS` is that flat "1 hour", and
 *  `getIsTimeOffered`'s own fallback (`isQuickOffer`) is what keeps Quick Buy's own "already
 *  pre-filled" behaviour untouched — see tradeDraftContextInstance.ts's file comment. Declining
 *  now resets Time to that same suggestion state too (TradeDraftContext.tsx's `resetOffer`), not
 *  back to an active default — a declined offer should look exactly like a fresh one.
 *
 *  "Items worth" (a later, un-numbered session): every item tile on this page now also carries a
 *  `WorthBadge` — real offered items (`SplitItemTile`), the partner's read-only ones, and even
 *  suggestion filler, per Márk's own "everywhere it's in a grid." No `RatingBadge` sits alongside
 *  it here the way it does on Inventory's own tiles — this page never showed a rating at all
 *  before worth existed either, so worth follows suit rather than introducing a new badge this
 *  page didn't have a reason to add.
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

/** Everything either grid can show, in one union: the real offer (`time`/`suggested-time`/`item`),
 *  each side's own inventory shortcut (`open-inventory`), and the mock filler that pads out
 *  whatever's left (`suggested-item`/`suggested-skill`) — see the file banner comment for why all
 *  these kinds of "not a real offered thing" exist. `suggested-time` is the odd one out among
 *  them: unlike every other "suggested" kind, tapping it is a real action (TableTileView's own
 *  comment). One type rather than separate ones because every slot in a grid is interchangeable
 *  from PagedGrid's point of view; TableTileView is the only place that needs to tell them apart.
 *  (A `'open-profile'` kind lived here for one round — see the file banner comment on why it was
 *  pulled back out.) */
type TableEntry =
  | { kind: 'time'; hours: number; editable: boolean }
  | { kind: 'suggested-time' }
  | { kind: 'item'; item: InventoryItem }
  | { kind: 'open-inventory'; label: string; onOpen: () => void }
  | { kind: 'suggested-item'; item: InventoryItem }
  | { kind: 'suggested-skill'; skill: Skill }

function entryKey(entry: TableEntry): string {
  switch (entry.kind) {
    case 'time':
      return 'time'
    case 'suggested-time':
      return 'suggested-time'
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

/** Direct feedback: "opening the trading window the time should be just a suggestion... and show
 *  1 hour." A flat number rather than anything derived from the trade (`trade.yourHours`, say) —
 *  the suggestion is deliberately generic, the same one hour regardless of which trade it's on,
 *  unlike the real offer it turns into once accepted. */
const SUGGESTED_TIME_HOURS = 1

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
 *  quick) open, or a missing/unparseable value, falls back to that default too — though direct
 *  feedback on the Time tile itself (see the file banner comment) means that fallback almost never
 *  actually shows on a plain open any more: Time starts as a suggestion reading a flat
 *  `SUGGESTED_TIME_HOURS`, not this number, so `trade.yourHours` only surfaces here if some future
 *  caller reads `offeredHours` before Time is ever added. The clamp to what you actually have still
 *  applies regardless, so a stale or tampered URL can never smuggle in more than your balance
 *  allows. */
function initialOfferedHours(trade: Trade, isQuickOffer: boolean, searchParams: URLSearchParams): number {
  if (!isQuickOffer) return trade.yourHours
  const hoursParam = searchParams.get('hours')
  if (hoursParam === null) return trade.yourHours
  const parsed = Number(hoursParam)
  return Number.isNaN(parsed) ? trade.yourHours : Math.min(parsed, MOCK_HOURS_BALANCE)
}

/** Everything below the id lookup. Split out so the hooks only ever run for a trade that exists —
 *  a component can't call useState after an early return. */
function TradeScreen({ trade }: { trade: Trade }) {
  const navigate = useNavigate()
  const { getOfferedItemIds, removeItem, getOfferedHours, setOfferedHours, getIsTimeOffered, setTimeOffered, resetOffer } =
    useTradeDraft()
  const [status, setStatus] = useState(trade.status)
  const [searchParams] = useSearchParams()
  // TODO #13: AdDetailPage's Quick Buy sends you here with ?quick=1 instead of the plain trading
  // route — the chat starting expanded (see ChatOverlay) and, per TODO #8, the offered hours below
  // being preloaded from the ad's listed price are the two things that actually differ.
  const isQuickOffer = searchParams.get('quick') === '1'
  // TODO #9.1/#11: hours and the Time toggle now live in TradeDraftContext, shared with
  // Inventory's own trading-table overlay — see tradeDraftContextInstance.ts's own comment on why
  // both `getOfferedHours` and `getIsTimeOffered` still take this page's own quick-offer-aware
  // fallbacks rather than the context guessing one. Direct feedback: "opening the trading window,
  // the time should just be a suggestion... except if its a quick buy, than its already pre
  // filled" — `isQuickOffer` doubles as that fallback exactly.
  const offeredHours = getOfferedHours(trade.id, initialOfferedHours(trade, isQuickOffer, searchParams))
  const isTimeOffered = getIsTimeOffered(trade.id, isQuickOffer)
  const [isAdjustingHours, setIsAdjustingHours] = useState(false)
  const [isDeclined, setIsDeclined] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(isQuickOffer)

  const offeredItemIds = getOfferedItemIds(trade.id)
  const offeredItems = MOCK_YOUR_INVENTORY.filter((item) => offeredItemIds.includes(item.id))

  const changeOfferedHours = (hours: number) => {
    setOfferedHours(trade.id, hours)
    setIsDeclined(false)
  }

  /** "Delete it entirely" (Márk, re: the Time tile) — distinct from the picker reaching 0h: this
   *  removes the tile from the table altogether, same end state an item has before it's ever
   *  toggled on. Direct feedback: "if its removed make it a suggestion again" — removing doesn't
   *  leave a gap, it reverts the tile to the same opaque suggestion a fresh, never-touched trade
   *  starts with (see `SUGGESTED_TIME_TILE` below), re-added via that same suggestion tile
   *  (TableTileView), which reopens the picker rather than guessing an amount. */
  const removeTime = () => {
    setTimeOffered(trade.id, false)
    setIsAdjustingHours(false)
    setIsDeclined(false)
  }

  /** Always lands on `SUGGESTED_TIME_HOURS`, never whatever was offered before it was last
   *  removed — the suggestion tile that triggers this always reads "1 hour" (TableTileView), so
   *  accepting it has to produce exactly that, not a stale leftover number from an earlier round. */
  const addTimeBack = () => {
    setTimeOffered(trade.id, true)
    setOfferedHours(trade.id, SUGGESTED_TIME_HOURS)
    setIsAdjustingHours(true)
    setIsDeclined(false)
  }

  /** TODO #13: "when declined the other side can make a new offer." This prototype has one user
   *  acting as both sides of the negotiation, so the modelled effect is the practical one — the
   *  table clears so a new offer can be built — rather than a second status value. The trade
   *  itself stays 'open': it was never agreed, so there's nothing to revert. */
  const decline = () => {
    resetOffer(trade.id, trade.yourHours)
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
          onInspectItem={(itemId) => navigate(itemDetail(itemId))}
          onRemoveItem={(itemId) => removeItem(trade.id, itemId)}
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

/** TODO #11: "when clicking on a grid item split it into 2. on top have inspect option that open
 *  the item/skill. on the bottom a - that removes it [from] the offer." Unsplit, this is exactly
 *  the plain read-only tile the page has shown since the favorites rail was removed (see the file
 *  banner comment); tapping it opens the split rather than doing anything itself, the "in-place
 *  split" shape agreed on for this round. Only one tile is ever split open at once — TradingTableZone
 *  tracks which by id, so opening a second one implicitly closes the first.
 *
 *  There's deliberately no third "just close this, do nothing" control once it's split — inspect
 *  navigates away and remove clears the tile, and either one is the natural end of looking at a
 *  split tile at all; opening a different tile's split (or leaving the page) is what closes this
 *  one otherwise. */
function SplitItemTile({
  item,
  isSplit,
  onOpenSplit,
  onInspect,
  onRemove,
}: {
  item: InventoryItem
  isSplit: boolean
  onOpenSplit: () => void
  onInspect: () => void
  onRemove: () => void
}) {
  if (!isSplit) {
    return (
      <SquareTile
        label={`${item.name} — tap for options, worth ${item.worth}h`}
        onClick={onOpenSplit}
        overlay={<span className="trading-page__tile-name">{item.name}</span>}
      >
        <span className="square-tile__icon" aria-hidden="true">
          {item.icon}
        </span>
        <WorthBadge hours={item.worth} />
      </SquareTile>
    )
  }

  return (
    <div className="trading-page__split-tile" role="group" aria-label={`${item.name} options`}>
      <button type="button" className="trading-page__split-inspect" onClick={onInspect}>
        <span aria-hidden="true">{item.icon}</span>
        <span className="trading-page__tile-name">{item.name}</span>
      </button>
      <button
        type="button"
        className="trading-page__split-remove"
        aria-label={`Remove ${item.name} from your offer`}
        onClick={onRemove}
      >
        <span aria-hidden="true">−</span>
      </button>
    </div>
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
 *  yet. Which item/skill lands in which slot comes from `suggestionEntries` above.
 *
 *  `worth` is optional since only an `InventoryItem` suggestion has one — a suggested `Skill` has
 *  no `worth` field to show ("the worth should be shown everywhere ... in a grid", this session,
 *  read as "everywhere an item's own data shows", not as inventing one for skills). */
function SuggestionTile({ name, icon, worth }: { name: string; icon: string; worth?: number }) {
  const worthSuffix = worth === undefined ? '' : `, worth ${worth}h`
  return (
    <div className="trading-page__suggestion-tile">
      <SquareTile
        label={`${SUGGESTION_LABEL_PREFIX} ${name} — matching coming soon${worthSuffix}`}
        overlay={<span className="trading-page__tile-name">{name}</span>}
      >
        <span className="square-tile__icon" aria-hidden="true">
          {icon}
        </span>
        {worth !== undefined && <WorthBadge hours={worth} />}
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
  onInspectItem: (itemId: string) => void
  onRemoveItem: (itemId: string) => void
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
  onInspectItem,
  onRemoveItem,
  onAccept,
  onDecline,
}: TradingTableZoneProps) {
  // TODO #11's split-tile: which one item (if any) is currently showing its inspect/remove split,
  // by id rather than a boolean — so opening a different tile's split implicitly closes whichever
  // one was open before, with nothing extra to reset by hand.
  const [splitItemId, setSplitItemId] = useState<string | null>(null)

  const yourPerPage = YOUR_GRID_COLUMNS * YOUR_GRID_ROWS
  const yourOfferedEntries: TableEntry[] = [
    isTimeOffered ? { kind: 'time', hours: offeredHours, editable: true } : { kind: 'suggested-time' },
    ...offeredItems.map((item): TableEntry => ({ kind: 'item', item })),
  ]
  // TODO #11: "when the grid is full of items (6), open inventory is not available anymore" —
  // once the real offer alone already fills every slot there's no room left for the opener tile
  // regardless, so it's dropped rather than pushed onto a second PagedGrid page. Dropping it is
  // also what actually blocks adding more: the opener is the only way back to Inventory's own
  // picking flow from this page (routes.ts's inventoryForTrade), so no tile here means no path in.
  const hasRoomToAddMore = yourOfferedEntries.length < yourPerPage
  const yourRealEntries: TableEntry[] = hasRoomToAddMore
    ? [{ kind: 'open-inventory', label: 'Open your inventory', onOpen: onOpenYourInventory }, ...yourOfferedEntries]
    : yourOfferedEntries
  // Never suggest something you're already offering — it would show up twice, once for real.
  const yourSuggestionPool = MOCK_YOUR_INVENTORY.filter(
    (item) => !offeredItems.some((offered) => offered.id === item.id),
  )
  const yourEntries: TableEntry[] = [
    ...yourRealEntries,
    ...suggestionEntries(`${trade.id}-you`, yourSuggestionPool, MOCK_SKILLS, yourPerPage - yourRealEntries.length),
  ]

  // §6: which items/skills the partner puts up isn't modelled beyond their Time tile — same gap
  // this page has always had; their remaining slots are suggestion filler like yours. (A profile
  // opener lived here too for one round — see the file banner comment on why it's out again.)
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
              <TableTileView
                entry={entry}
                isAdjustingHours={isAdjustingHours}
                onOpenTime={onToggleAdjustingHours}
                onChangeHours={onChangeOfferedHours}
                onRemoveTime={onRemoveTime}
                onAddTimeBack={onAddTimeBack}
                splitItemId={splitItemId}
                onOpenSplitItem={setSplitItemId}
                onInspectItem={onInspectItem}
                onRemoveItem={(itemId) => {
                  onRemoveItem(itemId)
                  setSplitItemId(null)
                }}
              />
            )}
          />
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
 *  your own Time tile opens TimeScrollPicker (TODO #11); tapping the "add it back" tile (shown
 *  once it's been removed entirely) reopens it too, so there's always a way back in. The partner's
 *  is a plain read-out, same as their other tiles everywhere else on this page — none of the
 *  editing-only props below ever get passed for their grid (see TradingTableZone's second
 *  `<PagedGrid>` call). */
function TableTileView({
  entry,
  isAdjustingHours,
  onOpenTime,
  onChangeHours,
  onRemoveTime,
  onAddTimeBack,
  splitItemId,
  onOpenSplitItem,
  onInspectItem,
  onRemoveItem,
}: {
  entry: TableEntry
  isAdjustingHours?: boolean
  onOpenTime?: () => void
  onChangeHours?: (hours: number) => void
  onRemoveTime?: () => void
  onAddTimeBack?: () => void
  splitItemId?: string | null
  onOpenSplitItem?: (itemId: string) => void
  onInspectItem?: (itemId: string) => void
  onRemoveItem?: (itemId: string) => void
}) {
  if (entry.kind === 'time') {
    const label = entry.editable
      ? `Your offered hours: ${entry.hours}. Tap to adjust.`
      : `Offered hours: ${entry.hours}`
    return (
      // `position: relative` unconditionally (TradingPage.css) rather than only while open — the
      // partner's own read-only Time tile never opens a picker, but sharing one class either way
      // means nothing here has to guess in advance whether this particular render will need it.
      <div className="trading-page__time-cell">
        <SquareTile
          label={label}
          onClick={entry.editable ? onOpenTime : undefined}
          overlay={<span>{entry.hours} h</span>}
        >
          <span className="square-tile__icon" aria-hidden="true">
            ⏱️
          </span>
        </SquareTile>
        {entry.editable && isAdjustingHours && onChangeHours && onRemoveTime && onOpenTime && (
          <TimeScrollPicker
            hours={entry.hours}
            maxHours={MOCK_HOURS_BALANCE}
            onChangeHours={onChangeHours}
            onRemove={onRemoveTime}
            onClose={onOpenTime}
          />
        )}
      </div>
    )
  }
  if (entry.kind === 'suggested-time') {
    // Direct feedback: "the time should be just a suggestion, opaque like the others, and show 1
    // hour" — same opaque/desaturated look SuggestionTile uses, but (unlike a real suggestion
    // tile) this one is genuinely actionable: tapping it puts real time on the table, since a
    // suggested amount of time is never a stand-in for a future matching feature the way a
    // suggested item/skill still is. `SuggestionTile` itself stays deliberately non-interactive
    // (its own doc comment), so this is written out separately rather than reusing it with an
    // added `onClick` that would only ever apply to this one caller.
    return (
      <div className="trading-page__suggestion-tile">
        <SquareTile
          label={`${SUGGESTION_LABEL_PREFIX} ${SUGGESTED_TIME_HOURS} hour of your time — tap to add it to the offer`}
          onClick={onAddTimeBack}
          overlay={<span>{SUGGESTED_TIME_HOURS} h</span>}
        >
          <span className="square-tile__icon" aria-hidden="true">
            ⏱️
          </span>
        </SquareTile>
      </div>
    )
  }
  if (entry.kind === 'item') {
    // Read-only on the partner's grid (none of these three props are passed there) — same shape
    // as the plain read-out that was always ItemTile's whole job before TODO #11's split.
    if (!onOpenSplitItem || !onInspectItem || !onRemoveItem) {
      return (
        <SquareTile
          label={`${entry.item.name}, worth ${entry.item.worth}h`}
          overlay={<span className="trading-page__tile-name">{entry.item.name}</span>}
        >
          <span className="square-tile__icon" aria-hidden="true">
            {entry.item.icon}
          </span>
          <WorthBadge hours={entry.item.worth} />
        </SquareTile>
      )
    }
    return (
      <SplitItemTile
        item={entry.item}
        isSplit={entry.item.id === splitItemId}
        onOpenSplit={() => onOpenSplitItem(entry.item.id)}
        onInspect={() => onInspectItem(entry.item.id)}
        onRemove={() => onRemoveItem(entry.item.id)}
      />
    )
  }
  if (entry.kind === 'open-inventory') {
    return <InventoryOpenerTile label={entry.label} onOpen={entry.onOpen} />
  }
  if (entry.kind === 'suggested-item') {
    return <SuggestionTile name={entry.item.name} icon={entry.item.icon} worth={entry.item.worth} />
  }
  return <SuggestionTile name={entry.skill.name} icon={entry.skill.icon} />
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
