import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterChip, FilterChipDone } from '../../components/FilterChip'

describe('FilterChip', () => {
  it('shows its label and calls onToggle when tapped', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <FilterChip label="Any distance" isActive={false} isOpen={false} onToggle={onToggle}>
        <p>Panel content</p>
      </FilterChip>,
    )

    await user.click(screen.getByRole('button', { name: 'Any distance' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('renders its panel only while open, and marks the trigger expanded to match', () => {
    const { rerender } = render(
      <FilterChip label="Any distance" isActive={false} isOpen={false} onToggle={() => {}}>
        <p>Panel content</p>
      </FilterChip>,
    )

    expect(screen.getByRole('button', { name: 'Any distance' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument()

    rerender(
      <FilterChip label="Any distance" isActive={false} isOpen onToggle={() => {}}>
        <p>Panel content</p>
      </FilterChip>,
    )

    expect(screen.getByRole('button', { name: 'Any distance' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Panel content')).toBeInTheDocument()
  })

  it('marks the trigger is-active when the filter holds a non-default value', () => {
    render(
      <FilterChip label="Within 3 km" isActive isOpen={false} onToggle={() => {}}>
        <p>Panel content</p>
      </FilterChip>,
    )

    expect(screen.getByRole('button', { name: 'Within 3 km' })).toHaveClass('is-active')
  })
})

describe('FilterChipDone', () => {
  it('calls onClick when pressed', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<FilterChipDone onClick={onClick} />)

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
