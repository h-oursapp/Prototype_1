import { describe, expect, it } from 'vitest'
import type { Skill } from '../../data/mockUser'
import {
  catalogDraft,
  customDraft,
  customSkillsLeft,
  draftFromSkill,
  findProblem,
  matchingCatalogEntries,
  needsProof,
  toSkill,
} from '../../pages/skillDraft'

const EXISTING_SKILLS: Skill[] = [
  { id: 'skill-1', name: 'Web design', icon: '💻', rating: 5, reviewRating: 5, isPublic: true },
  {
    id: 'skill-2',
    name: 'Piano',
    icon: '🎹',
    rating: 4,
    reviewRating: 4,
    proof: 'Conservatory certificate',
    isCustom: true,
    isPublic: true,
  },
]

describe('needsProof', () => {
  it('is false below the 4★ threshold', () => {
    expect(needsProof(3)).toBe(false)
  })

  it('is true at and above the 4★ threshold', () => {
    expect(needsProof(4)).toBe(true)
    expect(needsProof(5)).toBe(true)
  })
})

describe('catalogDraft', () => {
  it('starts from a catalogue entry, not editable as custom, at the default rating', () => {
    const draft = catalogDraft({ name: 'Guitar', icon: '🎸' })
    expect(draft).toEqual({
      isCustom: false,
      name: 'Guitar',
      icon: '🎸',
      description: '',
      rating: 3,
      proof: '',
      isPublic: true,
    })
  })
})

describe('customDraft', () => {
  it('starts empty and marked custom, at the default rating', () => {
    const draft = customDraft()
    expect(draft.isCustom).toBe(true)
    expect(draft.name).toBe('')
    expect(draft.rating).toBe(3)
  })
})

describe('draftFromSkill', () => {
  it('carries every editable field over from an existing skill', () => {
    const skill: Skill = {
      id: 'skill-9',
      name: 'Cooking',
      icon: '🍳',
      description: 'Home-style meals',
      rating: 4,
      reviewRating: 4,
      proof: 'Ran a supper club',
      isCustom: true,
      isPublic: false,
    }

    expect(draftFromSkill(skill)).toEqual({
      isCustom: true,
      name: 'Cooking',
      icon: '🍳',
      description: 'Home-style meals',
      rating: 4,
      proof: 'Ran a supper club',
      isPublic: false,
    })
  })
})

describe('findProblem', () => {
  it('rejects an empty name', () => {
    expect(findProblem(customDraft(), EXISTING_SKILLS)).toBe('Give the skill a name.')
  })

  it('rejects a name already on the list, case-insensitively', () => {
    const draft = { ...customDraft(), name: 'piano' }
    expect(findProblem(draft, EXISTING_SKILLS)).toBe('You already have a skill called piano.')
  })

  it('lets editing a skill keep its own name via ownId', () => {
    const draft = { ...draftFromSkill(EXISTING_SKILLS[1]), name: 'Piano' }
    expect(findProblem(draft, EXISTING_SKILLS, 'skill-2')).toBeNull()
  })

  it('requires proof at 4★ and up', () => {
    const draft = { ...customDraft(), name: 'Carpentry', rating: 4, proof: '' }
    expect(findProblem(draft, EXISTING_SKILLS)).toMatch(/needs proof/)
  })

  it('accepts a complete, non-duplicate draft', () => {
    const draft = { ...customDraft(), name: 'Carpentry', rating: 3 }
    expect(findProblem(draft, EXISTING_SKILLS)).toBeNull()
  })
})

describe('matchingCatalogEntries', () => {
  it('excludes entries whose name is already on the given skill list', () => {
    const matches = matchingCatalogEntries('', EXISTING_SKILLS)
    expect(matches.some((entry) => entry.name === 'Piano')).toBe(false)
  })

  it('filters by a case-insensitive substring search', () => {
    const matches = matchingCatalogEntries('guitar', EXISTING_SKILLS)
    expect(matches.map((entry) => entry.name)).toEqual(['Guitar'])
  })
})

describe('customSkillsLeft', () => {
  it('counts down from the cap by how many existing skills are custom', () => {
    expect(customSkillsLeft(EXISTING_SKILLS)).toBe(4) // cap 5, one custom (Piano) already
  })

  it('is the full cap when nothing custom exists yet', () => {
    expect(customSkillsLeft([])).toBe(5)
  })
})

describe('toSkill', () => {
  it('carries the draft over, with a fresh reviewRating of 0 and the given id', () => {
    const draft = { ...customDraft(), name: 'Carpentry', description: '  Shelves and repairs  ' }
    expect(toSkill(draft, 'new-id')).toEqual({
      id: 'new-id',
      name: 'Carpentry',
      icon: draft.icon,
      description: 'Shelves and repairs',
      rating: 3,
      reviewRating: 0,
      proof: undefined,
      isCustom: true,
      isPublic: true,
    })
  })

  it('trims a blank description/proof down to undefined rather than an empty string', () => {
    const draft = catalogDraft({ name: 'Guitar', icon: '🎸' })
    const skill = toSkill(draft, 'g-1')
    expect(skill.description).toBeUndefined()
    expect(skill.proof).toBeUndefined()
  })
})
