import { useState, type FormEvent } from 'react'
import type { Skill } from '../../data/mockUser'
import { SkillChooser, SkillForm } from '../SkillPage'
import {
  catalogDraft,
  customDraft,
  customSkillsLeft,
  findProblem,
  matchingCatalogEntries,
  toSkill,
  type SkillDraft,
} from '../skillDraft'
import { OnboardingStepShell } from './OnboardingStepShell'

interface StepSkillsProps {
  step: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
}

/** TODO #2.1: reuses SkillPage's own "search the catalogue, or create a custom skill" flow
 *  (`SkillChooser`/`SkillForm`, exported from there for exactly this reason) instead of building a
 *  second, simpler picker that would drift from the real one over time.
 *
 *  Unlike every other "create" flow in this prototype (Ad, Item, Skill itself), this one has to
 *  actually keep what gets added, not just validate and dead-end at a "not saved" note — Continue
 *  is gated on having at least one skill, so there needs to be a real, growing list to count.
 *  `crypto.randomUUID()` is the first generated id anywhere in the app for exactly that reason:
 *  every other page's draft never becomes a list item, so nothing has ever needed one before (see
 *  skillDraft.ts's `toSkill`). Nothing here reaches `MOCK_SKILLS` — it's a local list for this
 *  step's visit only, same "nothing persists" honesty the rest of the prototype already keeps. */
export function StepSkills({ step, totalSteps, onNext, onSkip }: StepSkillsProps) {
  const [addedSkills, setAddedSkills] = useState<Skill[]>([])
  const [draft, setDraft] = useState<SkillDraft | null>(null)
  const [search, setSearch] = useState('')
  const [problem, setProblem] = useState<string | null>(null)

  const openDraft = (next: SkillDraft) => {
    setDraft(next)
    setProblem(null)
  }

  const editDraft = (patch: Partial<SkillDraft>) => {
    setDraft((current) => (current === null ? null : { ...current, ...patch }))
    setProblem(null)
  }

  const removeSkill = (id: string) => {
    setAddedSkills((skills) => skills.filter((skill) => skill.id !== id))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draft === null) return

    const found = findProblem(draft, addedSkills)
    if (found !== null) {
      setProblem(found)
      return
    }

    setAddedSkills((skills) => [...skills, toSkill(draft, crypto.randomUUID())])
    setDraft(null)
    setSearch('')
    setProblem(null)
  }

  return (
    <OnboardingStepShell
      step={step}
      totalSteps={totalSteps}
      title="Add your skills"
      description="List a few things you can teach, do, or lend a hand with. You can add more anytime later."
      primaryLabel="Continue"
      onPrimary={onNext}
      onSkip={onSkip}
      primaryDisabled={addedSkills.length === 0}
      primaryHint="Add at least one skill to continue, or Skip for now."
    >
      {addedSkills.length > 0 && (
        <ul className="onboarding-step__skills" aria-label="Your added skills">
          {addedSkills.map((skill) => (
            <li className="onboarding-step__skill" key={skill.id}>
              <span aria-hidden="true">{skill.icon}</span>
              <span className="onboarding-step__skill-name">{skill.name}</span>
              <button
                type="button"
                className="onboarding-step__skill-remove"
                aria-label={`Remove ${skill.name}`}
                onClick={() => removeSkill(skill.id)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft === null ? (
        <SkillChooser
          search={search}
          onSearchChange={setSearch}
          matches={matchingCatalogEntries(search, addedSkills)}
          customSkillsLeft={customSkillsLeft(addedSkills)}
          onPickCatalog={(entry) => openDraft(catalogDraft(entry))}
          onCreateCustom={() => openDraft(customDraft())}
        />
      ) : (
        <form onSubmit={handleSubmit}>
          <SkillForm
            draft={draft}
            onChange={editDraft}
            problem={problem}
            submitLabel="Add skill"
            onCancel={() => setDraft(null)}
          />
        </form>
      )}
    </OnboardingStepShell>
  )
}
