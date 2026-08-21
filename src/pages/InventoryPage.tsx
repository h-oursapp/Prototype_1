import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FilterChip } from '../components/FilterChip'
import { GenerosityBar } from '../components/GenerosityBar'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { PagedGrid } from '../components/PagedGrid'
import { RatingBadge } from '../components/RatingBadge'
import { SearchBar } from '../components/SearchBar'
import { SquareTile } from '../components/SquareTile'
import { MAX_STARS } from '../components/StarRating'
import { TimeScrollPicker } from '../components/TimeScrollPicker'
import { TransferBox } from '../components/TransferBox'
import type { InventoryItem } from '../data/mockInventory'
import { MOCK_YOUR_INVENTORY } from '../data/mockInventory'
import type { Trade } from '../data/mockTrades'
import { canRespondToOffer, findTrade } from '../data/mockTrades'
import { MOCK_HOURS_BALANCE, MOCK_SKILLS, type Skill } from '../data/mockUser'
import { DOTS_ALLOWANCE_PX, useFittingRows } from '../hooks/useFittingRows'
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
 *  - Accepting an offer here (the trading-table overlay's own Accept button, TODO #9.1) navigates
 *    straight back to the trade it was opened from — direct feedback: this page is for building
 *    your side of the offer, not a destination in its own right, so confirming it is also leaving
 *    it. There's nothing left to show a "your offer was accepted" message *for* once the trade
 *    itself is showing that offer a moment later. The plain drop-area/list TransferBox used to
 *    give this job (heading "Trading with XY") is gone now — the overlay's own live grid replaced
 *    everything it did, so there is no longer a second, static place showing the same offer.
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
 *    itself is the same `pagerVariant="dots"` PagedGrid grew for Offers (TODO #16) — direct
 *    feedback asked for the identical dot strip here too, and (TODO #20) it now flows right after
 *    the grid rather than floating pinned over the nav bar (that collided with the nav bar itself
 *    re-expanding over it) — so `useFittingRows` is called with `DOTS_ALLOWANCE_PX` as its
 *    `reserveBottomPx`, the same way it's always been called with the buttons pager's own
 *    allowance elsewhere. Direct feedback also gave the Skills view this exact same paged treatment (it started
 *    out always flowing/unpaged — see the view-switch bullet below) via its own, independent
 *    `useFittingRows` call: the two grid-area boxes are mutually exclusive, so sharing one ref
 *    between them would leave whichever wasn't measured first stuck with a stale row count after a
 *    switch. `PagedGrid`'s dots now show even on a single page (PagedGrid.tsx's own doc comment) —
 *    without that, Skills' 5 mock entries would always fit on one page at any real grid size, and
 *    "add the paging" would have nothing to actually show.
 *  - The "inventory scrollable: yes / no" Settings toggle (TODO #9) swaps which grid component
 *    *both* views render, not just a CSS overflow flag — direct feedback made this uniform rather
 *    than items-only: off keeps `useFittingRows` + PagedGrid (a fixed page, the dots pager), on
 *    renders every match through the same flowing, no-row-cap grid Skills' standalone
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
 *    brand-tint) rather than a native rounded switch. The search bar, the visibility filter, the
 *    ad-picker's TransferBox and the trading-table overlay all stay exactly where they are; only
 *    the toggle and the grid beneath it swap.
 *    The Skills view is read-only browsing outside a trading context (tap a tile → the Skill
 *    page) — it also has its own separate picking flow for a new ad (`/skills?forAd=new`, TODO
 *    #8), untouched here. It now follows the same paged-vs-flowing split the items view does (the
 *    scrollable-setting bullet above), rather than always flowing unconditionally the way it first
 *    shipped.
 *    A later round gave a trading context's Skills view the same split "inspect / add" tile items
 *    already had (`TradeSkillTile`, direct feedback: "skills should have the inspect / add
 *    behaviour") — skills now share the trading table with items instead of being left out of it
 *    (TradeDraftContext's own file comment covers what that did and didn't unify). */
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
  const {
    getOfferedItemIds,
    toggleItem,
    removeItem,
    getOfferedSkillIds,
    toggleSkill,
    removeSkill,
    getOfferedHours,
    setOfferedHours,
    getIsTimeOffered,
    setTimeOffered,
    resetOffer,
  } = useTradeDraft()
  const [items] = useState<InventoryItem[]>(MOCK_YOUR_INVENTORY)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  // The ad picker's pick lives here, not in TradeDraftContext (see the file banner comment) —
  // it's capped at one, so toggling it is always "select this one, or clear it" rather than
  // appending, unlike a trade's item list below.
  const [adPickedIds, setAdPickedIds] = useState<string[]>([])
  // TODO #9.1's split tile: which one item (if any) is showing its inspect/add split, by id —
  // same "only one at a time, tracked by id" shape TradingPage's own split-tile state uses. Skills
  // get their own, separate id — the two views never show at once, but an item id and a skill id
  // are still two different things to be split open.
  const [splitItemId, setSplitItemId] = useState<string | null>(null)
  const [splitSkillId, setSplitSkillId] = useState<string | null>(null)
  // TODO #9.1: the trading-table overlay starts expanded (so arriving from Trading shows what's
  // already on offer at a glance) and collapses itself on search/scroll/page-flip — see the
  // effects below, and TradeTableOverlay's own doc comment for the collapsed shape.
  const [isTableExpanded, setIsTableExpanded] = useState(true)
  const inventoryPageRef = useRef<HTMLDivElement>(null)

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
  // `reserveBottomPx` reserves room for the dots pager below (TODO #20: it flows in-page now,
  // instead of floating outside the page's own layout, so it needs the same kind of reserved
  // space the buttons pager always did). Skills gets its own independent measurement rather than
  // sharing this one — the two grid-area boxes are mutually exclusive (only one is ever mounted at
  // a time), and useFittingRows' own ResizeObserver is set up once per element it's first attached
  // to, so a single shared ref wouldn't reliably re-measure the other view's box after a switch.
  const { containerRef: gridAreaRef, rows } = useFittingRows(gridSize, gridSize, DOTS_ALLOWANCE_PX)
  const { containerRef: skillsAreaRef, rows: skillRows } = useFittingRows(gridSize, gridSize, DOTS_ALLOWANCE_PX)
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
  // TODO #9.1: "the items already in trade should keep their respected positions" — the overlay
  // below needs *insertion* order (whatever order they were actually added in), not the catalogue
  // order `offeredItems` above uses (a plain `.filter` over `items` always reads in catalogue
  // order regardless of when each id was added). `offeredIds` is itself already insertion-ordered
  // (TradeDraftContext.tsx's `toggleItem` only ever appends), so mapping straight over it instead
  // of filtering `items` is what preserves that — see TradeTableOverlay's own doc comment for why
  // that distinction is what makes "keep their positions" true at all.
  const offeredItemsInAddOrder = offeredIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is InventoryItem => item !== undefined)
  // Skills (direct feedback: "skills should have the inspect / add behaviour" too) — trade-only,
  // same as items are for the ad-picker: TODO #8's ad picker has exactly one subject and it's
  // always an item, so there's no `isForNewAd` branch here the way `offeredIds` above has one.
  const offeredSkillIds = trade ? getOfferedSkillIds(trade.id) : []
  const offeredSkillsInAddOrder = offeredSkillIds
    .map((id) => MOCK_SKILLS.find((skill) => skill.id === id))
    .filter((skill): skill is Skill => skill !== undefined)
  const offeredHours = trade ? getOfferedHours(trade.id, trade.yourHours) : 0
  // TODO #9.1: "when its a suggestion it shouldn't show up on the inventory" — this page has no
  // notion of a quick offer to fall back to the way TradingPage does, so Time only ever counts as
  // offered here once it's been explicitly added; a plain `false` fallback is always the right one.
  const isTimeOffered = trade ? getIsTimeOffered(trade.id, false) : false
  const canAddMoreToTable =
    offeredItemsInAddOrder.length + offeredSkillsInAddOrder.length + (isTimeOffered ? 1 : 0) < TABLE_OVERLAY_SLOTS

  /** TODO #9.1: "make it hide when the user searches" — any real edit to the search bar collapses
   *  the table; clearing it back to blank doesn't re-expand it on its own (the expand button is
   *  always right there once collapsed). A plain event handler, not a `query`-watching effect —
   *  this *is* the one place `query` actually changes, so there's nothing to "synchronize"
   *  after the fact; reacting to it here instead is what the lint rule against deriving state in
   *  an effect is steering toward. Called for every keystroke regardless of trade context; it's
   *  a no-op without one, since the table itself never renders then. */
  const changeQuery = (value: string) => {
    setQuery(value)
    if (trade && value !== '') setIsTableExpanded(false)
  }

  // "...or scrolls" — the one trigger this page doesn't already track as state. `.inventory-page`
  // (this component's own outermost element) is always PageShell's scrolling content area's
  // direct child (PageShell.tsx renders `<main className="page-shell__content">{children}</main>`),
  // so `parentElement` reaches that scrollable ancestor without a wider DOM query. Only actually
  // scrolls while `inventoryScrollable` is on — see the file banner comment — so this is a no-op
  // the rest of the time, but it costs nothing to leave listening either way.
  useEffect(() => {
    if (!trade) return
    const scrollContainer = inventoryPageRef.current?.parentElement
    if (!scrollContainer) return
    const collapseTable = () => setIsTableExpanded(false)
    scrollContainer.addEventListener('scroll', collapseTable)
    return () => scrollContainer.removeEventListener('scroll', collapseTable)
  }, [trade])

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

  // Skills only ever toggle in a trade context — no ad-picker branch, see offeredSkillIds above.
  // Removing an already-offered skill is the trading-table overlay's own job (its `onRemoveSkill`
  // calls `removeSkill` directly) — no separate wrapper needed the way `removeFromOffer` exists
  // for items, since there's no skill-equivalent of the ad-picker's TransferBox to also call it.
  const toggleSkillOffered = (skillId: string) => {
    if (trade) toggleSkill(trade.id, skillId)
  }

  // Shared between the paged (PagedGrid) and flowing (FlowGrid) items grid below — the two differ
  // only in what wraps them, never in how one tile itself looks or behaves.
  //
  // TODO #9.1 gave the trading context its own tile (TradeItemTile, the split inspect/add tile)
  // instead of ItemTile's plain toggle — picking an item for a new ad (TODO #8) keeps the toggle,
  // since that round of feedback was about Inventory *in a trading context* specifically and
  // never touched the ad-picker's own flow.
  const renderItemTile = (item: InventoryItem) => {
    const isOffered = offeredIds.includes(item.id)
    if (trade) {
      return (
        <TradeItemTile
          item={item}
          isOffered={isOffered}
          isSplit={item.id === splitItemId}
          canAddMore={canAddMoreToTable}
          onOpenSplit={() => setSplitItemId(item.id)}
          onCloseSplit={() => setSplitItemId(null)}
          onInspect={() => navigate(itemDetail(item.id))}
          onAdd={() => {
            if (!canAddMoreToTable) return
            toggleOffered(item.id)
            setSplitItemId(null)
            // Direct feedback: "the trading table should expand when I add an item/skill" — so
            // adding one is never followed by having to go find the table again by hand.
            setIsTableExpanded(true)
          }}
        />
      )
    }
    return (
      <ItemTile
        item={item}
        isOffered={isOffered}
        onOpen={() => navigate(itemDetail(item.id))}
        onToggleOffered={isForNewAd ? () => toggleOffered(item.id) : undefined}
      />
    )
  }

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
        pagerVariant="dots"
        renderTile={renderItemTile}
        onPageChange={trade ? () => setIsTableExpanded(false) : undefined}
      />
    )

  // Same split as renderItemTile above, once direct feedback asked for skills to get the same
  // "inspect / add" behaviour — see TradeSkillTile's own doc comment.
  const renderSkillTile = (skill: Skill) => {
    const isOffered = offeredSkillIds.includes(skill.id)
    if (trade) {
      return (
        <TradeSkillTile
          skill={skill}
          isOffered={isOffered}
          isSplit={skill.id === splitSkillId}
          canAddMore={canAddMoreToTable}
          onOpenSplit={() => setSplitSkillId(skill.id)}
          onCloseSplit={() => setSplitSkillId(null)}
          onInspect={() => navigate(skillDetail(skill.id))}
          onAdd={() => {
            if (!canAddMoreToTable) return
            toggleSkillOffered(skill.id)
            setSplitSkillId(null)
            setIsTableExpanded(true)
          }}
        />
      )
    }
    return <InventorySkillTile skill={skill} onOpen={() => navigate(skillDetail(skill.id))} />
  }

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
        pagerVariant="dots"
        renderTile={renderSkillTile}
        onPageChange={trade ? () => setIsTableExpanded(false) : undefined}
      />
    )

  return (
    <PageShell
      title="Inventory"
      // Direct feedback: the nav bar (and its own collapsed reopen button) competes with the
      // trading-table overlay for the same bottom edge — hidden entirely in a trading context,
      // where that overlay now owns that strip instead. See PageShell.tsx's own doc comment.
      hideNavBar={Boolean(trade)}
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
      <div
        className={`inventory-page${isScrollableLayout ? ' inventory-page--scrollable' : ''}`}
        ref={inventoryPageRef}
      >
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

        {/* TODO #9: the view switch used to sit on its own row above the search bar — direct
         *  feedback moved it beside the bar instead (to its left), so the two controls share one
         *  row rather than stacking. `.inventory-page__search-row` (CSS) is what makes the search
         *  bar shrink to make room, rather than SearchBar itself gaining a width opinion it'd need
         *  for every other caller too. */}
        <div className="inventory-page__search-row">
          <ViewSwitch view={view} onChange={setView} />
          <SearchBar
            value={query}
            onChange={changeQuery}
            placeholder={view === 'items' ? 'Search your inventory' : 'Search your skills'}
            ariaLabel={view === 'items' ? 'Search your inventory' : 'Search your skills'}
          />
        </div>

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

        {trade && (
          <TradeTableOverlay
            trade={trade}
            offeredItems={offeredItemsInAddOrder}
            offeredSkills={offeredSkillsInAddOrder}
            offeredHours={offeredHours}
            isTimeOffered={isTimeOffered}
            isExpanded={isTableExpanded}
            onToggleExpanded={() => setIsTableExpanded((expanded) => !expanded)}
            onChangeHours={(hours) => setOfferedHours(trade.id, hours)}
            onRemoveTime={() => setTimeOffered(trade.id, false)}
            onInspectItem={(itemId) => navigate(itemDetail(itemId))}
            onRemoveItem={(itemId) => removeItem(trade.id, itemId)}
            onInspectSkill={(skillId) => navigate(skillDetail(skillId))}
            onRemoveSkill={(skillId) => removeSkill(trade.id, skillId)}
            onAccept={() => navigate(trading(trade.id))}
            onDecline={() => resetOffer(trade.id, trade.yourHours)}
          />
        )}
      </div>
    </PageShell>
  )
}

