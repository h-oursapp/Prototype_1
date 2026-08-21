import { CUSTOM_SKILL_CAP, SKILL_CATALOG, type Skill } from '../data/mockUser'

/** Appkarte §7: from this self-rating upwards, a skill only counts with proof. Pulled out of
 *  SkillPage.tsx (TODO #2.1) so the onboarding "Add your skills" step enforces the exact same
 *  rule via the exact same function, instead of a second copy quietly drifting from this one. */
export const PROOF_REQUIRED_FROM = 4

/** Where a new skill's self-rating starts. Deliberately below PROOF_REQUIRED_FROM, so nobody is
 *  asked for paperwork before they have chosen anything. */
export const DEFAULT_RATING = 3

export const RATING_OPTIONS = [1, 2, 3, 4, 5].map((rating) => ({ value: rating, label: `${rating}★` }))

/** §7: custom skills pick their icon from a predefined set rather than uploading one. The names
 *  are what assistive tech reads out — an emoji on its own has no useful accessible name. */
export const CUSTOM_SKILL_ICONS = [
  { icon: '🛠️', name: 'Tools' },
  { icon: '🎯', name: 'Target' },
  { icon: '🧵', name: 'Thread' },
  { icon: '🎧', name: 'Headphones' },
  { icon: '🚗', name: 'Car' },
  { icon: '🧪', name: 'Flask' },
  { icon: '📚', name: 'Books' },
  { icon: '🌿', name: 'Plant' },
]

export type CatalogEntry = (typeof SKILL_CATALOG)[number]

/** The skill being created or edited. Catalogue and custom skills share this shape — only
 *  `isCustom` differs, and it is what decides whether the name and icon are editable. */
export interface SkillDraft {
  isCustom: boolean
  name: string
  icon: string
  description: string
  rating: number
  proof: string
  /** Edited by `SkillForm`'s own Visibility `OptionGroup` now (TODO #7's "items and skills have
   *  to be similar", matching `ItemForm`'s identical control) — this field used to just carry the
   *  default/existing value through untouched, the same way `description`/`proof` still do before
   *  anyone's edited them. */
  isPublic: boolean
}

export function catalogDraft(entry: CatalogEntry): SkillDraft {
  return {
    isCustom: false,
    name: entry.name,
    icon: entry.icon,
    description: '',
    rating: DEFAULT_RATING,
    proof: '',
    isPublic: true,
  }
}

export function customDraft(): SkillDraft {
  return {
    isCustom: true,
    name: '',
    icon: CUSTOM_SKILL_ICONS[0].icon,
    description: '',
    rating: DEFAULT_RATING,
    proof: '',
    isPublic: true,
  }
}

export function draftFromSkill(skill: Skill): SkillDraft {
  return {
    isCustom: skill.isCustom ?? false,
    name: skill.name,
    icon: skill.icon,
    description: skill.description ?? '',
    rating: skill.rating,
    proof: skill.proof ?? '',
    isPublic: skill.isPublic,
  }
}

export function needsProof(rating: number): boolean {
  return rating >= PROOF_REQUIRED_FROM
}

/** Why this draft can't be saved yet, or null if it can. `ownId` is left out of the duplicate
 *  check so editing a skill without renaming it doesn't collide with itself. */
export function findProblem(draft: SkillDraft, skills: Skill[], ownId?: string): string | null {
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

/** The searchable predefined list (§7), minus anything already on the given skill list. */
export function matchingCatalogEntries(search: string, skills: Skill[]): CatalogEntry[] {
  const query = search.trim().toLowerCase()
  const taken = new Set(skills.map((skill) => skill.name.toLowerCase()))
  return SKILL_CATALOG.filter(
    (entry) => !taken.has(entry.name.toLowerCase()) && entry.name.toLowerCase().includes(query),
  )
}

/** How many custom skills are still available to create, given a list that already has some. */
export function customSkillsLeft(skills: Skill[]): number {
  return CUSTOM_SKILL_CAP - skills.filter((skill) => skill.isCustom).length
}

/** Turns a passed draft into a real `Skill` record — every field SkillPage's own create mode
 *  validates for, plus a fresh `reviewRating` of 0 (nobody has reviewed a skill that doesn't exist
 *  yet). Takes `id` as a parameter rather than generating one itself so this stays a pure,
 *  easily-tested function — the caller is responsible for a source of uniqueness
 *  (`crypto.randomUUID()` on the onboarding skills step, the only place today that actually builds
 *  a growing list of skills rather than dead-ending at a "not saved" note). */
export function toSkill(draft: SkillDraft, id: string): Skill {
  return {
    id,
    name: draft.name.trim(),
    icon: draft.icon,
    description: draft.description.trim() === '' ? undefined : draft.description.trim(),
    rating: draft.rating,
    reviewRating: 0,
    proof: draft.proof.trim() === '' ? undefined : draft.proof.trim(),
    isCustom: draft.isCustom,
    isPublic: draft.isPublic,
  }
}
