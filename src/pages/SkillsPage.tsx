import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { SquareTile } from '../components/SquareTile'
import { StarRating } from '../components/StarRating'
import { MOCK_SKILLS, type Skill } from '../data/mockUser'
import type { Trade } from '../data/mockTrades'
import { findTrade } from '../data/mockTrades'
import { ROUTES, skillDetail, trading } from '../routes'
import { useSettings } from '../settings/useSettings'
import './SkillsPage.css'

interface SkillTileProps {
  skill: Skill
  isOffered: boolean
  /** Present only in a trading context — outside one there is no offer to add anything to. */
  onAddToOffer?: (skillId: string) => void
}

/** One cell of the grid. The tile itself always opens the Skill page (§7) — even while picking a
 *  skill for an offer, seeing the full rating and description before choosing is useful — so
 *  "Add to offer" is a separate control underneath, the same split InventoryPage uses for its
 *  items. */
function SkillTile({ skill, isOffered, onAddToOffer }: SkillTileProps) {
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

      {onAddToOffer && (
        <button
          type="button"
          className="skills-page__add-to-offer"
          aria-label={isOffered ? `${skill.name} is already in your offer` : `Add ${skill.name} to your offer`}
          disabled={isOffered}
          onClick={() => onAddToOffer(skill.id)}
        >
          {isOffered ? 'In the offer' : 'Add to offer'}
        </button>
      )}
    </li>
  )
}

/** Makes it obvious you are picking a skill *for a trade*, and says whose — the same job
 *  InventoryPage's TradeContextBanner does, worded for a skill offer instead of items. */
function TradeContextBanner({ trade }: { trade: Trade }) {
  return (
    <section className="page-card skills-page__trade-banner" aria-label="Trading context">
      <h2 className="skills-page__banner-title">Picking a skill for your trade with {trade.partner}</h2>
      <p className="skills-page__banner-subject">
        <span aria-hidden="true">{trade.icon}</span> {trade.subject}
      </p>
    </section>
  )
}

interface TransferBoxProps {
  trade: Trade
  offeredSkills: Skill[]
  isAccepted: boolean
  onRemove: (skillId: string) => void
  onAccept: () => void
}

/** The transfer box (TODO #6): shown only in a trading context, exactly like InventoryPage's
 *  OfferZone — a drop area (drag-and-drop is not wired up anywhere in the prototype, so "Add to
 *  offer" on a tile is the real control), and Accept / Back-to-trading. Kept as its own
 *  component here rather than shared with InventoryPage's version: the two pick different kinds
 *  of thing and are likely to diverge, the same call HANDOFF.md already made for OfferTile. */
function TransferBox({ trade, offeredSkills, isAccepted, onRemove, onAccept }: TransferBoxProps) {
  const navigate = useNavigate()

  return (
    <section className="page-section">
      <h2 className="page-section__heading">Your offer</h2>

      <div className="page-card skills-page__offer">
        <div className="skills-page__drop" role="group" aria-label="Your offer for this trade">
          {offeredSkills.length === 0 ? (
            <p className="skills-page__drop-empty">Nothing in the offer yet.</p>
          ) : (
            <ul className="skills-page__drop-items">
              {offeredSkills.map((skill) => (
                <li className="skills-page__drop-item" key={skill.id}>
                  <span aria-hidden="true">{skill.icon}</span>
                  <span className="skills-page__drop-name">{skill.name}</span>
                  <button
                    type="button"
                    className="skills-page__drop-remove"
                    aria-label={`Remove ${skill.name} from your offer`}
                    onClick={() => onRemove(skill.id)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="page-note">
            Drag-and-drop is not wired up in the prototype — use &quot;Add to offer&quot; on a
            skill above.
          </p>
        </div>

        <div className="skills-page__actions">
          <button type="button" className="skills-page__secondary" onClick={() => navigate(trading(trade.id))}>
            Back to trading
          </button>
          <button type="button" className="skills-page__primary" onClick={onAccept}>
            Accept
          </button>
        </div>

        {isAccepted && (
          <p className="skills-page__accepted" role="status">
            Offer accepted: {offeredSkills.length} {offeredSkills.length === 1 ? 'skill' : 'skills'} for
            the trade with {trade.partner}.
          </p>
        )}
      </div>
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
 *  - The transfer box only appears at `/skills?trade=<id>`, the same query-parameter convention
 *    InventoryPage already uses for its own trade-context mode. Nothing links here yet — wiring
 *    an ad's "choose a skill" step to it is TODO #8 — so it is inert but independently testable. */
export function SkillsPage() {
  const navigate = useNavigate()
  const { gridSize } = useSettings()
  const [searchParams] = useSearchParams()
  const trade = findTrade(searchParams.get('trade') ?? undefined)

  const [offeredIds, setOfferedIds] = useState<string[]>([])
  const [isAccepted, setIsAccepted] = useState(false)

  const offeredSkills = MOCK_SKILLS.filter((skill) => offeredIds.includes(skill.id))

  const addToOffer = (skillId: string) => {
    setOfferedIds((current) => (current.includes(skillId) ? current : [...current, skillId]))
    setIsAccepted(false)
  }

  const removeFromOffer = (skillId: string) => {
    setOfferedIds((current) => current.filter((id) => id !== skillId))
    setIsAccepted(false)
  }

  return (
    <PageShell title="Skills">
      <div className="skills-page">
        {trade && <TradeContextBanner trade={trade} />}

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
                isOffered={offeredIds.includes(skill.id)}
                onAddToOffer={trade ? addToOffer : undefined}
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
            trade={trade}
            offeredSkills={offeredSkills}
            isAccepted={isAccepted}
            onRemove={removeFromOffer}
            onAccept={() => setIsAccepted(true)}
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