/* ---------- Context banners ---------- */

/** TODO #9.1: "the part where it says picking items... remove it" — the banner used to open with
 *  an h2 stating that (and naming the partner); the partner's name has a new, more prominent home
 *  now anyway (the trading-table overlay's own heading, "Trading with XY" — see TradeTableOverlay
 *  below), so there's nothing left worth restating here. What's left is exactly the one thing
 *  that heading doesn't cover: which subject this trade is actually about. */
function TradeContextBanner({ trade }: { trade: Trade }) {
  return (
    <section className="page-card inventory-page__trade-banner" aria-label="Trading context">
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
 *  gets.
 *
 *  Each option span now carries its own `is-active` class straight from `isSkills`, rather than
 *  leaning on a `:first-child`/`:last-child` CSS selector to infer which option is which (TODO #9,
 *  direct feedback: "the highlighting is inconsistent"). That inference was silently broken —
 *  the decorative thumb span above is the button's *actual* first child, so the Items span is
 *  really the second child and `.inventory-page__view-switch-option:first-child` never matched
 *  anything. Only the Skills side's `:last-child` rule ever fired, so Items was muted no matter
 *  which view was active. Styling directly off state removes the positional assumption instead of
 *  patching around it. */
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
      <span
        className={`inventory-page__view-switch-option ${!isSkills ? 'is-active' : ''}`}
        aria-hidden="true"
      >
        Items
      </span>
      <span
        className={`inventory-page__view-switch-option ${isSkills ? 'is-active' : ''}`}
        aria-hidden="true"
      >
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
  /** Present only while picking an item for a new ad (TODO #8) — outside that there is no offer
   *  to add anything to. A trading context has its own TradeItemTile now (right below) instead of
   *  this toggle — see TODO #9.1's split tile. */
  onToggleOffered?: () => void
}

/** Exactly a SquareTile with the item's name overlaid (TODO #9), plus a single "N★" `RatingBadge`
 *  pinned to the corner (direct feedback: "make the star rating visible for the items as well" —
 *  the same Home's-Ads-tile treatment `InventorySkillTile` below already got). The rating is
 *  folded into the tile's own accessible name too, whichever wording is currently active, so a
 *  screen reader isn't shown the badge's number but never told it (`RatingBadge`'s own doc
 *  comment). Outside any picking context the tile opens the Item page; picking for a new ad
 *  toggles the item into and out of that pick instead. */
function ItemTile({ item, isOffered, onOpen, onToggleOffered }: ItemTileProps) {
  const action = onToggleOffered
    ? isOffered
      ? `Remove ${item.name} as this ad's item`
      : `Use ${item.name} for this ad`
    : item.name
  const label = `${action}, rated ${item.rating} out of ${MAX_STARS}`

  return (
    <SquareTile
      label={label}
      onClick={onToggleOffered ?? onOpen}
      overlay={
        <>
          <span className="inventory-page__tile-name">{item.name}</span>
          {isOffered && <span className="inventory-page__tile-offered">Chosen</span>}
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

interface TradeItemTileProps {
  item: InventoryItem
  isOffered: boolean
  isSplit: boolean
  /** Mirrors TODO #11's "when the grid is full of items (6), open inventory is not available
   *  anymore" on Trading's own page — the trading table (this item's ultimate destination) tops
   *  out at 6 real slots there too, so adding a 7th here would just have nowhere to land once you
   *  next looked at either grid. */
  canAddMore: boolean
  onOpenSplit: () => void
  /** The ✓-added half below has nothing left to *do* (Q&A: adding/removing there is a no-op by
   *  design, see its own comment) — closing the split is the only thing left for it to be useful
   *  for, so it gets this instead of an add/remove handler. */
  onCloseSplit: () => void
  onInspect: () => void
  onAdd: () => void
}

/** TODO #9.1: "when clicking on a grid item split it into 2. on top have inspect option that open
 *  the item/skill. on the bottom a + that adds it to the offer." Inventory's own version of
 *  TradingPage's split tile (TODO #11) — same "in-place split" shape, mirrored rather than shared:
 *  this one only ever *adds*, since every item in Inventory's own grid is real stock, not
 *  something that can be "removed" from existence the way an offered item can from Trading's
 *  table. Removing an already-offered item stays the transfer box's own job (its `×` button)
 *  rather than something this tile also does — the bottom half of an already-offered tile shows a
 *  plain "in offer" mark instead of a working control, so tapping it can only ever close the
 *  split, never quietly undo something the transfer box's own list already promises full control
 *  over. */
function TradeItemTile({ item, isOffered, isSplit, canAddMore, onOpenSplit, onCloseSplit, onInspect, onAdd }: TradeItemTileProps) {
  if (!isSplit) {
    const offeredSuffix = isOffered ? ', in your offer' : ''
    return (
      <SquareTile
        label={`${item.name}${offeredSuffix} — tap for options, rated ${item.rating} out of ${MAX_STARS}`}
        onClick={onOpenSplit}
        overlay={
          <>
            <span className="inventory-page__tile-name">{item.name}</span>
            {isOffered && <span className="inventory-page__tile-offered">In offer</span>}
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

  return (
    <div className="inventory-page__split-tile" role="group" aria-label={`${item.name} options`}>
      <button type="button" className="inventory-page__split-inspect" onClick={onInspect}>
        <span aria-hidden="true">{item.icon}</span>
        <span className="inventory-page__tile-name">{item.name}</span>
      </button>
      {isOffered ? (
        <button type="button" className="inventory-page__split-added" onClick={onCloseSplit}>
          <span aria-hidden="true">✓</span> In offer
        </button>
      ) : canAddMore ? (
        <button
          type="button"
          className="inventory-page__split-add"
          aria-label={`Add ${item.name} to your offer`}
          onClick={onAdd}
        >
          <span aria-hidden="true">+</span>
        </button>
      ) : (
        <button type="button" className="inventory-page__split-added" onClick={onCloseSplit}>
          Table full
        </button>
      )}
    </div>
  )
}

interface TradeSkillTileProps {
  skill: Skill
  isOffered: boolean
  isSplit: boolean
  canAddMore: boolean
  onOpenSplit: () => void
  onCloseSplit: () => void
  onInspect: () => void
  onAdd: () => void
}

/** Direct feedback: "skills should have the inspect / add behaviour" — the Skills view was
 *  read-only browsing in a trading context too until this (the file banner comment's own history
 *  of that gap). Otherwise an exact mirror of `TradeItemTile` right above — same split shape, same
 *  "adds only, removing stays the overlay's own job" reasoning, just for a `Skill` instead of an
 *  `InventoryItem`. Kept as its own copy rather than a shared generic component: the two types
 *  don't actually share a common shape beyond `id`/`name`/`icon`/`rating`, and a shared component
 *  would need to invent one. */
function TradeSkillTile({ skill, isOffered, isSplit, canAddMore, onOpenSplit, onCloseSplit, onInspect, onAdd }: TradeSkillTileProps) {
  if (!isSplit) {
    const offeredSuffix = isOffered ? ', in your offer' : ''
    return (
      <SquareTile
        label={`${skill.name}${offeredSuffix} — tap for options, rated ${skill.rating} out of ${MAX_STARS}`}
        onClick={onOpenSplit}
        overlay={
          <>
            <span className="inventory-page__tile-name">{skill.name}</span>
            {isOffered && <span className="inventory-page__tile-offered">In offer</span>}
          </>
        }
      >
        <span className="square-tile__icon" aria-hidden="true">
          {skill.icon}
        </span>
        <RatingBadge value={skill.rating} />
      </SquareTile>
    )
  }

  return (
    <div className="inventory-page__split-tile" role="group" aria-label={`${skill.name} options`}>
      <button type="button" className="inventory-page__split-inspect" onClick={onInspect}>
        <span aria-hidden="true">{skill.icon}</span>
        <span className="inventory-page__tile-name">{skill.name}</span>
      </button>
      {isOffered ? (
        <button type="button" className="inventory-page__split-added" onClick={onCloseSplit}>
          <span aria-hidden="true">✓</span> In offer
        </button>
      ) : canAddMore ? (
        <button
          type="button"
          className="inventory-page__split-add"
          aria-label={`Add ${skill.name} to your offer`}
          onClick={onAdd}
        >
          <span aria-hidden="true">+</span>
        </button>
      ) : (
        <button type="button" className="inventory-page__split-added" onClick={onCloseSplit}>
          Table full
        </button>
      )}
    </div>
  )
}

/* ---------- The trading-table overlay (TODO #9.1) ---------- */

/** Your side of the overlay's own grid, "for now" — same size Trading's own grid uses, since
 *  they're two views onto the exact same 6-slot offer. */
const TABLE_OVERLAY_COLUMNS = 3
const TABLE_OVERLAY_ROWS = 2
const TABLE_OVERLAY_SLOTS = TABLE_OVERLAY_COLUMNS * TABLE_OVERLAY_ROWS

/** Everything the overlay's grid can show — deliberately smaller than TradingPage's own
 *  `TableEntry` union: "don't show the suggestions in it. don't show the to inventory button
 *  either" (TODO #9.1) rules out every kind but these three (`'skill'` joined once direct feedback
 *  gave skills the same trading-table treatment items already had). There's no `'suggested-time'`
 *  kind here the way TradingPage's own union has one — direct feedback: "when its a suggestion it
 *  shouldn't show up on the inventory in trading context" at all, not even as a tappable
 *  placeholder, so an un-offered Time is simply absent from `entries` below (see the caller)
 *  rather than rendered as anything. */
type TableOverlayEntry =
  | { kind: 'time'; hours: number }
  | { kind: 'item'; item: InventoryItem }
  | { kind: 'skill'; skill: Skill }

function tableOverlayEntryKey(entry: TableOverlayEntry): string {
  if (entry.kind === 'item') return entry.item.id
  if (entry.kind === 'skill') return `skill-${entry.skill.id}`
  return entry.kind
}

/** TODO #9.1: "fill up the grid starting from the lower right corner, the last should be the
 *  upper left" together with "the items already in trade should keep their respected positions."
 *  Read literally, "fill from the bottom-right, keep positions" only both hold at once if each
 *  entry's slot depends on *its own* place in `entries` and nothing else — conceptually, entry 0
 *  (Time) is always pinned to the bottom-right slot; entry 1 always takes the next slot to its
 *  left; and so on, regardless of how many more entries show up later. A scheme that instead
 *  shifted *inward* by however many entries there currently are would move entry 0 every time a
 *  new one arrived — exactly what "keep their positions" rules out.
 *
 *  `entries[0]` is `null` whenever Time is merely a suggestion (see the caller) rather than the
 *  list simply skipping it — a `null` still *consumes* the bottom-right slot, rendered as an empty
 *  placeholder, so the first real item still lands one slot to its left exactly where it would if
 *  Time *were* shown there. Without that, adding an item while Time is still a suggestion would
 *  put that item in the bottom-right slot, and it would then have to jump left the moment Time
 *  was actually added — the same "shifted by how many entries exist now" bug this whole scheme
 *  exists to avoid, just triggered by Time instead of an item.
 *
 *  `entries` must already be in stable, real insertion order for any of this to mean anything (see
 *  `offeredItemsInAddOrder` at the call site); slicing to `TABLE_OVERLAY_SLOTS` first is just a
 *  defensive cap — the "can't add more once full" rule upstream (`canAddMoreToTable`) should mean
 *  this never actually trims anything real. */
function tableOverlaySlots(entries: (TableOverlayEntry | null)[]): (TableOverlayEntry | null)[] {
  const slots: (TableOverlayEntry | null)[] = Array.from({ length: TABLE_OVERLAY_SLOTS }, () => null)
  entries.slice(0, TABLE_OVERLAY_SLOTS).forEach((entry, index) => {
    slots[TABLE_OVERLAY_SLOTS - 1 - index] = entry
  })
  return slots
}

interface TradeTableOverlayProps {
  trade: Trade
  /** Insertion order, not catalogue order — see `tableOverlaySlots`'s own comment on why that
   *  distinction is what makes "keep their positions" true at all. */
  offeredItems: InventoryItem[]
  /** Same insertion-order contract as `offeredItems` — see the same comment. Grouped after every
   *  offered item rather than perfectly interleaved with them (tradeDraftContextInstance.ts's own
   *  file comment explains why: items and skills are two separate lists, not one combined one). */
  offeredSkills: Skill[]
  offeredHours: number
  isTimeOffered: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
  onChangeHours: (hours: number) => void
  onRemoveTime: () => void
  onInspectItem: (itemId: string) => void
  onRemoveItem: (itemId: string) => void
  onInspectSkill: (skillId: string) => void
  onRemoveSkill: (skillId: string) => void
  onAccept: () => void
  onDecline: () => void
}

/** TODO #9.1: "for the trading area copy the top of the trading page. 3x2 grid, accept/reject
 *  buttons + the generosity meter... show the already filled in items (including the time on
 *  offer)... put the trading table on the bottom, make it overlay the inventory parts... make it
 *  hide when the user searches or scrolls/flips the page. In hidden form it should say 'choose
 *  what to trade' and add a button to expand it."
 *
 *  Its own heading reads "Trading with XY" — direct feedback: the plain drop-area/list TransferBox
 *  that used to carry that same heading (and did everything else this overlay now does: list what's
 *  offered, flag it as accepted, link back to the trade) is gone from this page entirely, since
 *  this overlay already replaced every job it had.
 *
 *  A wholly separate component from TradingPage's own `TradingTableZone` rather than a shared one
 *  (Q&A for this round) — the two look alike on purpose, but Inventory's version only ever shows
 *  *your* side (there's no partner grid here to speak of), never suggestions or an inventory
 *  opener (there's nothing to open — you're already looking at it), and Accept here can't do more
 *  than navigate to the trade itself: this page never held the trade's `status` (that's
 *  TradingPage's own local state, never shared — see TradeDraftContext.tsx's file comment on what
 *  did and didn't move into shared state this round), so accepting the same way finishes the job
 *  on the page that can actually change it. Decline needs no such compromise — clearing the offer
 *  and restoring the default hours is exactly what TradeDraftContext's own `resetOffer` already
 *  does, and both pages now share that state directly. */
function TradeTableOverlay({
  trade,
  offeredItems,
  offeredSkills,
  offeredHours,
  isTimeOffered,
  isExpanded,
  onToggleExpanded,
  onChangeHours,
  onRemoveTime,
  onInspectItem,
  onRemoveItem,
  onInspectSkill,
  onRemoveSkill,
  onAccept,
  onDecline,
}: TradeTableOverlayProps) {
  const [isAdjustingHours, setIsAdjustingHours] = useState(false)
  const [splitItemId, setSplitItemId] = useState<string | null>(null)
  const [splitSkillId, setSplitSkillId] = useState<string | null>(null)

  if (!isExpanded) {
    return (
      <div className="inventory-page__table-collapsed">
        <span>Choose what to trade</span>
        <button
          type="button"
          className="inventory-page__table-expand"
          aria-label="Expand the trading table"
          onClick={onToggleExpanded}
        >
          <span aria-hidden="true">▴</span>
        </button>
      </div>
    )
  }

  // Time's own conceptual slot is always entries[0] — `null` while it's merely a suggestion (see
  // tableOverlaySlots's own comment for why that still reserves the bottom-right slot rather than
  // letting the first item slide into it). Skills come after every item — see this component's
  // own `offeredSkills` prop comment on why the two kinds are grouped rather than interleaved.
  const entries: (TableOverlayEntry | null)[] = [
    isTimeOffered ? { kind: 'time', hours: offeredHours } : null,
    ...offeredItems.map((item): TableOverlayEntry => ({ kind: 'item', item })),
    ...offeredSkills.map((skill): TableOverlayEntry => ({ kind: 'skill', skill })),
  ]
  const slots = tableOverlaySlots(entries)

  return (
    <section className="inventory-page__table-overlay" aria-label={`Trading with ${trade.partner}`}>
      <div className="inventory-page__table-header">
        <h2 className="inventory-page__table-heading">Trading with {trade.partner}</h2>
        <button
          type="button"
          className="inventory-page__table-collapse"
          aria-label="Collapse the trading table"
          onClick={onToggleExpanded}
        >
          <span aria-hidden="true">▾</span>
        </button>
      </div>

      <ul className="inventory-page__table-grid" aria-label="Your offer on the table">
        {slots.map((entry, index) =>
          entry === null ? (
            <li className="inventory-page__table-cell" key={`empty-${index}`}>
              <span className="inventory-page__table-empty" aria-hidden="true" />
            </li>
          ) : (
            <li className="inventory-page__table-cell" key={tableOverlayEntryKey(entry)}>
              <TableOverlayTileView
                entry={entry}
                isAdjustingHours={isAdjustingHours}
                onOpenTime={() => setIsAdjustingHours((open) => !open)}
                onChangeHours={onChangeHours}
                onRemoveTime={() => {
                  onRemoveTime()
                  setIsAdjustingHours(false)
                }}
                splitItemId={splitItemId}
                onOpenSplitItem={setSplitItemId}
                onInspectItem={onInspectItem}
                onRemoveItem={(itemId) => {
                  onRemoveItem(itemId)
                  setSplitItemId(null)
                }}
                splitSkillId={splitSkillId}
                onOpenSplitSkill={setSplitSkillId}
                onInspectSkill={onInspectSkill}
                onRemoveSkill={(skillId) => {
                  onRemoveSkill(skillId)
                  setSplitSkillId(null)
                }}
              />
            </li>
          ),
        )}
      </ul>

      <div className="inventory-page__table-respond" role="group" aria-label="Respond to this offer">
        <div className="inventory-page__table-actions">
          {canRespondToOffer(trade.status) && (
            <>
              <button
                type="button"
                className="inventory-page__table-accept"
                aria-label="Accept trade"
                onClick={onAccept}
              >
                <span aria-hidden="true">✅</span>
              </button>
              <button
                type="button"
                className="inventory-page__table-decline"
                aria-label="Decline offer"
                onClick={onDecline}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </>
          )}
        </div>

        <GenerosityBar yourHours={isTimeOffered ? offeredHours : 0} partnerHours={trade.partnerHours} />
      </div>
    </section>
  )
}

/** Time as a plain read-out/adjuster, and items as the same inspect/remove split TradingPage's own
 *  grid uses (Q&A for this round: "yes — inspect / − remove", so the overlay is a real second
 *  place to manage the offer, not just a preview). No suggestions, no inventory opener, no
 *  open-profile tile, and (direct feedback) no suggested-Time tile either — see TableOverlayEntry's
 *  own comment for why none of those exist here at all; a suggested Time is simply absent, not
 *  rendered as anything, so this component only ever has to handle a *real* Time entry. */
function TableOverlayTileView({
  entry,
  isAdjustingHours,
  onOpenTime,
  onChangeHours,
  onRemoveTime,
  splitItemId,
  onOpenSplitItem,
  onInspectItem,
  onRemoveItem,
  splitSkillId,
  onOpenSplitSkill,
  onInspectSkill,
  onRemoveSkill,
}: {
  entry: TableOverlayEntry
  isAdjustingHours: boolean
  onOpenTime: () => void
  onChangeHours: (hours: number) => void
  onRemoveTime: () => void
  splitItemId: string | null
  onOpenSplitItem: (itemId: string) => void
  onInspectItem: (itemId: string) => void
  onRemoveItem: (itemId: string) => void
  splitSkillId: string | null
  onOpenSplitSkill: (skillId: string) => void
  onInspectSkill: (skillId: string) => void
  onRemoveSkill: (skillId: string) => void
}) {
  if (entry.kind === 'time') {
    return (
      <div className="inventory-page__table-time-cell">
        <SquareTile
          label={`Your offered hours: ${entry.hours}. Tap to adjust.`}
          onClick={onOpenTime}
          overlay={<span>{entry.hours} h</span>}
        >
          <span className="square-tile__icon" aria-hidden="true">
            ⏱️
          </span>
        </SquareTile>
        {isAdjustingHours && (
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

  if (entry.kind === 'skill') {
    const isSplit = entry.skill.id === splitSkillId
    if (!isSplit) {
      return (
        <SquareTile
          label={`${entry.skill.name} — tap for options`}
          onClick={() => onOpenSplitSkill(entry.skill.id)}
          overlay={<span className="inventory-page__tile-name">{entry.skill.name}</span>}
        >
          <span className="square-tile__icon" aria-hidden="true">
            {entry.skill.icon}
          </span>
        </SquareTile>
      )
    }

    return (
      <div className="inventory-page__split-tile" role="group" aria-label={`${entry.skill.name} options`}>
        <button type="button" className="inventory-page__split-inspect" onClick={() => onInspectSkill(entry.skill.id)}>
          <span aria-hidden="true">{entry.skill.icon}</span>
          <span className="inventory-page__tile-name">{entry.skill.name}</span>
        </button>
        <button
          type="button"
          className="inventory-page__split-remove"
          aria-label={`Remove ${entry.skill.name} from your offer`}
          onClick={() => onRemoveSkill(entry.skill.id)}
        >
          <span aria-hidden="true">−</span>
        </button>
      </div>
    )
  }

  const isSplit = entry.item.id === splitItemId
  if (!isSplit) {
    return (
      <SquareTile
        label={`${entry.item.name} — tap for options`}
        onClick={() => onOpenSplitItem(entry.item.id)}
        overlay={<span className="inventory-page__tile-name">{entry.item.name}</span>}
      >
        <span className="square-tile__icon" aria-hidden="true">
          {entry.item.icon}
        </span>
      </SquareTile>
    )
  }

  return (
    <div className="inventory-page__split-tile" role="group" aria-label={`${entry.item.name} options`}>
      <button type="button" className="inventory-page__split-inspect" onClick={() => onInspectItem(entry.item.id)}>
        <span aria-hidden="true">{entry.item.icon}</span>
        <span className="inventory-page__tile-name">{entry.item.name}</span>
      </button>
      <button
        type="button"
        className="inventory-page__split-remove"
        aria-label={`Remove ${entry.item.name} from your offer`}
        onClick={() => onRemoveItem(entry.item.id)}
      >
        <span aria-hidden="true">−</span>
      </button>
    </div>
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

/** A read-only SquareTile for the Skills view outside a trading context — matches Home's own Ads
 *  tile (GridSection.tsx) rather than SkillsPage's own two-stacked-star-rows tile, per direct
 *  feedback ("skills should be represented similarly as ... the offers are represented on the
 *  homepage"): the icon, the name overlaid at the bottom, and a single "N★" `RatingBadge` pinned to
 *  the corner. Only the self-rating shows — the same one number Home's and Search's badges show
 *  regardless of kind (mockOffers.ts's own comment on `Offer.rating`: "the tile overlay still just
 *  wants one number"); the review rating isn't lost, just not repeated here — it's still on the
 *  Skill page a tap away. In a trading context this is `TradeSkillTile` instead (its own split
 *  inspect/add, direct feedback) — this plain version is what's left for browsing outside one,
 *  where tapping a tile still just opens the Skill page. */
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
