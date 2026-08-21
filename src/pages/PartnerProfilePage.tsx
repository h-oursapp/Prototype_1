import { Link, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { MOCK_PARTNER_PROFILE } from '../data/mockUser'
import { findTrade } from '../data/mockTrades'
import { ROUTES, trading } from '../routes'
import './PartnerProfilePage.css'

/** A trading partner's own profile (TODO #11: "a button that opens my trading partner's
 *  profile"), reached from a tile on Trading's own grid — read-only, and deliberately minimal
 *  next to your own ProfilePage: a name, an avatar, and a short line about them, nothing to pick
 *  or browse. There is no page anywhere else in the prototype for viewing somebody else's
 *  profile (CommunityPage's own "tapping a friend" note calls that out directly) — this is the
 *  first one, scoped narrowly to what Trading actually asked for.
 *
 *  Judgement calls worth knowing about, both mirrored from PartnerInventoryPage:
 *  - This prototype only ever models one partner persona (`MOCK_PARTNER_PROFILE`), regardless of
 *    which of the six mock trades' named partners you came from — same simplification
 *    MOCK_PARTNER_INVENTORY/MOCK_PARTNER_SKILLS already make. Only the name and avatar shown
 *    below come from the trade itself (`trade.partner`/`partnerAvatar`); the rest is shared.
 *  - The trade id is required in the URL (`?trade=`), because the partner's display name and the
 *    "Back to trading" link both come from the trade, not the route — same convention as
 *    `partnerInventoryForTrade`. Not added to topLevelRoutes.ts: PageShell's default one-step
 *    back already lands you back on Trading, which is the only place this page is ever opened
 *    from. */
export function PartnerProfilePage() {
  const [searchParams] = useSearchParams()
  const trade = findTrade(searchParams.get('trade') ?? undefined)

  if (!trade) {
    return (
      <PageShell title="Profile">
        <div className="partner-profile-page">
          <div className="page-card">
            <h2 className="partner-profile-page__not-found-title">Trade not found</h2>
            <p className="page-note">
              This page only knows whose profile to show by way of a trade — the link that led
              here is missing one, or points at a trade that no longer exists.
            </p>
            <Link className="partner-profile-page__link" to={ROUTES.trades}>
              Back to trades
            </Link>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title={`${trade.partner}'s profile`}>
      <div className="partner-profile-page">
        <section className="page-section partner-profile-page__identity">
          <span
            className="partner-profile-page__avatar"
            role="img"
            aria-label={`${trade.partner}'s profile picture`}
          >
            <span aria-hidden="true">{trade.partnerAvatar}</span>
          </span>
          <div className="partner-profile-page__personal">
            <h2 className="partner-profile-page__name">{trade.partner}</h2>
            <p className="partner-profile-page__meta">Member since {MOCK_PARTNER_PROFILE.memberSince}</p>
            <p className="partner-profile-page__meta">{MOCK_PARTNER_PROFILE.personalRating}★ personal rating</p>
          </div>
        </section>

        <section className="page-section">
          <h2 className="page-section__heading">About</h2>
          <p className="page-card partner-profile-page__headline">{MOCK_PARTNER_PROFILE.headline}</p>
        </section>

        <Link className="partner-profile-page__link" to={trading(trade.id)}>
          Back to trading
        </Link>
      </div>
    </PageShell>
  )
}
