import { screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { CUSTOM_SKILL_CAP, MOCK_SKILLS } from '../../data/mockUser'
import { SkillsPage } from '../../pages/SkillsPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

const yourSkills = () => within(screen.getByRole('list', { name: 'Your skills' }))
const searchResults = () => within(screen.getByRole('list', { name: 'Search results' }))

/** Search for a catalogue skill and open its add form. */
async function startAdding(user: UserEvent, name: string) {
  await user.type(screen.getByLabelText('Search skills'), name)
  await user.click(searchResults().getByRole('button', { name }))
}

async function createCustomSkill(user: UserEvent, name: string) {
  await user.click(screen.getByRole('button', { name: 'Create a custom skill' }))
  await user.type(screen.getByLabelText('Skill name'), name)
  await user.click(screen.getByRole('button', { name: 'Add skill' }))
}

describe('SkillsPage', () => {
  it('lists the skills you already have, with their ratings', () => {
    renderWithRouter(<SkillsPage />)

    expect(yourSkills().getAllByRole('listitem')).toHaveLength(MOCK_SKILLS.length)
    expect(yourSkills().getByText('Web design')).toBeInTheDocument()
    expect(yourSkills().getByRole('img', { name: 'Piano: rated 4 out of 5' })).toBeInTheDocument()
  })

  it('filters the predefined list by the search text', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SkillsPage />)

    await user.type(screen.getByLabelText('Search skills'), 'gui')

    const results = searchResults().getAllByRole('button')
    expect(results).toHaveLength(1)
    expect(results[0]).toHaveAccessibleName('Guitar')
  })

  it('leaves skills you already have out of the search results', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SkillsPage />)

    await user.type(screen.getByLabelText('Search skills'), 'piano')

    expect(searchResults().queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByText(/nothing in the list matches/i)).toBeInTheDocument()
  })

  it('adds a catalogue skill below 4 stars without asking for proof', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SkillsPage />)

    await startAdding(user, 'Yoga')
    await user.click(screen.getByRole('button', { name: '2★' }))
    await user.click(screen.getByRole('button', { name: 'Add skill' }))

    expect(yourSkills().getByText('Yoga')).toBeInTheDocument()
    expect(yourSkills().getByRole('img', { name: 'Yoga: rated 2 out of 5' })).toBeInTheDocument()
  })

  it('blocks a rating of 4 stars or more when no proof is given, and says why', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SkillsPage />)

    await startAdding(user, 'Guitar')
    await user.click(screen.getByRole('button', { name: '5★' }))
    await user.click(screen.getByRole('button', { name: 'Add skill' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/needs proof/i)
    expect(yourSkills().queryByText('Guitar')).not.toBeInTheDocument()
  })

  it('allows the same rating once proof is given', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SkillsPage />)

    await startAdding(user, 'Guitar')
    await user.click(screen.getByRole('button', { name: '4★' }))
    await user.click(screen.getByRole('button', { name: 'Add skill' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Proof'), 'Music school certificate, 2021')
    await user.click(screen.getByRole('button', { name: 'Add skill' }))

    expect(yourSkills().getByText('Guitar')).toBeInTheDocument()
    expect(yourSkills().getByRole('img', { name: 'Guitar: rated 4 out of 5' })).toBeInTheDocument()
    expect(yourSkills().getByText('Music school certificate, 2021')).toBeInTheDocument()
  })

  it('creates a custom skill with an icon from the predefined set', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SkillsPage />)

    await user.click(screen.getByRole('button', { name: 'Create a custom skill' }))
    await user.type(screen.getByLabelText('Skill name'), 'Beekeeping')
    await user.click(screen.getByRole('button', { name: 'Books' }))
    await user.click(screen.getByRole('button', { name: 'Add skill' }))

    expect(yourSkills().getByText('Beekeeping')).toBeInTheDocument()
  })

  it('counts down the custom skills left and stops at the cap', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SkillsPage />)

    const alreadyCustom = MOCK_SKILLS.filter((skill) => skill.isCustom).length
    const left = CUSTOM_SKILL_CAP - alreadyCustom
    expect(screen.getByText(`${left} of ${CUSTOM_SKILL_CAP} custom skills left`)).toBeInTheDocument()

    for (let index = 0; index < left; index += 1) {
      await createCustomSkill(user, `Custom skill ${index}`)
    }

    expect(screen.getByText(`0 of ${CUSTOM_SKILL_CAP} custom skills left`)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create a custom skill' })).not.toBeInTheDocument()
    expect(screen.getByText(new RegExp(`used all ${CUSTOM_SKILL_CAP} custom skills`, 'i'))).toBeInTheDocument()
  })

  it('refuses a custom skill with no name, and one you already have', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SkillsPage />)

    await user.click(screen.getByRole('button', { name: 'Create a custom skill' }))
    await user.click(screen.getByRole('button', { name: 'Add skill' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/name/i)

    await user.type(screen.getByLabelText('Skill name'), 'Cooking')
    await user.click(screen.getByRole('button', { name: 'Add skill' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/already have a skill called Cooking/i)
  })
})
