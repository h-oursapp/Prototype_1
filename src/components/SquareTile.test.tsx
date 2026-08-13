import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SquareTile } from './SquareTile'

describe('SquareTile', () => {
  it('renders as a plain, non-interactive element when no onClick is given', () => {
    render(<SquareTile label="Guitar lessons" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Guitar lessons')).toBeInTheDocument()
  })

  it('renders as a clickable button and fires onClick when one is given', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<SquareTile label="Guitar lessons" onClick={onClick} />)

    await user.click(screen.getByRole('button', { name: 'Guitar lessons' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders children content', () => {
    render(
      <SquareTile label="Guitar lessons">
        <span>🎸</span>
      </SquareTile>,
    )
    expect(screen.getByText('🎸')).toBeInTheDocument()
  })
})
