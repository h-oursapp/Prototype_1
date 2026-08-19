import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchBar } from '../../components/SearchBar'

describe('SearchBar', () => {
  it('shows the current value and placeholder, labelled for assistive tech', () => {
    render(<SearchBar value="guitar" onChange={() => {}} placeholder="Skills, items, anything" />)

    const field = screen.getByLabelText('Search')
    expect(field).toHaveValue('guitar')
    expect(field).toHaveAttribute('placeholder', 'Skills, items, anything')
  })

  it('reports each keystroke through onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} placeholder="Search" />)

    await user.type(screen.getByLabelText('Search'), 'ab')

    expect(onChange).toHaveBeenNthCalledWith(1, 'a')
    expect(onChange).toHaveBeenNthCalledWith(2, 'b')
  })

  it('has a submit button next to the field that does not reload the page', async () => {
    const user = userEvent.setup()
    render(<SearchBar value="" onChange={() => {}} placeholder="Search" />)

    const submitButton = screen.getByRole('button', { name: 'Submit search' })
    expect(submitButton).toHaveAttribute('type', 'submit')

    // jsdom throws "Not implemented: HTMLFormElement.prototype.submit" if the form's default
    // submit behaviour isn't actually prevented — this is what proves onSubmit's preventDefault
    // is wired up, not just present in the source.
    await user.click(submitButton)
  })

  it('takes a custom aria-label for the field, for a page that isn\'t Search itself', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Search your items" ariaLabel="Search your inventory" />)

    expect(screen.getByLabelText('Search your inventory')).toBeInTheDocument()
  })
})
