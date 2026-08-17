import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { PagedGrid } from '../components/PagedGrid'
import { SquareTile } from '../components/SquareTile'
import { TransferBox } from '../components/TransferBox'
import type { InventoryItem } from '../data/mockInventory'
import { MOCK_YOUR_INVENTORY, publicItems } from '../data/mockInventory'
import type { Trade } from '../data/mockTrades'
import { findTrade } from '../data/mockTrades'
import { ROUTES, adCreateWithItem, itemDetail, trading } from '../routes'
import { useSettings } from '../settings/useSettings'
import { useTradeDraft } from '../trading/useTradeDraft'
import './InventoryPage.css'

/** Inventory (Appkarte §6, reworked by TODO #9) — "start from almost the beginning": a
 *  non-scrollable, paged grid of your items, plus the transfer box the card asks for when you
 *  arrive here from a trade.
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
 *  - PagedGrid always sizes its grid to the largest square that fits the space it's given, so on
 *    this screen (where the grid is the only thing there) it naturally uses most of the frame —
 *    and a short last page pads out with visibly empty slots instead of a lopsided partial row. */
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
  const { gridSize } = useSettings()
  const { getOfferedItemIds, toggleItem, removeItem } = useTradeDraft()
  const [items] = useState<InventoryItem[]>(MOCK_YOUR_INVENTORY)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  // The ad picker's pick lives here, not in TradeDraftContext (see the file banner comment) —
  // it's capped at one, so toggling it is always "select this one, or clear it" rather than
  // appending, unlike a trade's item list below.
  const [adPickedIds, setAdPickedIds] = useState<string[]>([])

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
      <div className="inventory-page">
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

        <p className="inventory-page__summary">
          {publicItems(items).length} of {items.length} items are visible to a trading partner.
        </p>

        <div className="inventory-page__grid-area">
          <PagedGrid
            items={items}
            getKey={(item) => item.id}
            columns={gridSize}
            rows={gridSize}
            gridLabel="Your inventory"
            renderTile={(item) => (
              <ItemTile
                item={item}
                isOffered={offeredIds.includes(item.id)}
                onOpen={() => navigate(itemDetail(item.id))}
                onToggleOffered={isPicking ? () => toggleOffered(item.id) : undefined}
                pickingContext={trade ? 'trade' : 'ad'}
              />
            )}
          />
        </div>

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

/** Exactly a SquareTile with the item's name overlaid (TODO #9) — nothing else rendered below it.
 *  Outside any picking context it opens the Item page; inside one it toggles the item into and out
 *  of the offer instead, per the judgement call documented on InventoryPage above. */
function ItemTile({ item, isOffered, onOpen, onToggleOffered, pickingContext = 'trade' }: ItemTileProps) {
  const isAd = pickingContext === 'ad'
  const label = onToggleOffered
    ? isOffered
      ? isAd
        ? `Remove ${item.name} as this ad's item`
        : `Remove ${item.name} from your offer`
      : isAd
        ? `Use ${item.name} for this ad`
        : `Add ${item.name} to your offer`
    : item.name

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
    </SquareTile>
  )
}
