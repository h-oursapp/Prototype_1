import { fireEvent, screen, within } from '@testing-library/react'
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

function renderSearchPage(route?: string) {
  renderWithRouter(
    <>
      <SearchPage />
      <CurrentPath />
    </>,
    route ? { route } : undefined,
  )
}

function resultNames() {
  const results = within(screen.getByRole('list')).getAllByRole('button')
  return results.map((result) => result.textContent ?? '')
}

describe('SearchPage', () => {
  it('opens on the map view: a labelled map stand-in above the results grid', () => {
    renderSearchPage()

    expect(screen.getByText('Map — not wired up')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guitar lessons/ })).toBeInTheDocument()
    expect(screen.getByText(/0.4 km away/)).toBeInTheDocument()
  })

  it('sorts the map view results nearest first', () => {
    renderSearchPage()

    const names = resultNames()
    expect(names[0]).toContain('Furniture assembly')
    expect(names[1]).toContain('Guitar lessons')
    expect(names[2]).toContain('Moving boxes')
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

  it('has a search button next to the field', () => {
    renderSearchPage()

    expect(screen.getByRole('button', { name: 'Submit search' })).toBeInTheDocument()
  })

  it('opens a filter\'s panel from its button, closing whichever panel was open before', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    const kindTrigger = screen.getByRole('button', { name: 'All' })
    await user.click(kindTrigger)
    expect(kindTrigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('group', { name: 'Show' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Any distance' }))
    expect(kindTrigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('group', { name: 'Show' })).not.toBeInTheDocument()
  })

  it('narrows the hits to skills or items from the kind filter panel', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.click(screen.getByRole('button', { name: 'All' }))
    await user.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Items' }))
    expect(screen.getByRole('button', { name: /Wooden chair/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Guitar lessons/ })).not.toBeInTheDocument()
    // Picking an option closes the panel — the trigger itself now reads "Items".
    expect(screen.queryByRole('group', { name: 'Show' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Items' }))
    await user.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Skills' }))
    expect(screen.getByRole('button', { name: /Guitar lessons/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Wooden chair/ })).not.toBeInTheDocument()
  })

  it('narrows the hits with the distance range filter, from its panel', () => {
    renderSearchPage()

    fireEvent.click(screen.getByRole('button', { name: 'Any distance' }))
    fireEvent.change(screen.getByLabelText(/Within \d+ km|Any distance/), { target: { value: '1' } })

    expect(screen.getByRole('button', { name: /Guitar lessons/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /House cleaning/ })).not.toBeInTheDocument()
  })

  it('narrows the hits with the minimum-rating star picker, from its panel', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.click(screen.getByRole('button', { name: 'Any rating' }))
    await user.click(screen.getByRole('radio', { name: 'Minimum rating: Rate 5 out of 5' }))

    expect(screen.getByRole('button', { name: /Guitar lessons/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Bike repair/ })).not.toBeInTheDocument()
  })

  it('closes a filter panel with Done', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.click(screen.getByRole('button', { name: 'Any distance' }))
    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument()
  })

  it('shows a compact rating badge on each result', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.type(screen.getByLabelText('Search'), 'guitar lessons')

    expect(screen.getByText('5★')).toBeInTheDocument()
  })

  it('keeps the search text and filter when the view is toggled', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.type(screen.getByLabelText('Search'), 'tutoring')
    await user.click(screen.getByRole('button', { name: 'All' }))
    await user.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Skills' }))
    await user.click(screen.getByRole('button', { name: 'Text search' }))

    expect(screen.getByLabelText('Search')).toHaveValue('tutoring')
    // The kind trigger now reads "Skills" and shows it holds a non-default value.
    expect(screen.getByRole('button', { name: 'Skills' })).toHaveClass('is-active')
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

  it('opens the ad detail page from a result tile, in either view', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.click(screen.getByRole('button', { name: /Guitar lessons/ }))
    expect(screen.getByText('Current path: /ads/ad-1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Text search' }))
    await user.click(screen.getByRole('button', { name: /Bike repair/ }))
    expect(screen.getByText('Current path: /ads/ad-2')).toBeInTheDocument()
  })

  describe('entry points (TODO #3)', () => {
    it('seeds the query and jumps straight to the text view via ?q=&view=text (Home\'s quick search bar)', () => {
      renderSearchPage('/search?q=guitar&view=text')

      expect(screen.queryByText('Map — not wired up')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Search')).toHaveValue('guitar')
      expect(screen.getByRole('button', { name: /Guitar lessons/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Bike repair/ })).not.toBeInTheDocument()
    })

    it('opens the text view even with a blank query, whenever ?view=text is set', () => {
      renderSearchPage('/search?view=text')

      expect(screen.queryByText('Map — not wired up')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Search')).toHaveValue('')
    })

    it('opens on the map view with no query, same as before, when there is no ?view= at all', () => {
      renderSearchPage('/search')

      expect(screen.getByText('Map — not wired up')).toBeInTheDocument()
    })

    it('seeds the query but opens the map view via ?q=&view=map (Home\'s location-pin button)', () => {
      renderSearchPage('/search?q=guitar&view=map')

      expect(screen.getByText('Map — not wired up')).toBeInTheDocument()
      expect(screen.getByLabelText('Search')).toHaveValue('guitar')
      expect(screen.getByRole('button', { name: /Guitar lessons/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Bike repair/ })).not.toBeInTheDocument()
    })

    it('starts from Settings\' default search filters instead of always "show everything"', () => {
      window.localStorage.setItem(
        'h-ours:settings',
        JSON.stringify({
          colorTheme: 'light',
          gridSize: 3,
          defaultSearchFilters: { kindFilter: 'item', maxDistanceKm: 10, minRating: 0 },
        }),
      )
      renderSearchPage()

      expect(screen.getByRole('button', { name: 'Items' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Wooden chair/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Guitar lessons/ })).not.toBeInTheDocument()
    })
  })
})
