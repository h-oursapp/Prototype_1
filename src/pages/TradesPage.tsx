import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { StarRating } from '../components/StarRating'
import type { Trade, TradeStatus } from '../data/mockTrades'
import { MOCK_TRADES, TRADE_STATUS_LABEL, TRADE_STATUS_ORDER } from '../data/mockTrades'
import { findSkill, reviewsForSkill } from '../data/mockUser'
import { ROUTES, finalReview, trading } from '../routes'
import './TradesPage.css'

type StatusFilterValue = 'all' | TradeStatus

/** The status filter's options, built off TRADE_STATUS_ORDER/TRADE_STATUS_LABEL rather than
 *  hand-typed a second time, so the filter can never drift out of sync with the labels shown
 *  elsewhere on a trade's card. */
const STATUS_FILTER_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  ...TRADE_STATUS_ORDER.map((status) => ({ value: status, label: TRADE_STATUS_LABEL[status] })),
]

function isStatusFilterValue(value: string | null): value is StatusFilterValue {
  return value === 'all' || (TRADE_STATUS_ORDER as string[]).includes(value ?? '')
}

/** 'closed' is what a trade becomes once Final Review closes it — Profile's and the Skill page's
 *  "reviewed trades" buttons (TODO #5/#7) both reuse that instead of inventing a separate
 *  "reviewed" flag. Kept as its own check, distinct from the general status filter below: this
 *  one specific value is also what triggers the "Showing: reviewed trades" banner. */
function isReviewedStatus(value: string | null): value is 'closed' {
  return value === 'closed'
}

/** TODO #12 replaces the previous "primarily by status" order with a plain most-recent-first
 *  sort. HANDOFF.md §13 already flagged that the old order's secondary key (status) was standing
 *  in for a missing real date — `lastInteractionAt` (added this session) is that date. */
function compareTradesByDate(a: Trade, b: Trade): number {
  return new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime()
}

/** TODO #12's search bar: a plain case-insensitive substring match against the two things a card
 *  shows about who/what a trade is — its subject and its partner's name. */
function matchesSearch(trade: Trade, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q === '') return true
  return trade.subject.toLowerCase().includes(q) || trade.partner.toLowerCase().includes(q)
}

/** Appkarte §8: agreed trades get a button straight to Final Review. Deliberately not the other
 *  two statuses — an open trade has not been agreed yet, so there is nothing to close, and a
 *  closed trade has already been through its review. Also TODO #12's "highlight trades waiting
 *  for final review" — the same condition drives both. */
function needsFinalReview(trade: Trade): boolean {
  return trade.status === 'agreed'
}

/** TODO #12: a closed, skill-linked trade's card shows that skill's ratings and how many reviews
 *  back them up. Silently renders nothing for an item trade or a trade with no skill link — most
 *  trades still carry none (see mockTrades.ts). */
