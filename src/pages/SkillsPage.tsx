import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { SquareTile } from '../components/SquareTile'
import { StarRating } from '../components/StarRating'
import { TransferBox } from '../components/TransferBox'
import { MOCK_SKILLS, type Skill } from '../data/mockUser'
import { findTrade } from '../data/mockTrades'
import { ROUTES, adCreateWithSkill, skillDetail, trading } from '../routes'
import { useSettings } from '../settings/useSettings'
import './SkillsPage.css'

/** Wording for the tile's picking button and its accessible names — a trade builds a multi-skill
 *  offer, but a new ad has exactly one subject (TODO #8), so the two contexts say it differently
 *  even though the mechanism (a button under the tile) is the same. */
interface PickCopy {
  label: string
  pickedLabel: string
  ariaPick: (name: string) => string
  ariaPicked: (name: string) => string
}

const TRADE_PICK_COPY: PickCopy = {
  label: 'Add to offer',
  pickedLabel: 'In the offer',
  ariaPick: (name) => `Add ${name} to your offer`,
  ariaPicked: (name) => `${name} is already in your offer`,
}

const AD_PICK_COPY: PickCopy = {
  label: 'Use for this ad',
  pickedLabel: 'Chosen for this ad',
  ariaPick: (name) => `Use ${name} for this ad`,
  ariaPicked: (name) => `${name} is already chosen for this ad`,
}

interface SkillTileProps {
  skill: Skill
  isSelected: boolean
  /** Present in a trading context or while picking a skill for a new ad — outside either there is
   *  nothing to add anything to. */
  pick?: { copy: PickCopy; onSelect: (skillId: string) => void }
}

/** One cell of the grid. The tile itself always opens the Skill page (§7) — even while picking a
 *  skill for an offer, seeing the full rating and description before choosing is useful — so
 *  the picking control is a separate button underneath, the same split InventoryPage uses for its
 *  items. */
function SkillTile({ skill, isSelected, pick }: SkillTileProps) {
  const navigate = useNavigate()

  return (
    <li className="skills-page__cell">
      <span className="skills-page__tile">
        <SquareTile
          label={skill.name}
          onClick={() => navigate(skillDetail(skill.id))}
          overlay={
            <>
              <span className="skills-page__tile-name">{skill.name}</span>
              <span className="skills-page__tile-ratings">
                <StarRating value={skill.rating} subject={`${skill.name}'s rating`} />
                <StarRating value={skill.reviewRating} subject={`${skill.name}'s review rating`} />
              </span>
            </>
          }
        >
          <span className="square-tile__icon" aria-hidden="true">
            {skill.icon}
          </span>
        </SquareTile>
      </span>

      {pick && (
        <button
          type="button"
          className="skills-page__add-to-offer"
          aria-label={isSelected ? pick.copy.ariaPicked(skill.name) : pick.copy.ariaPick(skill.name)}
          disabled={isSelected}
          onClick={() => pick.onSelect(skill.id)}
        >
          {isSelected ? pick.copy.pickedLabel : pick.copy.label}
        </button>
      )}
    </li>
  )
}

/** Makes it obvious what this visit to Skills is *for*, and — for a trade — whose it's with. Ad
 *  picking (TODO #8) has no partner to name, just the fact that it's for a new ad. */
function ContextBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="page-card skills-page__trade-banner" aria-label="Picking context">
      <h2 className="skills-page__banner-title">{title}</h2>
      {subtitle && <p className="skills-page__banner-subject">{subtitle}</p>}
    </section>
  )
}

/** Skills (Appkarte §7, reworked by TODO #6): every skill as a square tile in a grid that follows
 *  the Settings grid-size setting for its column count but is never capped in row count — unlike
 *  Home's fixed grids, there is no "rest of your skills are hidden" here, the page just grows and
 *  scrolls.
 *
 *  Judgement calls:
 *  - Adding a skill used to be an inline form on this page. TODO #6 replaces it with a button
 *    that opens the new Skill page (§7) in create mode — see SkillPage.tsx for where that flow
 *    (and its validation) now lives.
 *  - The transfer box appears at `/skills?trade=<id>` (building a trade's offer) and, since
 *    TODO #8, also at `/skills?forAd=new` (picking the one skill a brand-new ad is for) — both
 *    are the same query-parameter convention InventoryPage already uses. The two contexts share
 *    almost everything: only the wording (PickCopy above) and whether picking appends to the
 *    offer or replaces it (an ad has exactly one subject) differ. */
