import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OptionGroup } from '../../components/OptionGroup'

describe('OptionGroup', () => {
  it('marks the selected option and calls onSelect with the pressed value', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <OptionGroup
        legend="Grid size"
        options={[
          { value: 2, label: '2 per row' },
          { value: 3, label: '3 per row' },
        ]}
        selected={2}
        onSelect={onSelect}
      />,
    )

    expect(screen.getByRole('button', { name: '2 per row' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '3 per row' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: '3 per row' }))
    expect(onSelect).toHaveBeenCalledWith(3)
  })
})
