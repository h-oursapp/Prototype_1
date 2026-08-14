import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { SquareTile } from '../components/SquareTile'
import { StarRating } from '../components/StarRating'
import {
  CUSTOM_SKILL_CAP,
  MOCK_REVIEWS,
  MOCK_SKILLS,
  SKILL_CATALOG,
  findSkill,
  type Review,
  type Skill,
} from '../data/mockUser'
import { ROUTES, reviewedTrades } from '../routes'
import './SkillPage.css'

/** Appkarte §7: from this self-rating upwards, a skill only counts with proof. Relocated here
 *  from SkillsPage — TODO #6 moves the whole "add a skill" flow onto this page, behind the new
 *  "+ Add skill" tile, so the rule and its tests move with it rather than being reinvented. */
const PROOF_REQUIRED_FROM = 4

/** Where a new skill's self-rating starts. Deliberately below PROOF_REQUIRED_FROM, so nobody is
 *  asked for paperwork before they have chosen anything. */
const DEFAULT_RATING = 3

const RATING_OPTIONS = [1, 2, 3, 4, 5].map((rating) => ({ value: rating, label: `${rating}★` }))

/** §7: custom skills pick their icon from a predefined set rather than uploading one. The names
 *  are what assistive tech reads out — an emoji on its own has no useful accessible name. */
const CUSTOM_SKILL_ICONS = [
  { icon: '🛠️', name: 'Tools' },
  { icon: '🎯', name: 'Target' },
  { icon: '🧵', name: 'Thread' },
  { icon: '🎧', name: 'Headphones' },
  { icon: '🚗', name: 'Car' },
  { icon: '🧪', name: 'Flask' },
  { icon: '📚', name: 'Books' },
  { icon: '🌿', name: 'Plant' },
]

type CatalogEntry = (typeof SKILL_CATALOG)[number]

/** The skill being created or edited. Catalogue and custom skills share this shape — only
 *  `isCustom` differs, and it is what decides whether the name and icon are editable. */
interface SkillDraft {
  isCustom: boolean
  name: string
  icon: string
  description: string
  rating: number
  proof: string
}

function catalogDraft(entry: CatalogEntry): SkillDraft {
  return { isCustom: false, name: entry.name, icon: entry.icon, description: '', rating: DEFAULT_RATING, proof: '' }
}

function customDraft(): SkillDraft {
  return {
    isCustom: true,
    name: '',
    icon: CUSTOM_SKILL_ICONS[0].icon,
    description: '',
    rating: DEFAULT_RATING,
    proof: '',
  }
}

function draftFromSkill(skill: Skill): SkillDraft {
  return {
    isCustom: skill.isCustom ?? false,
    name: skill.name,
    icon: skill.icon,
    description: skill.description ?? '',
    rating: skill.rating,
    proof: skill.proof ?? '',
  }
}

function needsProof(rating: number): boolean {
  return rating >= PROOF_REQUIRED_FROM
}

/** Why this draft can't be saved yet, or null if it can. `ownId` is left out of the duplicate
 *  check so editing a skill without renaming it doesn't collide with itself. */
function findProblem(draft: SkillDraft, skills: Skill[], ownId?: string): string | null {
  const name = draft.name.trim()

  if (name === '') return 'Give the skill a name.'
  if (skills.some((skill) => skill.id !== ownId && skill.name.toLowerCase() === name.toLowerCase())) {
    return `You already have a skill called ${name}.`
  }
  if (needsProof(draft.rating) && draft.proof.trim() === '') {
    return `A self-rating of ${PROOF_REQUIRED_FROM}★ or higher needs proof: a reference work or an official qualification.`
  }
  return null
}

/** The searchable predefined list (§7), minus anything already on your list. */
function matchingCatalogEntries(search: string, skills: Skill[]): CatalogEntry[] {
  const query = search.trim().toLowerCase()
  const taken = new Set(skills.map((skill) => skill.name.toLowerCase()))
  return SKILL_CATALOG.filter(
    (entry) => !taken.has(entry.name.toLowerCase()) && entry.name.toLowerCase().includes(query),
  )
}

/** Reviews are recorded against a skill's name at the time they were left (mockUser.ts's Review
 *  has no skill id to match against), so this takes the skill's stable, original name — not
 *  whatever is currently typed into a rename-in-progress draft. */
function reviewsFor(skillName: string): Review[] {
  return MOCK_REVIEWS.filter((review) => review.skill === skillName)
}

interface IconPickerProps {
  selected: string
  onSelect: (icon: string) => void
}

