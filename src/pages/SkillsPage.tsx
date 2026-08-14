import { useState, type FormEvent } from 'react'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { SquareTile } from '../components/SquareTile'
import { CUSTOM_SKILL_CAP, MOCK_SKILLS, SKILL_CATALOG, type Skill } from '../data/mockUser'
import './SkillsPage.css'
import { StarRating } from '../components/StarRating'

/** Appkarte §7: from this self-rating upwards, a skill only counts with proof. */
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

/** The skill being added, before it is accepted onto the list. Catalogue skills and custom skills
 *  share this shape — only `isCustom` differs, and it is what decides whether the name and icon
 *  are editable and whether the skill counts against the cap. */
interface SkillDraft {
  isCustom: boolean
  name: string
  icon: string
  rating: number
  proof: string
}

function catalogDraft(entry: CatalogEntry): SkillDraft {
  return { isCustom: false, name: entry.name, icon: entry.icon, rating: DEFAULT_RATING, proof: '' }
}

function customDraft(): SkillDraft {
  return { isCustom: true, name: '', icon: CUSTOM_SKILL_ICONS[0].icon, rating: DEFAULT_RATING, proof: '' }
}

function needsProof(rating: number): boolean {
  return rating >= PROOF_REQUIRED_FROM
}

/** Why this draft can't be added yet, or null if it can. Kept as one pure function so the rules
 *  are readable in one place instead of scattered through the form's JSX. */
function findProblem(draft: SkillDraft, skills: Skill[]): string | null {
  const name = draft.name.trim()

  if (name === '') return 'Give your custom skill a name.'
  if (skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
    return `You already have a skill called ${name}.`
  }
  if (needsProof(draft.rating) && draft.proof.trim() === '') {
    return `A self-rating of ${PROOF_REQUIRED_FROM}★ or higher needs proof: a reference work or an official qualification.`
  }
  return null
}