export function SkillsPage() {
  const navigate = useNavigate()
  const { gridSize } = useSettings()
  const [searchParams] = useSearchParams()
  const trade = findTrade(searchParams.get('trade') ?? undefined)
  const isForNewAd = !trade && searchParams.get('forAd') === 'new'

  const [offeredIds, setOfferedIds] = useState<string[]>([])
  const [isAccepted, setIsAccepted] = useState(false)

  const offeredSkills = MOCK_SKILLS.filter((skill) => offeredIds.includes(skill.id))

  const addToOffer = (skillId: string) => {
    setOfferedIds((current) => (current.includes(skillId) ? current : [...current, skillId]))
    setIsAccepted(false)
  }

  /** An ad has exactly one subject (TODO #8): picking a skill replaces whatever was picked
   *  before, rather than building up a list the way a trade's offer does. */
  const chooseForAd = (skillId: string) => setOfferedIds([skillId])

  const removeFromOffer = (skillId: string) => {
    setOfferedIds((current) => current.filter((id) => id !== skillId))
    setIsAccepted(false)
  }

  const pick = trade
    ? { copy: TRADE_PICK_COPY, onSelect: addToOffer }
    : isForNewAd
      ? { copy: AD_PICK_COPY, onSelect: chooseForAd }
      : undefined

  return (
    <PageShell title="Skills">
      <div className="skills-page">
        {trade && (
          <ContextBanner
            title={`Picking a skill for your trade with ${trade.partner}`}
            subtitle={`${trade.icon} ${trade.subject}`}
          />
        )}
        {isForNewAd && <ContextBanner title="Picking a skill for your new ad" />}

        <section className="page-section">
          <h2 className="page-section__heading">Your skills</h2>
          <ul
            className="skills-page__grid"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            aria-label="Your skills"
          >
            {MOCK_SKILLS.map((skill) => (
              <SkillTile
                key={skill.id}
                skill={skill}
                isSelected={offeredIds.includes(skill.id)}
                pick={pick}
              />
            ))}
            <li className="skills-page__cell">
              <span className="skills-page__tile">
                <SquareTile label="Add a skill" onClick={() => navigate(ROUTES.skillCreate)}>
                  <span className="square-tile__icon" aria-hidden="true">
                    +
                  </span>
                </SquareTile>
              </span>
            </li>
          </ul>
        </section>

        {trade && (
          <TransferBox
            items={offeredSkills.map((skill) => ({ id: skill.id, name: skill.name, icon: skill.icon }))}
            noun="skill"
            pickActionLabel={TRADE_PICK_COPY.label}
            backTo={{ label: 'Back to trading', path: trading(trade.id) }}
            primaryLabel="Accept"
            onPrimary={() => setIsAccepted(true)}
            confirmedMessage={
              isAccepted
                ? `Offer accepted: ${offeredSkills.length} ${offeredSkills.length === 1 ? 'skill' : 'skills'} for the trade with ${trade.partner}.`
                : undefined
            }
            onRemove={removeFromOffer}
          />
        )}

        {isForNewAd && (
          <TransferBox
            items={offeredSkills.map((skill) => ({ id: skill.id, name: skill.name, icon: skill.icon }))}
            noun="skill"
            pickActionLabel={AD_PICK_COPY.label}
            backTo={{ label: 'Back to new ad', path: ROUTES.adCreate }}
            primaryLabel="Use this skill"
            primaryDisabled={offeredSkills.length === 0}
            onPrimary={() => navigate(adCreateWithSkill(offeredSkills[0].id))}
            onRemove={removeFromOffer}
          />
        )}

        <p className="page-note">
          Prototype scope: skills live in the mock data only, so a reload brings back the starting
          list, and nothing added or edited on the Skill page carries back here.
        </p>
      </div>
    </PageShell>
  )
}
