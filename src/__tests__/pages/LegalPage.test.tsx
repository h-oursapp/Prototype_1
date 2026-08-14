import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { LegalPage } from '../../pages/LegalPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

function renderLegalPage() {
  renderWithRouter(<LegalPage />)
}

function documentEntries(): HTMLElement[] {
  return within(screen.getByRole('list', { name: 'Legal documents' })).getAllByRole('listitem')
}

describe('LegalPage', () => {
  it('lists the documents the section will hold', () => {
    renderLegalPage()

    expect(documentEntries()).toHaveLength(4)
    for (const title of ['Terms of service', 'Privacy policy', 'Imprint', 'Cookie and data handling']) {
      expect(screen.getByRole('button', { name: new RegExp(title) })).toBeInTheDocument()
    }
  })

  it('opens an entry onto an unmistakable not-drafted state', async () => {
    const user = userEvent.setup()
    renderLegalPage()

    expect(screen.queryByText('Not drafted yet')).toBeNull()

    await user.click(screen.getByRole('button', { name: /Privacy policy/ }))

    expect(screen.getByText('Not drafted yet')).toBeInTheDocument()
    expect(screen.getByText(/There is no text for Privacy policy/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Privacy policy/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('closes an entry again', async () => {
    const user = userEvent.setup()
    renderLegalPage()

    await user.click(screen.getByRole('button', { name: /Imprint/ }))
    await user.click(screen.getByRole('button', { name: /Imprint/ }))

    expect(screen.queryByText('Not drafted yet')).toBeNull()
  })

  it('records that §9 leaves the content entirely unspecified', () => {
    renderLegalPage()

    expect(screen.getByText(/leaves this page's content entirely unspecified/i)).toBeInTheDocument()
    expect(screen.getByText(/§9 names no documents whatsoever/i)).toBeInTheDocument()
  })

  it('states that the documents still need real legal review', () => {
    renderLegalPage()

    expect(screen.getByText(/reviewed by a qualified lawyer before/i)).toBeInTheDocument()
  })

  it('marks the version and last-updated values as placeholders, not real values', () => {
    renderLegalPage()

    expect(screen.getByText('App version')).toBeInTheDocument()
    expect(screen.getByText('[placeholder — not wired to the build]')).toBeInTheDocument()
    expect(
      screen.getByText('[placeholder — no document has been written, so nothing has a date]'),
    ).toBeInTheDocument()
  })

  it('carries no legal wording at all — every entry reads as not drafted', () => {
    renderLegalPage()

    expect(screen.getByText('No legal text has been written')).toBeInTheDocument()
    expect(screen.getAllByText('Not drafted')).toHaveLength(4)
  })
})