/** Not OptionGroup: each button shows a glyph and needs an accessible name of its own, and
 *  OptionGroup renders its label as the visible text — which would leave a screen reader with a
 *  bare emoji. */
function IconPicker({ selected, onSelect }: IconPickerProps) {
  return (
    <fieldset className="skill-page__icons">
      <legend>Icon</legend>
      <div className="skill-page__icon-row">
        {CUSTOM_SKILL_ICONS.map(({ icon, name }) => (
          <button
            key={icon}
            type="button"
            className={`skill-page__icon ${selected === icon ? 'is-active' : ''}`}
            aria-pressed={selected === icon}
            aria-label={name}
            onClick={() => onSelect(icon)}
          >
            <span aria-hidden="true">{icon}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

interface SkillChooserProps {
  search: string
  onSearchChange: (search: string) => void
  matches: CatalogEntry[]
  customSkillsLeft: number
  onPickCatalog: (entry: CatalogEntry) => void
  onCreateCustom: () => void
}

/** Create mode's first step: search the predefined list, or create a custom skill. Ported
 *  unchanged from the old SkillsPage inline form (TODO #6). */
function SkillChooser({
  search,
  onSearchChange,
  matches,
  customSkillsLeft,
  onPickCatalog,
  onCreateCustom,
}: SkillChooserProps) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">Add a skill</h2>

      <label className="skill-page__label" htmlFor="skill-search">
        Search skills
      </label>
      <input
        id="skill-search"
        className="skill-page__input"
        type="search"
        value={search}
        placeholder="e.g. guitar"
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <ul className="skill-page__results" aria-label="Search results">
        {matches.map((entry) => (
          <li key={entry.name}>
            <button type="button" className="skill-page__result" onClick={() => onPickCatalog(entry)}>
              <span aria-hidden="true">{entry.icon}</span>
              <span>{entry.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {matches.length === 0 && (
        <p className="page-note">Nothing in the list matches. You can create it as a custom skill.</p>
      )}

      <p className="skill-page__cap">
        {customSkillsLeft} of {CUSTOM_SKILL_CAP} custom skills left
      </p>
      {customSkillsLeft > 0 ? (
        <button type="button" className="skill-page__secondary" onClick={onCreateCustom}>
          Create a custom skill
        </button>
      ) : (
        <p className="page-note">
          You have used all {CUSTOM_SKILL_CAP} custom skills. Remove one to make room for another.
        </p>
      )}
    </section>
  )
}

interface SkillFormProps {
  draft: SkillDraft
  onChange: (patch: Partial<SkillDraft>) => void
  problem: string | null
  submitLabel: string
  onCancel?: () => void
}

/** The editable half, shared by "editing an existing skill" and "create mode, once a catalogue
 *  entry or custom skill has been chosen". Name and icon are only editable for custom skills —
 *  a catalogue skill's identity comes from the catalogue. */
function SkillForm({ draft, onChange, problem, submitLabel, onCancel }: SkillFormProps) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">
        {draft.isCustom && draft.name.trim() === '' ? 'Create a custom skill' : draft.name}
      </h2>

      <div className="skill-page__form">
        {draft.isCustom && (
          <>
            <div className="skill-page__field">
              <label className="skill-page__label" htmlFor="skill-name">
                Skill name
              </label>
              <input
                id="skill-name"
                className="skill-page__input"
                type="text"
                value={draft.name}
                onChange={(event) => onChange({ name: event.target.value })}
              />
            </div>
            <IconPicker selected={draft.icon} onSelect={(icon) => onChange({ icon })} />
          </>
        )}

        <div className="skill-page__field">
          <label className="skill-page__label" htmlFor="skill-description">
            Description
          </label>
          <textarea
            id="skill-description"
            className="skill-page__input skill-page__input--multiline"
            rows={3}
            value={draft.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </div>

        <OptionGroup
          legend="Your rating"
          options={RATING_OPTIONS}
          selected={draft.rating}
          onSelect={(rating) => onChange({ rating })}
        />

        <div className="skill-page__field">
          <label className="skill-page__label" htmlFor="skill-proof">
            Proof
          </label>
          <input
            id="skill-proof"
            className="skill-page__input"
            type="text"
            value={draft.proof}
            placeholder="Reference work or official qualification"
            onChange={(event) => onChange({ proof: event.target.value })}
          />
          {needsProof(draft.rating) ? (
            <p className="page-note">
              Required from {PROOF_REQUIRED_FROM}★: a reference work or an official qualification.
            </p>
          ) : (
            <p className="page-note">Optional below {PROOF_REQUIRED_FROM}★.</p>
          )}
        </div>

        {/* The gate reports on submit rather than disabling the button: a disabled control can't
            say why it is disabled, and this rule needs explaining. */}
        {problem !== null && (
          <p className="skill-page__problem" role="alert">
            {problem}
          </p>
        )}

        <div className="skill-page__actions">
          {onCancel && (
            <button type="button" className="skill-page__secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="skill-page__primary">
            {submitLabel}
          </button>
        </div>
      </div>
    </section>
  )
}

interface SkillDetailsProps {
  /** What to display: name, icon, description, self-rating and proof, possibly just edited.
   *  Mirrors AdDetailPage, which renders its non-editing view from `draft` too, so a Save is
   *  visible immediately instead of being silently discarded back to the original mock record. */
  draft: SkillDraft
  /** Fields that don't come from the draft because they aren't something you edit here: the
   *  review rating (an average of other people's reviews, not a value this form sets), and the
   *  skill's original name, which is what past reviews are recorded against — see reviewsFor.
   *  The id itself doesn't need to be a prop: onOpenReviewedTrades already has it bound. */
  reviewRating: number
  originalName: string
  onEdit: () => void
  onOpenReviewedTrades: () => void
}

/** View mode (TODO #7): logo, name, description, both ratings, recent reviews of this specific
 *  skill, and the way through to its already-reviewed trades. */
function SkillDetails({ draft, reviewRating, originalName, onEdit, onOpenReviewedTrades }: SkillDetailsProps) {
  const reviews = reviewsFor(originalName)

  return (
    <>
      <section className="page-section skill-page__identity">
        <span className="skill-page__icon-frame">
          <SquareTile label={draft.name}>
            <span className="square-tile__icon" aria-hidden="true">
              {draft.icon}
            </span>
          </SquareTile>
        </span>
        <div className="skill-page__ratings">
          <h2 className="skill-page__name">{draft.name}</h2>
          {/* Two ratings, always both shown (TODO #5-#7): the upper is the self-rating, the
              lower is what reviews of this skill average to. Kept as two StarRatings with
              distinct accessible names rather than one combined number, same as ProfilePage. */}
          <p className="skill-page__rating-row">
            <span>Your rating</span>
            <StarRating value={draft.rating} subject={`${draft.name}'s rating`} />
          </p>
          <p className="skill-page__rating-row">
            <span>Review rating</span>
            <StarRating value={reviewRating} subject={`${draft.name}'s review rating`} />
          </p>
        </div>
      </section>

      <section className="page-section">
        <h2 className="page-section__heading">Description</h2>
        <p className="page-card skill-page__description">
          {draft.description.trim() !== '' ? draft.description : 'No description yet.'}
        </p>
      </section>

      <section className="page-section">
        <h2 className="page-section__heading">Recent reviews</h2>
        {reviews.length === 0 ? (
          <p className="page-note">No reviews of this skill yet.</p>
        ) : (
          <ul className="skill-page__reviews" aria-label={`Reviews of ${originalName}`}>
            {reviews.map((review) => (
              <li key={review.id} className="page-card skill-page__review">
                <p className="skill-page__review-head">
                  <span aria-hidden="true">{review.avatar}</span>
                  <span className="skill-page__review-author">{review.author}</span>
                  <span className="skill-page__review-date">{review.date}</span>
                </p>
                {review.skillRating !== undefined && (
                  <StarRating value={review.skillRating} subject={`${originalName} from ${review.author}`} />
                )}
                <p className="skill-page__review-comment">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" className="skill-page__link" onClick={onOpenReviewedTrades}>
        All reviewed trades for this skill
      </button>

      <div className="skill-page__actions skill-page__actions--sticky">
        <button type="button" className="skill-page__primary" onClick={onEdit}>
          Edit
        </button>
      </div>
    </>
  )
}

function SkillNotFound({ skillId }: { skillId: string | undefined }) {
  const navigate = useNavigate()

  return (
    <PageShell title="Skill not found">
      <div className="skill-page">
        <section className="page-section">
          <div className="page-card">
            <p className="skill-page__description">
              There is no skill with the id <strong>{skillId ?? 'unknown'}</strong>.
            </p>
          </div>
        </section>
        <button type="button" className="skill-page__primary" onClick={() => navigate(ROUTES.skills)}>
          Back to Skills
        </button>
      </div>
    </PageShell>
  )
}

/** Skill (Appkarte-adjacent TODO #7): one page in two modes, the same way AdDetailPage is one
 *  component for viewing, editing and creating (§5's precedent) rather than three files that
 *  drift apart.
 *
 *  Judgement calls:
 *  - Nothing here is saved past this page visit — editing a skill and pressing Save shows the
 *    edited value with a note that it isn't persisted, and creating a skill behaves the same way
 *    AdDetailPage's create mode does: the validation is real, but there is nowhere for the result
 *    to go once it passes. This was a deliberate choice (over lifting skills into a shared store)
 *    to match the rest of the prototype's honesty convention rather than invent one component
 *    that behaves more "really" than every other detail page.
 *  - This replaces SkillsPage's old inline "search catalogue / create custom skill" form. The
 *    validation it did (duplicate names, the 4★-needs-proof gate) moved here rather than being
 *    dropped — TODO #6 wants the button-to-a-page flow, not a weaker one. */
export function SkillPage({ mode }: { mode?: 'create' }) {
  const { skillId } = useParams()
  const navigate = useNavigate()

  const isCreate = mode === 'create'
  const skill = isCreate ? undefined : findSkill(skillId)

  const [draft, setDraft] = useState<SkillDraft | null>(() => (skill ? draftFromSkill(skill) : null))
  const [isEditing, setIsEditing] = useState(isCreate)
  const [search, setSearch] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [actionNote, setActionNote] = useState<string | null>(null)
  const [loadedSkillId, setLoadedSkillId] = useState(skillId)

  // Same reload-on-param-change guard as AdDetailPage: react-router can keep this component
  // mounted while the URL moves from one skill to another, so the draft has to be refreshed by
  // hand or a stale skill's data would flash on screen first.
  if (skillId !== loadedSkillId) {
    setLoadedSkillId(skillId)
    setDraft(skill ? draftFromSkill(skill) : null)
    setIsEditing(isCreate)
    setSearch('')
    setProblem(null)
    setActionNote(null)
  }

  if (!isCreate && skill === undefined) {
    return <SkillNotFound skillId={skillId} />
  }

  const customSkillsLeft = CUSTOM_SKILL_CAP - MOCK_SKILLS.filter((existing) => existing.isCustom).length
  const catalogMatches = matchingCatalogEntries(search, MOCK_SKILLS)

  const openDraft = (next: SkillDraft) => {
    setDraft(next)
    setProblem(null)
  }

  const editDraft = (patch: Partial<SkillDraft>) => {
    setDraft((current) => (current === null ? null : { ...current, ...patch }))
    setProblem(null)
  }

  const closeDraftChoice = () => {
    setDraft(null)
    setProblem(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draft === null) return

    const found = findProblem(draft, MOCK_SKILLS, skill?.id)
    if (found !== null) {
      setProblem(found)
      return
    }

    if (isCreate) {
      setActionNote('The skill exists on this page only — creating a skill is not wired up.')
      return
    }

    setIsEditing(false)
    setActionNote('Changes are kept for this page visit only — nothing is saved.')
  }

  const title = draft && draft.name.trim() !== '' ? draft.name : isCreate ? 'New skill' : (skill?.name ?? 'Skill')

  return (
    <PageShell title={title}>
      <div className="skill-page">
        {isEditing ? (
          draft === null ? (
            <SkillChooser
              search={search}
              onSearchChange={setSearch}
              matches={catalogMatches}
              customSkillsLeft={customSkillsLeft}
              onPickCatalog={(entry) => openDraft(catalogDraft(entry))}
              onCreateCustom={() => openDraft(customDraft())}
            />
          ) : (
            <form onSubmit={handleSubmit}>
              <SkillForm
                draft={draft}
                onChange={editDraft}
                problem={problem}
                submitLabel={isCreate ? 'Create skill' : 'Save'}
                onCancel={isCreate ? closeDraftChoice : undefined}
              />
            </form>
          )
        ) : (
          skill &&
          draft && (
            <SkillDetails
              draft={draft}
              reviewRating={skill.reviewRating}
              originalName={skill.name}
              onEdit={() => setIsEditing(true)}
              onOpenReviewedTrades={() => navigate(reviewedTrades(skill.id))}
            />
          )
        )}

        {actionNote !== null && (
          <p className="skill-page__feedback" role="status">
            {actionNote}
          </p>
        )}

        <p className="page-note">
          Prototype scope: nothing on this page is saved anywhere — reloading, or navigating away
          and back, brings back the starting data.
        </p>
      </div>
    </PageShell>
  )
}
