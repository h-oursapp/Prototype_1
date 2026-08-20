import { useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FilterChip } from '../components/FilterChip'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { PagedGrid } from '../components/PagedGrid'
import { RatingBadge } from '../components/RatingBadge'
import { SearchBar } from '../components/SearchBar'
import { SquareTile } from '../components/SquareTile'
import { MAX_STARS } from '../components/StarRating'
import { TransferBox } from '../components/TransferBox'
import type { InventoryItem } from '../data/mockInventory'
import { MOCK_YOUR_INVENTORY } from '../data/mockInventory'
import type { Trade } from '../data/mockTrades'
import { findTrade } from '../data/mockTrades'
import { MOCK_SKILLS, type Skill } from '../data/mockUser'
import { useFittingRows } from '../hooks/useFittingRows'
import { ROUTES, adCreateWithItem, itemDetail, skillDetail, trading } from '../routes'
import { useSettings } from '../settings/useSettings'
import { useTradeDraft } from '../trading/useTradeDraft'
import './InventoryPage.css'

/** Appkarte §6 has no notion of a skill/item *kind* filter in Inventory, unlike Search's
 *  skill/item/all split — the view switch below already splits by kind. What's left to narrow by
 *  is visibility, and (direct feedback) that's shared: the same filter now covers both the items
 *  grid and the Skills view, since both `InventoryItem` and `Skill` carry their own `isPublic`. */
type VisibilityFilter = 'all' | 'public' | 'private'

const VISIBILITY_FILTER_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

/** TODO #9's "2 buttons, one for the skills and one for the items" — collapsed by direct feedback
 *  into the single sliding toggle below (see `ViewSwitch`), since only one of the two grids is
 *  ever showing at once. Page-local state, not a route — see the file banner comment for why a
 *  same-page swap rather than an overlay or a separate URL. */
type InventoryView = 'items' | 'skills'

function matchesQuery(item: InventoryItem, query: string): boolean {
  return item.name.toLowerCase().includes(query.trim().toLowerCase())
}

function matchesSkillQuery(skill: Skill, query: string): boolean {
  return skill.name.toLowerCase().includes(query.trim().toLowerCase())
}

function matchesVisibility(item: InventoryItem, visibilityFilter: VisibilityFilter): boolean {
  if (visibilityFilter === 'all') return true
  return visibilityFilter === 'public' ? item.isPublic : !item.isPublic
}

function matchesSkillVisibility(skill: Skill, visibilityFilter: VisibilityFilter): boolean {
  if (visibilityFilter === 'all') return true
  return visibilityFilter === 'public' ? skill.isPublic : !skill.isPublic
}

function findMatches(items: InventoryItem[], query: string, visibilityFilter: VisibilityFilter): InventoryItem[] {
  return items.filter((item) => matchesQuery(item, query) && matchesVisibility(item, visibilityFilter))
}

function visibilityFilterLabel(visibilityFilter: VisibilityFilter): string {
  return VISIBILITY_FILTER_OPTIONS.find((option) => option.value === visibilityFilter)?.label ?? 'All'
}

