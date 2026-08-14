import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import type { Trade } from '../data/mockTrades'
import { MOCK_TRADES, TRADE_STATUS_LABEL, TRADE_STATUS_ORDER } from '../data/mockTrades'
import { finalReview, trading } from '../routes'
import './TradesPage.css'

/** Appkarte §8 sorts trades "primarily by status ... secondarily by last interaction".
 *
 *  Only the status half is implemented as a comparison: `lastInteraction` in the mock data is a
 *  human string ("10 minutes ago", "Yesterday", "2 weeks ago"), which cannot be ordered without
 *  parsing prose. MOCK_TRADES is already listed most-recent-first inside each status group, and
 *  Array.prototype.sort is stable, so sorting by status alone preserves that recency order as the
 *  secondary key. Real timestamps on Trade are needed before "last interaction" can actually be
 *  compared. */
function compareTradesByStatus(a: Trade, b: Trade): number {
  return TRADE_STATUS_ORDER.indexOf(a.status) - TRADE_STATUS_ORDER.indexOf(b.status)
}

/** Appkarte §8: agreed trades get a button straight to Final Review. Deliberately not the other
 *  two statuses — an open trade has not been agreed yet, so there is nothing to close, and a
 *  closed trade has already been through its review. */
function needsFinalReview(trade: Trade): boolean {
  return trade.status === 'agreed'
}

interface TradeCardProps {
  trade: Trade
  isChatLogDeleted: boolean
  onOpenTrading: () => void
  onOpenFinalReview: () => void
  onDeleteChatLog: () => void
}

/** One trade in the grid. The card body is a single button — tapping a trade opens the Trading
 *  page (§8) — and the extra controls sit outside it, because a button inside a button is invalid
 *  HTML and unreachable by keyboard. */
function TradeCard({
  trade,
  isChatLogDeleted,
  onOpenTrading,
  onOpenFinalReview,
  onDeleteChatLog,
}: TradeCardProps) {
  return (
    <article className="page-card trades-page__card">
      <button
        type="button"
        className="trades-page__open"
        onClick={onOpenTrading}
        aria-label={`Open trade: ${trade.subject} with ${trade.partner}`}
      >
        <span className="trades-page__icon" aria-hidden="true">
          {trade.icon}
        </span>
        <span className="trades-page__subject">{trade.subject}</span>
        <span className="trades-page__partner">
          <span aria-hidden="true">{trade.partnerAvatar} </span>
          {trade.partner}
        </span>
        <span className={`trades-page__status ${needsFinalReview(trade) ? 'is-active' : ''}`}>
          {TRADE_STATUS_LABEL[trade.status]}
        </span>
        <span className="trades-page__meta">
          {trade.yourHours} h on the table · {trade.lastInteraction}
        </span>
      </button>

      <p className="trades-page__chat">
        {isChatLogDeleted
          ? 'Chat log deleted on this device.'
          : `${trade.messages.length} chat messages stored on this device.`}
      </p>

      <div className="trades-page__actions">
        {needsFinalReview(trade) && (
          <button type="button" className="trades-page__review" onClick={onOpenFinalReview}>
            Final Review
          </button>
        )}
        {!isChatLogDeleted && (
          <button
            type="button"
            className="trades-page__delete"
            onClick={onDeleteChatLog}
            aria-label={`Delete chat log with ${trade.partner}`}
          >
            Delete chat log
          </button>
        )}
      </div>
    </article>
  )
}

/** Appkarte §8 — Trades: every trade, open and closed, in a grid-based layout, sorted by status
 *  and then by last interaction.
 *
 *  Judgement calls:
 *  - The card's first status label is [OFFEN] (the note reads like "unridden", suspected typo).
 *    `mockTrades.ts` uses 'open' as a stand-in and the page says so out loud rather than passing
 *    the placeholder off as the agreed term.
 *  - The grid sizes itself off the available width instead of following the grid-size setting
 *    from §9. That setting tunes the picture-only offer grids (§3/§4); a trade card carries a
 *    subject, a partner, a status and two controls, and does not stay readable at 4 per row.
 *  - GridSection/SquareTile are not reused here for the same reason: both are built for
 *    picture-only tiles locked into a square frame, and neither can hold the per-card controls.
 *  - Chat logs are local (§8), so deleting one is local state only and lasts until reload. */
export function TradesPage() {
  const navigate = useNavigate()
  const [deletedChatLogIds, setDeletedChatLogIds] = useState<string[]>([])

  const sortedTrades = [...MOCK_TRADES].sort(compareTradesByStatus)

  const deleteChatLog = (tradeId: string) => {
    setDeletedChatLogIds((deleted) => [...deleted, tradeId])
  }

  return (
    <PageShell title="Trades">
      <div className="trades-page">
        <section className="page-section">
          <h2 className="page-section__heading">All trades</h2>

          <ul className="trades-page__grid">
            {sortedTrades.map((trade) => (
              <li key={trade.id}>
                <TradeCard
                  trade={trade}
                  isChatLogDeleted={deletedChatLogIds.includes(trade.id)}
                  onOpenTrading={() => navigate(trading(trade.id))}
                  onOpenFinalReview={() => navigate(finalReview(trade.id))}
                  onDeleteChatLog={() => deleteChatLog(trade.id)}
                />
              </li>
            ))}
          </ul>
        </section>

        <p className="page-note">
          Status names are not settled: the Appkarte's first status is [OFFEN] — the note reads
          like "unridden", suspected typo — so "Open" stands in until the real term is confirmed.
        </p>
        <p className="page-note">
          Sorting is by status only for now. "Last interaction" is stored as text ("Yesterday"),
          so trades keep their listed order within a status until the data carries real timestamps.
        </p>
        <p className="page-note">
          Nothing here persists — deleting a chat log clears it for this session only.
        </p>
      </div>
    </PageShell>
  )
}
