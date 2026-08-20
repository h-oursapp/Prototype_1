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

  it('also works with plain boolean options (TODO #9\'s "inventory scrollable: yes / no")', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <OptionGroup
        legend="Inventory scrollable"
        options={[
          { value: false, label: 'No' },
          { value: true, label: 'Yes' },
        ]}
        selected={false}
        onSelect={onSelect}
      />,
    )

    expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Yes' }))
    expect(onSelect).toHaveBeenCalledWith(true)
  })
})