/** Inventory (Appkarte §6, reworked by TODO #9) — "start from almost the beginning": a paged grid
 *  of your items by default (a flowing, scrollable one if the "inventory scrollable" Settings
 *  toggle is on), a second view for browsing your skills, plus the transfer box the card asks for
 *  when you arrive here from a trade.
 *
 *  Judgement calls worth knowing about:
 *  - Shelves are explicitly out of scope for the prototype (TODO #9), so there's no grouping left
 *    on this page — every item sits in one flat, paged grid. The header's shelf button stays
 *    (TODO #9 puts the new "New item" button *next to* it, which only makes sense if it's still
 *    there) but is now fully inert, not even a click target — the explanation for why lives in the
 *    header's "ⓘ" panel instead (direct feedback: every explanatory note on this page, previously
 *    scattered across the shelf button's own toggle, a standing paragraph under the grid, and a
 *    trade-context banner line, now lives in that one place).
 *  - Accepting an offer here (TransferBox's Accept button) navigates straight back to the trade it
 *    was opened from, the same place "Back to trading" goes — direct feedback again: this page is
 *    for building your side of the offer, not a destination in its own right, so confirming it is
 *    also leaving it. There's nothing left to show a "your offer was accepted" message *for* once
 *    the trade itself is showing that offer a moment later.
 *  - "Only the item name overlayed the picture" (TODO #9) means a tile is exactly a SquareTile:
 *    no badge, no shelf picker, nothing rendered below it. What used to live in that row — making
 *    an item public or private — moved to the new Item page (TODO #10), reached by tapping a tile.
 *  - In a trading context (?trade=<id>) or while picking an item for a new ad (?forAd=new,
 *    TODO #8), a tile can't *also* open Item detail: a page that isn't allowed to scroll has no
 *    spare row for a second control per cell, the dual-control split SkillsPage uses (tile opens
 *    detail, a button beneath it picks). So here the tile itself toggles the item into and out of
 *    the offer — tap again to remove it — and viewing an item's own page happens by browsing
 *    outside of either context instead. TODO #9 doesn't settle this either way, so it's written
 *    down here rather than left to be rediscovered.
 *  - Picking for a new ad caps the selection at one (an ad has exactly one subject) — a second tap
 *    elsewhere replaces the first rather than adding to it, unlike a trade's open-ended offer. It
 *    is kept in page-local state, not TradeDraftContext: that context exists purely for the
 *    Inventory↔Trading round trip, which the ad picker doesn't need — it hands its pick back via
 *    the URL instead (`adCreateWithItem`), the same way SkillsPage's ad-picking mode does.
 *  - Uploading is left out, as before — TODO #9 says what the grid looks like, not how items get
 *    into it.
 *  - The search bar and the one visibility filter only narrow which *tiles the current grid
 *    shows*; neither touches `items`/`MOCK_SKILLS` itself, so an already-offered item stays in the
 *    transfer box even if a search typed afterwards would hide its tile. Direct feedback made the
 *    visibility filter cover the Skills view too, once `Skill` grew its own `isPublic` (TODO #7's
 *    own "add private/public property", added narrowly for this — see mockUser.ts's comment) — one
 *    `visibilityFilter` piece of state now filters whichever list is showing, `findMatches` for
 *    items or `matchesSkillVisibility` for skills.
 *  - "Make the grid fill up the rest of the page. columns by the setting and rows as many as fits"
 *    (TODO #9) is `useFittingRows`: columns still comes straight from the grid-size setting, same
 *    as before, but rows is now measured from the actual space left under the search bar and
 *    filter row instead of reusing that same setting — a tall phone gets more rows per page, not
 *    just narrower ones. PagedGrid still sizes each cell to the largest square that fits
 *    `columns × rows`, and a short last page still pads out with visibly empty slots. The pager
 *    itself is the same `pagerVariant="floating-dots"` PagedGrid grew for Offers (TODO #16) —
 *    direct feedback asked for the identical dot strip, pinned to the same spot above the nav
 *    bar's own reopen button, here too — so `useFittingRows` is also called with `reserveBottomPx`
 *    0 like Offers: the dots float outside the page's own flow, so nothing needs reserving for
 *    them. Direct feedback also gave the Skills view this exact same paged treatment (it started
 *    out always flowing/unpaged — see the view-switch bullet below) via its own, independent
 *    `useFittingRows` call: the two grid-area boxes are mutually exclusive, so sharing one ref
 *    between them would leave whichever wasn't measured first stuck with a stale row count after a
 *    switch. `PagedGrid`'s dots now show even on a single page (PagedGrid.tsx's own doc comment) —
 *    without that, Skills' 5 mock entries would always fit on one page at any real grid size, and
 *    "add the paging" would have nothing to actually show.
 *  - The "inventory scrollable: yes / no" Settings toggle (TODO #9) swaps which grid component
 *    *both* views render, not just a CSS overflow flag — direct feedback made this uniform rather
 *    than items-only: off keeps `useFittingRows` + PagedGrid (a fixed page, the floating-dots
 *    pager), on renders every match through the same flowing, no-row-cap grid Skills' standalone
 *    page (`FlowGrid` below) uses, letting the page itself grow and scroll —
 *    `.inventory-page--scrollable` is what hands scrolling back to PageShell's own content area
 *    (it's `overflow-y: auto` already; this page just opts out of that by default). InventoryPage.css's
 *    `.inventory-page__grid-area .paged-grid__frame` override (direct feedback: items and skills
 *    read as different-sized gaps between the filter row and the grid) is what keeps both paged
 *    grids flush against the filter row instead of the frame's own default vertical centering,
 *    which just pushes the grid down by however much of a `useFittingRows` row it didn't quite fit
 *    — PagedGrid.css itself is left alone, since Home/Offers/the partner's inventory all still rely
 *    on that centering.
 *  - "2 buttons, one for the skills and one for the items" plus "skills open a separate view
 *    within the inventory" (TODO #9) is `view` state (`'items' | 'skills'`) — not a second route or
 *    an overlay, and (direct feedback, twice over) not two separate buttons either: `ViewSwitch`
 *    below is one sliding toggle, sitting where the plain-text view caption used to be, right above
 *    the search bar rather than in the title row. Both option names ("Items", "Skills") are always
 *    visible on it, with a sliding highlight over whichever is active — unlike a plain button whose
 *    label only ever shows one name at a time, this shows the current state *and* the alternative
 *    in the same control, still built from the app's usual button materials (border, chamfer,
 *    brand-tint) rather than a native rounded switch. The search bar, the visibility filter, and
 *    both TransferBoxes stay exactly where they are; only the toggle and the grid beneath it swap.
 *    The Skills view is read-only browsing (tap a tile → the Skill page): skills already have their
 *    own picking flow (`/skills?trade=`, TODO #8's `/skills?forAd=new`), so this page doesn't grow a
 *    second one — unifying item/skill picking into one flow is TODO #7's "items and skills have to
 *    be similar", not this one. It now follows the same paged-vs-flowing split the items view does
 *    (the scrollable-setting bullet above), rather than always flowing unconditionally the way it
 *    first shipped. */