function ClosedTradeSkillSummary({ skillId }: { skillId: string }) {
  const skill = findSkill(skillId)
  if (!skill) return null

  const reviewCount = reviewsForSkill(skillId).length

  return (
    <p className="trades-page__skill-summary">
      <StarRating value={skill.rating} subject={`${skill.name}'s rating`} />
      <StarRating value={skill.reviewRating} subject={`${skill.name}'s review rating`} />
      <span>
        {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
      </span>
    </p>
  )
}

interface TradeCardProps {
  trade: Trade
  isChatLogDeleted: boolean
  hasUnread: boolean
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
  hasUnread,
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
        <span className="trades-page__subject">
          {trade.subject}
          {/* TODO #12: a new-message icon on cards with an unread message. */}
          {hasUnread && (
            <span className="trades-page__unread" role="img" aria-label="Unread message">
              🔴
            </span>
          )}
        </span>
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
        {trade.status === 'closed' && trade.skillId && <ClosedTradeSkillSummary skillId={trade.skillId} />}
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

interface FilterBannerProps {
  /** Resolved skill name, when the filter is narrowed to one — null means "reviewed trades,
   *  any skill". */
  skillName: string | null
}

/** Shown only when the page was reached via a filtered link (Profile's "Reviewed trades", or the
 *  Skill page's "All reviewed trades"), so the mode is obvious the same way InventoryPage's own
 *  TradeContextBanner makes its trading mode obvious. */
function FilterBanner({ skillName }: FilterBannerProps) {
  return (
    <section className="page-card trades-page__filter-banner">
      <p className="trades-page__filter-text">
        Showing: reviewed trades{skillName !== null && <> for {skillName}</>}
      </p>
      <Link className="trades-page__filter-clear" to={ROUTES.trades}>
        Clear filter
      </Link>
    </section>
  )
}

/** Appkarte §8 — Trades, reworked by TODO #12: search and a status filter (default: open trades)
 *  replace the old "show everything, sorted by status" view, and cards sort by real date instead.
 *
 *  Judgement calls:
 *  - TODO #12 doesn't say what "default filter open trades" means for a link that already asks
 *    for something else — the answer here is that `?status=<value>` (already used by TODO #5/#7's
 *    "reviewed trades" links) seeds the status filter's *starting* value, and "open" is only the
 *    fallback when the URL carries no opinion. The filter itself is a normal, freely-changeable
 *    control from then on — it doesn't lock to whatever the link asked for.
 *  - The card's first status label is still [OFFEN] (the note reads like "unridden", suspected
 *    typo) — `mockTrades.ts` uses 'open' as a stand-in, said out loud rather than passed off as
 *    the agreed term.
 *  - Sorting is a straightforward most-recent-first now that `lastInteractionAt` (this session)
 *    gives trades a real date — Appkarte §8's original "primarily by status" is superseded by
 *    TODO #12's plain "order by date", the same kind of override HANDOFF.md's collision table
 *    already tracks for other reworked pages.
 *  - The grid still sizes itself off the available width rather than the grid-size setting from
 *    §9 — unchanged reasoning from before: a trade card carries more than a picture and doesn't
 *    stay readable at a fixed density.
 *  - Chat logs are local (§8), so deleting one is local state only and lasts until reload. Same
 *    for which trades are "read" — TODO #12's unread icon clears the same way, in this page's own
 *    memory, not written back to the mock data. */
export function TradesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [deletedChatLogIds, setDeletedChatLogIds] = useState<string[]>([])
  const [readTradeIds, setReadTradeIds] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const statusParam = searchParams.get('status')
  const skillParam = searchParams.get('skill')
  const isFilteredLinkView = isReviewedStatus(statusParam)
  const filteredSkillName = skillParam !== null ? (findSkill(skillParam)?.name ?? skillParam) : null

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(() =>
    isStatusFilterValue(statusParam) ? statusParam : 'open',
  )

  const visibleTrades = [...MOCK_TRADES]
    .filter((trade) => statusFilter === 'all' || trade.status === statusFilter)
    .filter((trade) => skillParam === null || trade.skillId === skillParam)
    .filter((trade) => matchesSearch(trade, search))
    .sort(compareTradesByDate)

  const deleteChatLog = (tradeId: string) => {
    setDeletedChatLogIds((deleted) => [...deleted, tradeId])
  }

  const openTrading = (trade: Trade) => {
    setReadTradeIds((read) => (read.includes(trade.id) ? read : [...read, trade.id]))
    navigate(trading(trade.id))
  }

  return (
    <PageShell title="Trades">
      <div className="trades-page">
        {isFilteredLinkView && <FilterBanner skillName={filteredSkillName} />}

        <section className="page-section trades-page__controls">
          <label className="trades-page__search-label" htmlFor="trades-search">
            Search trades
          </label>
          <input
            id="trades-search"
            className="trades-page__search"
            type="search"
            placeholder="Search by subject or partner"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <OptionGroup
            legend="Status"
            options={STATUS_FILTER_OPTIONS}
            selected={statusFilter}
            onSelect={setStatusFilter}
          />
        </section>

        <section className="page-section">
          <h2 className="page-section__heading">
            {isFilteredLinkView ? 'Reviewed trades' : 'All trades'}
          </h2>

          {visibleTrades.length === 0 ? (
            <p className="page-note">No trades match this filter yet.</p>
          ) : (
            <ul className="trades-page__grid">
              {visibleTrades.map((trade) => (
                <li key={trade.id}>
                  <TradeCard
                    trade={trade}
                    isChatLogDeleted={deletedChatLogIds.includes(trade.id)}
                    hasUnread={(trade.hasUnreadMessage ?? false) && !readTradeIds.includes(trade.id)}
                    onOpenTrading={() => openTrading(trade)}
                    onOpenFinalReview={() => navigate(finalReview(trade.id))}
                    onDeleteChatLog={() => deleteChatLog(trade.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="page-note">
          Status names are not settled: the Appkarte's first status is [OFFEN] — the note reads
          like "unridden", suspected typo — so "Open" stands in until the real term is confirmed.
        </p>
        <p className="page-note">
          Nothing here persists — deleting a chat log, or opening a trade with an unread message,
          only changes this page for this visit.
        </p>
      </div>
    </PageShell>
  )
}
