import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { StarRatingInput } from '../components/StarRatingInput'
import type { Trade } from '../data/mockTrades'
import { TRADE_STATUS_LABEL, findTrade } from '../data/mockTrades'
import { ROUTES } from '../routes'
import './FinalReviewPage.css'

interface TradeSummaryProps {
  trade: Trade
}

function TradeSummary({ trade }: TradeSummaryProps) {
  return (
    <div className="page-card final-review-page__summary">
      <span className="final-review-page__summary-icon" aria-hidden="true">
        {trade.icon}
      </span>
      <div>
        <h3 className="final-review-page__summary-subject">{trade.subject}</h3>
        <p className="final-review-page__summary-meta">
          <span aria-hidden="true">{trade.partnerAvatar} </span>
          {trade.partner} · {trade.yourHours} h · {TRADE_STATUS_LABEL[trade.status]}
        </p>
      </div>
    </div>
  )
}

interface FinalReviewFormProps {
  trade: Trade
}

/** The review itself, split off from the page so the page can bail out to a "trade not found"
 *  state without calling hooks conditionally. */
function FinalReviewForm({ trade }: FinalReviewFormProps) {
  const navigate = useNavigate()
  const [skillRating, setSkillRating] = useState(0)
  const [personalRating, setPersonalRating] = useState(0)
  const [isInviteSent, setIsInviteSent] = useState(false)
  const [isClosed, setIsClosed] = useState(false)

  if (isClosed) {
    return (
      <section className="page-section">
        <h2 className="page-section__heading">Trade closed</h2>
        <div className="page-card">
          <p>
            The trade with {trade.partner} is closed. Skill rating {skillRating} of 5, personal
            rating {personalRating} of 5.
            {isInviteSent && ' A friend request or community invite was noted.'}
          </p>
          <p className="page-note">
            Local only — nothing is saved, so a reload brings this trade back as{' '}
            {TRADE_STATUS_LABEL[trade.status]}.
          </p>
        </div>
        <button
          type="button"
          className="final-review-page__secondary"
          onClick={() => navigate(ROUTES.trades)}
        >
          Back to Trades
        </button>
      </section>
    )
  }

  return (
    <>
      <section className="page-section">
        <h2 className="page-section__heading">Trade</h2>
        <TradeSummary trade={trade} />
        {trade.status === 'closed' && (
          <p className="page-note">
            This trade is already closed. The Appkarte does not say whether a closed trade can be
            reviewed again, so the form is left usable rather than blocked on a guess.
          </p>
        )}
      </section>

      <section className="page-section">
        <h2 className="page-section__heading">Skill rating</h2>
        <div className="page-card">
          <p className="final-review-page__skill">
            <span aria-hidden="true">{trade.icon} </span>
            {trade.subject}
          </p>
          <StarRatingInput
            label="Skill rating"
            name="skill-rating"
            value={skillRating}
            onChange={setSkillRating}
          />
          <p className="page-note">
            §8 rates "the skill(s)" used in a trade, but a trade in the mock data only carries one
            free-text subject and no link to a skill, so the subject stands in for it. Trades that
            used several skills cannot be represented until the data says which skills a trade used.
          </p>
        </div>
      </section>

      {/* §8 keeps the personal rating separate from the skill rating — a separate section and a
          separate control, so the two can never be read as one score. */}
      <section className="page-section">
        <h2 className="page-section__heading">Personal rating</h2>
        <div className="page-card">
          <p className="final-review-page__hint">
            How the trade went as a person-to-person exchange: communication, punctuality,
            reliability. Kept separate from the skill rating above.
          </p>
          <StarRatingInput
            label="Personal rating"
            name="personal-rating"
            value={personalRating}
            onChange={setPersonalRating}
          />
          <p className="page-note">
            The card lists communication and punctuality as examples of one general rating. Whether
            it later splits into a score per aspect is not decided, so it stays a single rating.
          </p>
        </div>
      </section>

      <section className="page-section">
        <h2 className="page-section__heading">Stay in touch</h2>
        <div className="page-card">
          <button
            type="button"
            className="final-review-page__secondary"
            onClick={() => setIsInviteSent(true)}
            disabled={isInviteSent}
          >
            {isInviteSent
              ? `Invite noted for ${trade.partner}`
              : `Send ${trade.partner} a friend request or community invite`}
          </button>
          <p className="page-note">
            §8 describes one button for both; whether a friend request and a community invite are
            really the same action is not stated, so it is left as one. Community (§9) is out of
            scope for the prototype — pressing this sends nothing.
          </p>
        </div>
      </section>

      <button type="button" className="final-review-page__submit" onClick={() => setIsClosed(true)}>
        Close trade
      </button>
      <p className="page-note">
        Closing is local to this session: the trade is not written anywhere and comes back as{' '}
        {TRADE_STATUS_LABEL[trade.status]} on reload.
      </p>
    </>
  )
}

/** Appkarte §8 — Final Review: the page that officially closes a trade. It holds a 0–5★ rating
 *  for the skill used in the trade, a separate general personal rating, and a button inviting the
 *  other party into the Community (§9).
 *
 *  Reached from the Trades page (agreed trades only) or straight from a URL, so an unknown trade
 *  id has to be a normal state of this page rather than a crash. */
export function FinalReviewPage() {
  const { tradeId } = useParams()
  const navigate = useNavigate()
  const trade = findTrade(tradeId)

  return (
    <PageShell title="Final Review">
      <div className="final-review-page">
        {trade ? (
          <FinalReviewForm trade={trade} />
        ) : (
          <section className="page-section">
            <h2 className="page-section__heading">Trade not found</h2>
            <div className="page-card">
              <p>There is no trade with the id "{tradeId}". It may have been removed.</p>
            </div>
            <button
              type="button"
              className="final-review-page__secondary"
              onClick={() => navigate(ROUTES.trades)}
            >
              Back to Trades
            </button>
          </section>
        )}
      </div>
    </PageShell>
  )
}