export function InventoryPage() {
  const [searchParams] = useSearchParams()
  const trade = findTrade(searchParams.get('trade') ?? undefined)
  const isForNewAd = !trade && searchParams.get('forAd') === 'new'

  return <InventoryScreen trade={trade} isForNewAd={isForNewAd} />
}

/** Everything stateful, below the URL lookup — split out for the same reason TradingPage splits
 *  TradeScreen off: a component can't call hooks conditionally, and whether there's a trade is a
 *  question answered before any hook runs. */
function InventoryScreen({ trade, isForNewAd }: { trade: Trade | undefined; isForNewAd: boolean }) {
  const navigate = useNavigate()
  const { gridSize, inventoryScrollable } = useSettings()
  const { getOfferedItemIds, toggleItem, removeItem } = useTradeDraft()
  const [items] = useState<InventoryItem[]>(MOCK_YOUR_INVENTORY)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  // The ad picker's pick lives here, not in TradeDraftContext (see the file banner comment) —
  // it's capped at one, so toggling it is always "select this one, or clear it" rather than
  // appending, unlike a trade's item list below.
  const [adPickedIds, setAdPickedIds] = useState<string[]>([])

  const [view, setView] = useState<InventoryView>('items')
  const [query, setQuery] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
  const [isVisibilityFilterOpen, setIsVisibilityFilterOpen] = useState(false)
  const matches = findMatches(items, query, visibilityFilter)
  const matchingSkills = MOCK_SKILLS.filter(
    (skill) => matchesSkillQuery(skill, query) && matchesSkillVisibility(skill, visibilityFilter),
  )
  // The setting still drives columns; rows is measured from whatever height is actually left
  // under the search bar and filter row once they're on the page — see the file banner comment.
  // `reserveBottomPx` is 0, same as Offers: the floating-dots pager below sits outside the page's
  // own layout flow, so there's nothing to reserve room for. Skills gets its own independent
  // measurement rather than sharing this one — the two grid-area boxes are mutually exclusive
  // (only one is ever mounted at a time), and useFittingRows' own ResizeObserver is set up once
  // per element it's first attached to, so a single shared ref wouldn't reliably re-measure the
  // other view's box after a switch.
  const { containerRef: gridAreaRef, rows } = useFittingRows(gridSize, gridSize, 0)
  const { containerRef: skillsAreaRef, rows: skillRows } = useFittingRows(gridSize, gridSize, 0)
  // Both views page (fixed grid + floating dots) when this is off, and both flow/scroll when it's
  // on — direct feedback made this apply uniformly, rather than Skills always flowing regardless
  // of the setting (that's how it started out). Falls back to PageShell's own scrolling content
  // area (file banner comment), which today's fixed-height, `overflow: hidden` page opts out of.
  const isScrollableLayout = inventoryScrollable

  // Shared with TradingPage via TradeDraftContext, keyed by trade id — items picked here need to
  // survive the "Back to trading" round trip, unlike everything else on this page (hooks can't be
  // called conditionally, so this reads an empty list rather than skipping the call when there's
  // no trade).
  const offeredIds = trade ? getOfferedItemIds(trade.id) : isForNewAd ? adPickedIds : []
  const offeredItems = items.filter((item) => offeredIds.includes(item.id))
  const privateOfferedCount = offeredItems.filter((item) => !item.isPublic).length

  /** A tap both adds and removes — see the file banner comment on why there's no separate button
   *  for it here. In a trade this appends/removes from the shared draft; picking for a new ad
   *  replaces instead, since there's only ever one slot to fill. */
  const toggleOffered = (itemId: string) => {
    if (trade) {
      toggleItem(trade.id, itemId)
    } else if (isForNewAd) {
      setAdPickedIds((current) => (current.includes(itemId) ? [] : [itemId]))
    }
  }

  const removeFromOffer = (itemId: string) => {
    if (trade) {
      removeItem(trade.id, itemId)
    } else if (isForNewAd) {
      setAdPickedIds([])
    }
  }

  const isPicking = Boolean(trade) || isForNewAd

  // Shared between the paged (PagedGrid) and flowing (FlowGrid) items grid below — the two differ
  // only in what wraps them, never in how one tile itself looks or behaves.
  const renderItemTile = (item: InventoryItem) => (
    <ItemTile
      item={item}
      isOffered={offeredIds.includes(item.id)}
      onOpen={() => navigate(itemDetail(item.id))}
      onToggleOffered={isPicking ? () => toggleOffered(item.id) : undefined}
      pickingContext={trade ? 'trade' : 'ad'}
    />
  )

  const itemsGrid =
    matches.length === 0 ? (
      <p className="page-note">No items match your search.</p>
    ) : inventoryScrollable ? (
      <FlowGrid items={matches} getKey={(item) => item.id} columns={gridSize} gridLabel="Your inventory" renderTile={renderItemTile} />
    ) : (
      <PagedGrid
        items={matches}
        getKey={(item) => item.id}
        columns={gridSize}
        rows={rows}
        gridLabel="Your inventory"
        pagerVariant="floating-dots"
        renderTile={renderItemTile}
      />
    )

  const renderSkillTile = (skill: Skill) => (
    <InventorySkillTile skill={skill} onOpen={() => navigate(skillDetail(skill.id))} />
  )

  const skillsGrid =
    matchingSkills.length === 0 ? (
      <p className="page-note">No skills match your search.</p>
    ) : inventoryScrollable ? (
      <FlowGrid items={matchingSkills} getKey={(skill) => skill.id} columns={gridSize} gridLabel="Your skills" renderTile={renderSkillTile} />
    ) : (
      <PagedGrid
        items={matchingSkills}
        getKey={(skill) => skill.id}
        columns={gridSize}
        rows={skillRows}
        gridLabel="Your skills"
        pagerVariant="floating-dots"
        renderTile={renderSkillTile}
      />
    )

  return (
    <PageShell
      title="Inventory"
      headerAction={
        <div className="inventory-page__header-actions">
          <button type="button" className="page-shell__action page-shell__action--icon" aria-label="New shelf">
            <span aria-hidden="true">🗂️</span>
          </button>
          <button
            type="button"
            className="page-shell__action page-shell__action--icon"
            aria-label="About this page"
            aria-expanded={isInfoOpen}
            onClick={() => setIsInfoOpen((isOpen) => !isOpen)}
          >
            <span aria-hidden="true">ⓘ</span>
          </button>
          <button
            type="button"
            className="page-shell__action page-shell__action--icon"
            aria-label="New item"
            onClick={() => navigate(ROUTES.itemCreate)}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      }
    >
      <div className={`inventory-page${isScrollableLayout ? ' inventory-page--scrollable' : ''}`}>
        {isInfoOpen && (
          <div className="inventory-page__info-panel">
            <p className="page-note">
              Shelves are out of scope for this prototype (TODO #9): a shelf would be a special item
              that opens its own inventory page, one level deep, but nothing here creates one yet.
            </p>
            <p className="page-note">
              Prototype scope: the mock inventory is fixed, so nothing added on the Item page
              carries back here, and a reload brings back the starting list.
            </p>
            {trade && (
              <p className="page-note">
                §6: {trade.partner} only ever sees the items you marked public — tap an item again
                to take it back out of the offer.
              </p>
            )}
            {isForNewAd && (
              <p className="page-note">
                TODO #8: an ad has exactly one subject — picking a different item replaces this
                one rather than adding to it.
              </p>
            )}
          </div>
        )}

        {trade && <TradeContextBanner trade={trade} />}
        {isForNewAd && <AdContextBanner />}

        <ViewSwitch view={view} onChange={setView} />

        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={view === 'items' ? 'Search your inventory' : 'Search your skills'}
          ariaLabel={view === 'items' ? 'Search your inventory' : 'Search your skills'}
        />

        <div className="inventory-page__filters">
          <FilterChip
            label={visibilityFilterLabel(visibilityFilter)}
            isActive={visibilityFilter !== 'all'}
            isOpen={isVisibilityFilterOpen}
            onToggle={() => setIsVisibilityFilterOpen((isOpen) => !isOpen)}
          >
            <OptionGroup
              legend="Show"
              options={VISIBILITY_FILTER_OPTIONS}
              selected={visibilityFilter}
              onSelect={(value) => {
                setVisibilityFilter(value)
                setIsVisibilityFilterOpen(false)
              }}
            />
          </FilterChip>
        </div>

        {inventoryScrollable ? (
          view === 'items' ? (
            itemsGrid
          ) : (
            skillsGrid
          )
        ) : view === 'items' ? (
          <div className="inventory-page__grid-area" ref={gridAreaRef}>
            {itemsGrid}
          </div>
        ) : (
          <div className="inventory-page__grid-area" ref={skillsAreaRef}>
            {skillsGrid}
          </div>
        )}

        {trade && (
          <TransferBox
            items={offeredItems.map((item) => ({
              id: item.id,
              name: item.name,
              icon: item.icon,
              note: item.isPublic ? undefined : 'Private',
            }))}
            noun="item"
            pickActionLabel="Add to offer"
            backTo={{ label: 'Back to trading', path: trading(trade.id) }}
            primaryLabel="Accept"
            onPrimary={() => navigate(trading(trade.id))}
            onRemove={removeFromOffer}
            extraNote={
              privateOfferedCount > 0 && (
                <p className="page-note">
                  Still private, so invisible to {trade.partner}: {privateOfferedCount} of{' '}
                  {offeredItems.length}.
                </p>
              )
            }
          />
        )}

        {isForNewAd && (
          <TransferBox
            items={offeredItems.map((item) => ({ id: item.id, name: item.name, icon: item.icon }))}
            noun="item"
            pickActionLabel="Use for this ad"
            backTo={{ label: 'Back to new ad', path: ROUTES.adCreate }}
            primaryLabel="Use this item"
            primaryDisabled={offeredItems.length === 0}
            onPrimary={() => navigate(adCreateWithItem(offeredItems[0].id))}
            onRemove={removeFromOffer}
          />
        )}
      </div>
    </PageShell>
  )
}

/* ---------- Context banners ---------- */

function TradeContextBanner({ trade }: { trade: Trade }) {
  return (
    <section className="page-card inventory-page__trade-banner" aria-label="Trading context">
      <h2 className="inventory-page__banner-title">
        Picking items for your trade with {trade.partner}
      </h2>
      <p className="inventory-page__banner-subject">
        <span aria-hidden="true">{trade.icon}</span> {trade.subject}
      </p>
    </section>
  )
}

/** Same job as TradeContextBanner, worded for TODO #8's ad picker instead — there's no partner or
 *  subject to name here, just what this visit to Inventory is for. */
function AdContextBanner() {
  return (
    <section className="page-card inventory-page__trade-banner" aria-label="Picking context">
      <h2 className="inventory-page__banner-title">Picking an item for your new ad</h2>
    </section>
  )
}

/* ---------- View switch ---------- */

/** The single sliding toggle replacing both the old two-button OptionGroup (over the grid) and
 *  the header button that briefly replaced it (direct feedback, twice over) — see the file banner
 *  comment. One `<button>`, so it's still one control to tab to and one click target, but both
 *  option names stay visible with a sliding highlight (`.inventory-page__view-switch-thumb`) over
 *  whichever is active, rather than a label that only ever names one side. The two option spans
 *  are `aria-hidden` — decorative, since the button's own `aria-label` already states the result of
 *  tapping it, the same way an icon-only header button (e.g. "New shelf") hides its emoji from
 *  assistive tech and relies on its own label instead. Built from the app's usual button materials
 *  (`--border`, `--chamfer`, `--brand-tint`/`--brand-primary`) rather than a native rounded switch —
 *  "stick to the style of other buttons" ruled out the rounded-pill look a slide toggle usually
 *  gets. */
function ViewSwitch({ view, onChange }: { view: InventoryView; onChange: (view: InventoryView) => void }) {
  const isSkills = view === 'skills'

  return (
    <button
      type="button"
      className={`inventory-page__view-switch ${isSkills ? 'is-skills' : ''}`}
      aria-pressed={isSkills}
      aria-label={`Switch to ${isSkills ? 'Items' : 'Skills'} view`}
      onClick={() => onChange(isSkills ? 'items' : 'skills')}
    >
      <span className="inventory-page__view-switch-thumb" aria-hidden="true" />
      <span className="inventory-page__view-switch-option" aria-hidden="true">
        Items
      </span>
      <span className="inventory-page__view-switch-option" aria-hidden="true">
        Skills
      </span>
    </button>
  )
}

/* ---------- One cell of the grid ---------- */

interface ItemTileProps {
  item: InventoryItem
  isOffered: boolean
  onOpen: () => void
  /** Present in a trading context or while picking an item for a new ad — outside either there is
   *  no offer to add anything to. */
  onToggleOffered?: () => void
  /** Wording differs between building a multi-item trade offer and picking the one item for a new
   *  ad (TODO #8) — defaults to 'trade' since that's the only context before TODO #8. */
  pickingContext?: 'trade' | 'ad'
}

/** Exactly a SquareTile with the item's name overlaid (TODO #9), plus a single "N★" `RatingBadge`
 *  pinned to the corner (direct feedback: "make the star rating visible for the items as well" —
 *  the same Home's-Ads-tile treatment `InventorySkillTile` below already got). The rating is
 *  folded into the tile's own accessible name too, whichever wording is currently active, so a
 *  screen reader isn't shown the badge's number but never told it (`RatingBadge`'s own doc
 *  comment). Outside any picking context the tile opens the Item page; inside one it toggles the
 *  item into and out of the offer instead, per the judgement call documented on InventoryPage
 *  above. */
function ItemTile({ item, isOffered, onOpen, onToggleOffered, pickingContext = 'trade' }: ItemTileProps) {
  const isAd = pickingContext === 'ad'
  const action = onToggleOffered
    ? isOffered
      ? isAd
        ? `Remove ${item.name} as this ad's item`
        : `Remove ${item.name} from your offer`
      : isAd
        ? `Use ${item.name} for this ad`
        : `Add ${item.name} to your offer`
    : item.name
  const label = `${action}, rated ${item.rating} out of ${MAX_STARS}`

  return (
    <SquareTile
      label={label}
      onClick={onToggleOffered ?? onOpen}
      overlay={
        <>
          <span className="inventory-page__tile-name">{item.name}</span>
          {isOffered && <span className="inventory-page__tile-offered">{isAd ? 'Chosen' : 'In offer'}</span>}
        </>
      }
    >
      <span className="square-tile__icon" aria-hidden="true">
        {item.icon}
      </span>
      <RatingBadge value={item.rating} />
    </SquareTile>
  )
}

/* ---------- The flowing grid (scrollable items, and the Skills view) ---------- */

interface FlowGridProps<T> {
  items: T[]
  getKey: (item: T) => string
  columns: number
  gridLabel: string
  renderTile: (item: T) => ReactNode
}

/** Square tiles in a `columns`-wide CSS grid with no row cap — the shape standalone SkillsPage's
 *  own grid already uses, for the same two "just grow and let PageShell scroll" cases this page
 *  needs (items once `inventoryScrollable` is on, and the Skills view, see the file banner
 *  comment). Not shared with SkillsPage itself: two callers this small cost less to duplicate than
 *  to wire a cross-page dependency for — worth revisiting if a third one shows up. */
function FlowGrid<T>({ items, getKey, columns, gridLabel, renderTile }: FlowGridProps<T>) {
  return (
    <ul className="inventory-page__flow-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} aria-label={gridLabel}>
      {items.map((item) => (
        <li key={getKey(item)} className="inventory-page__flow-cell">
          <span className="inventory-page__flow-tile">{renderTile(item)}</span>
        </li>
      ))}
    </ul>
  )
}

/** A read-only SquareTile for the Skills view — matches Home's own Ads tile (GridSection.tsx)
 *  rather than SkillsPage's own two-stacked-star-rows tile, per direct feedback ("skills should be
 *  represented similarly as ... the offers are represented on the homepage"): the icon, the name
 *  overlaid at the bottom, and a single "N★" `RatingBadge` pinned to the corner. Only the
 *  self-rating shows — the same one number Home's and Search's badges show regardless of kind
 *  (mockOffers.ts's own comment on `Offer.rating`: "the tile overlay still just wants one number");
 *  the review rating isn't lost, just not repeated here — it's still on the Skill page a tap away.
 *  No pick button underneath, unlike SkillsPage's own tile: this page's "add to offer" concept is
 *  items-only, and skills already have their own picking flow elsewhere (file banner comment), so
 *  tapping a tile here just opens the Skill page. */
function InventorySkillTile({ skill, onOpen }: { skill: Skill; onOpen: () => void }) {
  return (
    <SquareTile
      label={`${skill.name}, rated ${skill.rating} out of ${MAX_STARS}`}
      onClick={onOpen}
      overlay={<span className="inventory-page__tile-name">{skill.name}</span>}
    >
      <span className="square-tile__icon" aria-hidden="true">
        {skill.icon}
      </span>
      <RatingBadge value={skill.rating} />
    </SquareTile>
  )
}