function toSkill(draft: SkillDraft): Skill {
  const name = draft.name.trim()
  return {
    id: `skill-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    icon: draft.icon,
    rating: draft.rating,
    proof: draft.proof.trim() || undefined,
    isCustom: draft.isCustom,
  }
}

/** The searchable predefined list (§7), minus anything already on your list — re-adding a skill
 *  you have is never what you meant. */
function matchingCatalogEntries(search: string, skills: Skill[]): CatalogEntry[] {
  const query = search.trim().toLowerCase()
  const taken = new Set(skills.map((skill) => skill.name.toLowerCase()))
  return SKILL_CATALOG.filter(
    (entry) => !taken.has(entry.name.toLowerCase()) && entry.name.toLowerCase().includes(query),
  )
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
    <fieldset className="skills-page__icons">
      <legend>Icon</legend>
      <div className="skills-page__icon-row">
        {CUSTOM_SKILL_ICONS.map(({ icon, name }) => (
          <button
            key={icon}
            type="button"
            className={`skills-page__icon ${selected === icon ? 'is-active' : ''}`}
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

/** Skills (Appkarte §7): your skills as icons, adding from a searchable predefined list with a
 *  self-rating, proof required from 4★ up, and custom skills capped per user.
 *
 *  The add flow really works, in local state: the list, the search, the rating, the proof gate and
 *  the cap all respond. Nothing is persisted — reloading brings back the starting five, which is
 *  the agreed prototype scope.
 *
 *  Only one draft is open at a time (either a catalogue skill or a custom one), which is why the
 *  search and the "create a custom skill" button give way to the form. On a phone-sized screen
 *  that is the honest layout, and it keeps the page down to one thing to answer at a time.
 *
 *  §2 makes this page the template for onboarding's "add skills" step, so the whole flow is
 *  self-contained here — a later onboarding step can render it without dragging state along.
 *  The whiteboard's "minimum 3 skills" is recorded as unconfirmed in §2, so no minimum is
 *  enforced and you can leave with as few skills as you like. */
export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>(MOCK_SKILLS)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<SkillDraft | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  const customSkillsLeft = CUSTOM_SKILL_CAP - skills.filter((skill) => skill.isCustom).length
  const catalogMatches = matchingCatalogEntries(search, skills)

  const openDraft = (next: SkillDraft) => {
    setDraft(next)
    setProblem(null)
  }

  /** Any edit clears the message, so a fixed problem stops being complained about. */
  const editDraft = (patch: Partial<SkillDraft>) => {
    setDraft((current) => (current === null ? null : { ...current, ...patch }))
    setProblem(null)
  }

  const closeDraft = () => {
    setDraft(null)
    setProblem(null)
  }

  const submitDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draft === null) return

    const found = findProblem(draft, skills)
    if (found !== null) {
      setProblem(found)
      return
    }

    setSkills((current) => [...current, toSkill(draft)])
    setSearch('')
    closeDraft()
  }

  return (
    <PageShell title="Skills">
      <div className="skills-page">
        <section className="page-section">
          <h2 className="page-section__heading">Your skills</h2>
          <ul className="skills-page__grid" aria-label="Your skills">
            {skills.map((skill) => (
              <li key={skill.id} className="skills-page__skill">
                <span className="skills-page__skill-icon">
                  <SquareTile label={skill.name}>
                    <span className="square-tile__icon" aria-hidden="true">
                      {skill.icon}
                    </span>
                  </SquareTile>
                </span>
                <span className="skills-page__skill-name">{skill.name}</span>
                <StarRating value={skill.rating} subject={skill.name} />
                {skill.proof !== undefined && <span className="skills-page__proof">{skill.proof}</span>}
              </li>
            ))}
          </ul>
        </section>

        {draft === null ? (
          <section className="page-section">
            <h2 className="page-section__heading">Add a skill</h2>

            <label className="skills-page__label" htmlFor="skill-search">
              Search skills
            </label>
            <input
              id="skill-search"
              className="skills-page__input"
              type="search"
              value={search}
              placeholder="e.g. guitar"
              onChange={(event) => setSearch(event.target.value)}
            />

            <ul className="skills-page__results" aria-label="Search results">
              {catalogMatches.map((entry) => (
                <li key={entry.name}>
                  <button
                    type="button"
                    className="skills-page__result"
                    onClick={() => openDraft(catalogDraft(entry))}
                  >
                    <span aria-hidden="true">{entry.icon}</span>
                    <span>{entry.name}</span>
                  </button>
                </li>
              ))}
            </ul>

            {catalogMatches.length === 0 && (
              <p className="page-note">Nothing in the list matches. You can create it as a custom skill.</p>
            )}

            <p className="skills-page__cap">
              {customSkillsLeft} of {CUSTOM_SKILL_CAP} custom skills left
            </p>
            {customSkillsLeft > 0 ? (
              <button
                type="button"
                className="skills-page__secondary"
                onClick={() => openDraft(customDraft())}
              >
                Create a custom skill
              </button>
            ) : (
              <p className="page-note">
                You have used all {CUSTOM_SKILL_CAP} custom skills. Remove one to make room for
                another.
              </p>
            )}
          </section>
        ) : (
          <section className="page-section">
            <h2 className="page-section__heading">
              {draft.isCustom ? 'Create a custom skill' : `Add ${draft.name}`}
            </h2>

            <form className="skills-page__form" onSubmit={submitDraft}>
              {draft.isCustom && (
                <>
                  <div className="skills-page__field">
                    <label className="skills-page__label" htmlFor="custom-skill-name">
                      Skill name
                    </label>
                    <input
                      id="custom-skill-name"
                      className="skills-page__input"
                      type="text"
                      value={draft.name}
                      onChange={(event) => editDraft({ name: event.target.value })}
                    />
                  </div>
                  <IconPicker selected={draft.icon} onSelect={(icon) => editDraft({ icon })} />
                </>
              )}

              <OptionGroup
                legend="Your rating"
                options={RATING_OPTIONS}
                selected={draft.rating}
                onSelect={(rating) => editDraft({ rating })}
              />

              <div className="skills-page__field">
                <label className="skills-page__label" htmlFor="skill-proof">
                  Proof
                </label>
                <input
                  id="skill-proof"
                  className="skills-page__input"
                  type="text"
                  value={draft.proof}
                  placeholder="Reference work or official qualification"
                  onChange={(event) => editDraft({ proof: event.target.value })}
                />
                {needsProof(draft.rating) ? (
                  <p className="page-note">
                    Required from {PROOF_REQUIRED_FROM}★: a reference work or an official
                    qualification.
                  </p>
                ) : (
                  <p className="page-note">
                    Optional below {PROOF_REQUIRED_FROM}★.
                  </p>
                )}
              </div>

              {/* The gate reports on submit rather than disabling the button: a disabled control
                  can't say why it is disabled, and this rule needs explaining. */}
              {problem !== null && (
                <p className="skills-page__problem" role="alert">
                  {problem}
                </p>
              )}

              <div className="skills-page__actions">
                <button type="button" className="skills-page__secondary" onClick={closeDraft}>
                  Cancel
                </button>
                <button type="submit" className="skills-page__primary">
                  Add skill
                </button>
              </div>
            </form>
          </section>
        )}

        <p className="page-note">
          Prototype scope: skills live in this screen's memory only, so a reload brings back the
          starting list.
        </p>
      </div>
    </PageShell>
  )
}
