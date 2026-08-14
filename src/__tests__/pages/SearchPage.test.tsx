import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { SearchPage } from '../../pages/SearchPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

/** Renders where a tap navigated to, so navigation is observable without mounting the whole app. */
function CurrentPath() {
  const { pathname } = useLocation()
  return <p>{`Current path: ${pathname}`}</p>
}

function renderSearchPage() {
  renderWithRouter(
    <>
      <SearchPage />
      <CurrentPath />
    </>,
  )
}

function nearbyHitNames() {
  const hits = within(screen.getByRole('list')).getAllByRole('button')
  return hits.map((hit) => hit.textContent ?? '')
}

describe('SearchPage', () => {
  it('opens on the map view: a labelled map stand-in beside a real list of nearby hits', () => {
    renderSearchPage()

    expect(screen.getByText('Map — not wired up')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nearby' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guitar lessons/ })).toBeInTheDocument()
    expect(screen.getByText(/0.4 km away/)).toBeInTheDocument()
  })

  it('lists nearby hits nearest first', () => {
    renderSearchPage()

    const names = nearbyHitNames()
    expect(names[0]).toContain('Guitar lessons')
    expect(names[1]).toContain('Sourdough bread')
    expect(names[2]).toContain('Bike repair')
  })

  it('switches to the text-search results grid and back', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.click(screen.getByRole('button', { name: 'Text search' }))
    expect(screen.queryByText('Map — not wired up')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guitar lessons/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Map' }))
    expect(screen.getByText('Map — not wired up')).toBeInTheDocument()
  })

  it('filters the hits by what is typed in the search bar', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.type(screen.getByLabelText('Search'), 'guitar')

    expect(screen.getByRole('button', { name: /Guitar lessons/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Bike repair/ })).not.toBeInTheDocument()
    expect(screen.getByText('1 result')).toBeInTheDocument()
  })

  it('narrows the hits to skills or items with the filter row', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.click(screen.getByRole('button', { name: 'Items' }))
    expect(screen.getByRole('button', { name: /Wooden chair/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Guitar lessons/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Skills' }))
    expect(screen.getByRole('button', { name: /Guitar lessons/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Wooden chair/ })).not.toBeInTheDocument()
  })

  it('keeps the search text and filter when the view is toggled', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.type(screen.getByLabelText('Search'), 'tutoring')
    await user.click(screen.getByRole('button', { name: 'Skills' }))
    await user.click(screen.getByRole('button', { name: 'Text search' }))

    expect(screen.getByLabelText('Search')).toHaveValue('tutoring')
    expect(screen.getByRole('button', { name: 'Skills' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Spanish tutoring/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Guitar lessons/ })).not.toBeInTheDocument()
  })

  it('says so when nothing matches', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.type(screen.getByLabelText('Search'), 'submarine')

    expect(screen.getByText('No offers match this search.')).toBeInTheDocument()
    expect(screen.getByText('0 results')).toBeInTheDocument()
  })

  it('opens the ad detail page from a nearby hit and from a result tile', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.click(screen.getByRole('button', { name: /Guitar lessons/ }))
    expect(screen.getByText('Current path: /ads/ad-1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Text search' }))
    await user.click(screen.getByRole('button', { name: /Bike repair/ }))
    expect(screen.getByText('Current path: /ads/ad-2')).toBeInTheDocument()
  })
})
