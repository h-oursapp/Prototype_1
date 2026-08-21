import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GenerosityBar } from '../../components/GenerosityBar'

describe('GenerosityBar', () => {
  it('shows the empty message when neither side has offered any hours', () => {
    render(<GenerosityBar yourHours={0} partnerHours={0} />)

    expect(screen.getByText('Add something to the table to see how the trade balances.')).toBeInTheDocument()
  })

  it('reads as extremely generous once you offer far more than the partner', () => {
    render(<GenerosityBar yourHours={100} partnerHours={5} />)

    expect(screen.getByText('You are extremely generous!')).toBeInTheDocument()
  })

  it('reads as extremely generous when the partner has offered nothing at all', () => {
    render(<GenerosityBar yourHours={3} partnerHours={0} />)

    expect(screen.getByText('You are extremely generous!')).toBeInTheDocument()
  })

  it('reads as generous, not extreme, in the middle band', () => {
    // 20/10 = 2 — past the fair band (1.6) but not yet the extreme one (3).
    render(<GenerosityBar yourHours={20} partnerHours={10} />)

    expect(screen.getByText('You are generous.')).toBeInTheDocument()
  })

  it('reads as a fair trade when both sides are close', () => {
    render(<GenerosityBar yourHours={70} partnerHours={70} />)

    expect(screen.getByText("That's a fair trade!")).toBeInTheDocument()
  })

  it('reads as a good deal, then too good to be true, as the partner grows more generous', () => {
    const { rerender } = render(<GenerosityBar yourHours={10} partnerHours={20} />)
    expect(screen.getByText('Good deal!')).toBeInTheDocument()

    rerender(<GenerosityBar yourHours={5} partnerHours={100} />)
    expect(screen.getByText('This is too good to be true.')).toBeInTheDocument()
  })

  it('exposes the same message as both its own text and aria-valuetext, for assistive tech', () => {
    render(<GenerosityBar yourHours={2} partnerHours={3} />)

    const meter = screen.getByRole('meter', { name: 'Generosity meter' })
    expect(meter).toHaveAttribute('aria-valuetext', "That's a fair trade!")
    expect(meter).toHaveTextContent("That's a fair trade!")
  })
})
