import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilterChip } from '../components/FilterChip'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { RatingBadge } from '../components/RatingBadge'
import { SquareTile } from '../components/SquareTile'
import { MAX_STARS } from '../components/StarRating'
import { MOCK_PROFILE, MOCK_SKILLS, type Skill } from '../data/mockUser'
import { ROUTES, skillDetail } from '../routes'
import { useSettings } from '../settings/useSettings'
import './ProfilePage.css'

/** Same shape as Inventory's own visibility filter (mirrored, not imported — InventoryPage.tsx
 *  doesn't export it, and it's three lines). TODO #5's "all skills ... with filter public /
 *  private" only applies once "All skills" is showing; the one-row "best skills" view has no
 *  filter of its own. */
type VisibilityFilter = 'all' | 'public' | 'private'

const VISIBILITY_FILTER_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

function matchesVisibility(skill: Skill, visibilityFilter: VisibilityFilter): boolean {
  if (visibilityFilter === 'all') return true
  return visibilityFilter === 'public' ? skill.isPublic : !skill.isPublic
}

function visibilityFilterLabel(visibilityFilter: VisibilityFilter): string {
  return VISIBILITY_FILTER_OPTIONS.find((option) => option.value === visibilityFilter)?.label ?? 'All'
}

/** Highest-rated first, capped to exactly one row's worth (TODO #5: "only one row ... follow the
 *  setting for the number of columns") — `count` is the grid-size setting, read where this is
 *  called, not a fixed number the way this used to be capped at 3 regardless of grid density.
 *  sort() is stable, so equal ratings keep their original order rather than shuffling between
 *  renders. */
function bestSkills(skills: Skill[], count: number): Skill[] {
  return [...skills].sort((a, b) => b.rating - a.rating).slice(0, count)
}

/** Profile (Appkarte §7): picture and personal info, intro text, and your skills — either the
 *  best-rated one row's worth, or every skill once "All skills" is tapped.
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
 *  TODO #5's rework, in full:
 *  - The best-skills list became a grid of square tiles, one row deep, columns from the Settings
 *    grid-size setting — the same tile shape SkillsPage/Search/Inventory already use, replacing
 *    the old icon-plus-two-star-rows list row.
 *  - Only the review rating shows now, as a single "N★" `RatingBadge` pinned to the tile's corner
 *    (Search's own convention) — the self-rating isn't shown here anymore, though it's still the
 *    first thing the Skill page itself shows a tap away.
 *  - "All skills can be a button, loads all skills (with filter public/private) puts in" reads as
 *    an inline expand, not a link away to a second page: tapping the button swaps the same grid
 *    from your best row to every skill you have, and only then does a visibility `FilterChip`
 *    appear above it (mirroring Inventory's own All/Public/Private filter) — collapsing back to
 *    the best-row view resets the filter, so it doesn't carry over silently next time it's opened.
 *  - The "Reviews from recent trades" section, and the "Reviewed trades" button that opened
 *    Trades pre-filtered to closed trades, are both gone — TODO #5's explicit "remove reviews".
 *    `reviewedTrades()`'s no-skill-id form (routes.ts) has no caller left after this; the Skill
 *    page's own "all reviewed trades for *this* skill" button (`reviewedTrades(skill.id)`, TODO
 *    #7) is unaffected — that's a different call with a different argument. */
export function ProfilePage() {
  const navigate = useNavigate()
  const { gridSize } = useSettings()
  const [isShowingAll, setIsShowingAll] = useState(false)
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
  const [isVisibilityFilterOpen, setIsVisibilityFilterOpen] = useState(false)

  const visibleSkills = isShowingAll
    ? MOCK_SKILLS.filter((skill) => matchesVisibility(skill, visibilityFilter))
    : bestSkills(MOCK_SKILLS, gridSize)

  /** Collapsing back to the best-row view drops the filter too — it only ever made sense while
   *  "All skills" was showing, so there's nothing to preserve for next time. */
  const toggleShowAll = () => {
    setIsShowingAll((current) => !current)
    setVisibilityFilter('all')
    setIsVisibilityFilterOpen(false)
  }

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
          <h2 className="page-section__heading">{isShowingAll ? 'All skills' : 'Your best skills'}</h2>

          {isShowingAll && (
            <div className="profile-page__filters">
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
          )}

          {visibleSkills.length === 0 ? (
            <p className="page-note">No skills match this filter.</p>
          ) : (
            <ul
              className="profile-page__skills-grid"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
              aria-label={isShowingAll ? 'All skills' : 'Your best skills'}
            >
              {visibleSkills.map((skill) => (
                <li key={skill.id} className="profile-page__skill-cell">
                  <span className="profile-page__skill-tile">
                    <SquareTile
                      label={`${skill.name}, rated ${skill.reviewRating} out of ${MAX_STARS}`}
                      onClick={() => navigate(skillDetail(skill.id))}
                      overlay={<span className="profile-page__skill-name">{skill.name}</span>}
                    >
                      <span className="square-tile__icon" aria-hidden="true">
                        {skill.icon}
                      </span>
                      <RatingBadge value={skill.reviewRating} />
                    </SquareTile>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <button type="button" className="profile-page__link" onClick={toggleShowAll}>
            {isShowingAll ? 'Show best skills only' : 'All skills'}
          </button>
        </section>
      </div>
    </PageShell>
  )
}
