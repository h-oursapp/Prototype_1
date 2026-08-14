import { Link, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { PagedGrid } from '../components/PagedGrid'
import { SquareTile } from '../components/SquareTile'
import { MOCK_PARTNER_INVENTORY, publicItems } from '../data/mockInventory'
import { findTrade } from '../data/mockTrades'
import { ROUTES, trading } from '../routes'
import { useSettings } from '../settings/useSettings'
import './PartnerInventoryPage.css'

/** A trading partner's inventory (§6), reached from Trading's "Open her inventory" button —
 *  read-only, and filtered down to public items only, the same rule that already governed the
 *  small preview grid and expandable detail list this page replaces on TradingPage itself.
 *
 *  Judgement calls worth knowing about:
 *  - This prototype only ever models one partner inventory (`MOCK_PARTNER_INVENTORY`), regardless
 *    of which trade you came from — same simplification TradingPage's own partner-side grid
 *    already made. The trade id is still required in the URL (`?trade=`), because the partner's
 *    display name and the "Back to trading" link both come from the trade, not from the route.
 *  - There is nothing to pick here: unlike your own Inventory page, tiles have no onClick at all.
 *    What the partner puts on the table isn't modelled in this prototype (TradingTableZone's own
 *    comment already says so) — browsing her items is for looking, not offering. */
export function PartnerInventoryPage() {
  const [searchParams] = useSearchParams()
  const trade = findTrade(searchParams.get('trade') ?? undefined)
  const { gridSize } = useSettings()

  if (!trade) {
    return (
      <PageShell title="Inventory">
        <div className="partner-inventory-page">
          <div className="page-card">
            <h2 className="partner-inventory-page__not-found-title">Trade not found</h2>
            <p className="page-note">
              This page only knows whose inventory to show by way of a trade — the link that led
              here is missing one, or points at a trade that no longer exists.
            </p>
            <Link className="partner-inventory-page__link" to={ROUTES.trades}>
              Back to trades
            </Link>
          </div>
        </div>
      </PageShell>
    )
  }

  const items = publicItems(MOCK_PARTNER_INVENTORY)

  return (
    <PageShell title={`${trade.partner}'s inventory`}>
      <div className="partner-inventory-page">
        <p className="partner-inventory-page__summary">
          {items.length} public item{items.length === 1 ? '' : 's'} — anything {trade.partner}{' '}
          keeps private never reaches your side of a trade.
        </p>

        <div className="partner-inventory-page__grid-area">
          <PagedGrid
            items={items}
            getKey={(item) => item.id}
            columns={gridSize}
            rows={gridSize}
            gridLabel={`${trade.partner}'s inventory`}
            renderTile={(item) => (
              <SquareTile
                label={item.name}
                overlay={<span className="partner-inventory-page__tile-name">{item.name}</span>}
              >
                <span className="square-tile__icon" aria-hidden="true">
                  {item.icon}
                </span>
              </SquareTile>
            )}
          />
        </div>

        <Link className="partner-inventory-page__link" to={trading(trade.id)}>
          Back to trading
        </Link>
      </div>
    </PageShell>
  )
}
