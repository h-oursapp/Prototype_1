import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { SquareTile } from '../components/SquareTile'
import { MOCK_PROFILE, MOCK_REVIEWS, MOCK_SKILLS, type Skill } from '../data/mockUser'
import { ROUTES, reviewedTrades, skillDetail } from '../routes'
import './ProfilePage.css'
import { StarRating } from '../components/StarRating'

/** How many of your skills count as "your best" on the profile. §7 says "your best skills" without
 *  a number; three fits the screen without scrolling past the reviews. */
const BEST_SKILL_COUNT = 3


/** Highest-rated first. sort() is stable, so equal ratings keep their original order rather than
 *  shuffling between renders. */
function bestSkills(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => b.rating - a.rating).slice(0, BEST_SKILL_COUNT)
}

/** Profile (Appkarte §7): picture and personal info, intro text, ratings for your best skills, a
 *  way through to the Skills page, and the reviews recent trades left you.
 *
 *  The Settings button goes into PageShell's headerAction, which is what that prop exists for. It
 *  is labelled "Open settings" rather than "Settings" only so it doesn't collide with the nav
 *  bar's own Settings button — two controls on one screen answering to the same name is a
 *  problem for voice control and for tests alike.
 *
 *  The intro is rendered as plain text. §7 has this [OFFEN]: Nessi wants an HTML field, Márk
 *  wants plain text. Plain text is the safe placeholder — it is the subset both options agree on,
 *  so switching to rich text later doesn't invalidate anything shown here.
 *
 *  TODO #5: each best skill now shows both ratings (self and review) and opens the Skill page
 *  (§7) on click, and a "Reviewed trades" button after the reviews list opens Trades pre-filtered
 *  to already-reviewed (closed) trades — both via routes.ts builders, so neither page has to know
 *  the other's query-string shape. */
export function ProfilePage() {
  const navigate = useNavigate()

  return (
    <PageShell
      title="Profile"
      headerAction={
        <button
          type="button"
          className="page-shell__action page-shell__action--icon"
          onClick={() => navigate(ROUTES.settings)}
          aria-label="Open settings"
        >
          <span aria-hidden="true">⚙️</span>
        </button>
      }
    >
      <div className="profile-page">
        <section className="page-section profile-page__identity">
          <span className="profile-page__avatar" role="img" aria-label={`${MOCK_PROFILE.name}'s profile picture`}>
            <span aria-hidden="true">{MOCK_PROFILE.avatar}</span>
          </span>
          <div className="profile-page__personal">
            <h2 className="profile-page__name">{MOCK_PROFILE.name}</h2>
            <p className="profile-page__meta">{MOCK_PROFILE.location}</p>
            <p className="profile-page__meta">Member since {MOCK_PROFILE.memberSince}</p>
            <p className="profile-page__meta">
              {MOCK_PROFILE.isPublic ? 'Public profile' : 'Private profile'}
            </p>
          </div>
        </section>

        <section className="page-section">
          <h2 className="page-section__heading">Intro</h2>
          <p className="page-card profile-page__intro">{MOCK_PROFILE.intro}</p>
          <p className="page-note">
            Open point (§7): the intro field is unresolved — Nessi wants an HTML field, Márk plain
            text. Shown as plain text until that is decided.
          </p>
        </section>

        <section className="page-section">
          <h2 className="page-section__heading">Your best skills</h2>
          <ul className="profile-page__skills" aria-label="Your best skills">
            {bestSkills(MOCK_SKILLS).map((skill) => (
              <li key={skill.id} className="page-card profile-page__skill">
                <button
                  type="button"
                  className="profile-page__skill-button"
                  onClick={() => navigate(skillDetail(skill.id))}
                  aria-label={`Open ${skill.name}`}
                >
                  <span className="profile-page__skill-icon">
                    <SquareTile label={skill.name}>
                      <span className="square-tile__icon" aria-hidden="true">
                        {skill.icon}
                      </span>
                    </SquareTile>
                  </span>
                  <span className="profile-page__skill-name">{skill.name}</span>
                  {/* Both ratings, always shown together (TODO #5-#7): the self-rating and what
                      reviews of this skill average to, kept as two distinct StarRatings. */}
                  <span className="profile-page__skill-ratings">
                    <StarRating value={skill.rating} subject={`${skill.name}'s rating`} />
                    <StarRating value={skill.reviewRating} subject={`${skill.name}'s review rating`} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="profile-page__link" onClick={() => navigate(ROUTES.skills)}>
            All skills
          </button>
        </section>

        <section className="page-section">
          <h2 className="page-section__heading">Reviews from recent trades</h2>
          <ul className="profile-page__reviews" aria-label="Reviews from recent trades">
            {MOCK_REVIEWS.map((review) => (
              <li key={review.id} className="page-card profile-page__review">
                <p className="profile-page__review-head">
                  <span aria-hidden="true">{review.avatar}</span>
                  <span className="profile-page__review-author">{review.author}</span>
                  <span className="profile-page__review-date">{review.date}</span>
                </p>
                {/* §8 keeps the skill rating and the personal rating separate, so the profile
                    shows them separately too rather than averaging them into one number. */}
                {review.skill !== undefined && review.skillRating !== undefined && (
                  <p className="profile-page__review-rating">
                    <span>{review.skill}</span>
                    <StarRating value={review.skillRating} subject={`${review.skill} from ${review.author}`} />
                  </p>
                )}
                <p className="profile-page__review-rating">
                  <span>Personal rating</span>
                  <StarRating value={review.personalRating} subject={`Personal rating from ${review.author}`} />
                </p>
                <p className="profile-page__review-comment">{review.comment}</p>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="profile-page__link"
            onClick={() => navigate(reviewedTrades())}
          >
            Reviewed trades
          </button>
        </section>
      </div>
    </PageShell>
  )
}
