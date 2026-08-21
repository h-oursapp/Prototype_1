import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimeScrollPicker } from '../../components/TimeScrollPicker'

describe('TimeScrollPicker', () => {
  it('marks the current hours value as selected', () => {
    render(<TimeScrollPicker hours={3} maxHours={12} onChangeHours={vi.fn()} onRemove={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: '3 hours' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: '5 hours' })).not.toHaveAttribute('aria-current')
  })

  it('reports a new value when a row is tapped directly', async () => {
    const user = userEvent.setup()
    const onChangeHours = vi.fn()
    render(
      <TimeScrollPicker hours={3} maxHours={12} onChangeHours={onChangeHours} onRemove={vi.fn()} onClose={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: '7 hours' }))

    expect(onChangeHours).toHaveBeenCalledWith(7)
  })

  it('never offers more hours than maxHours allows', () => {
    render(<TimeScrollPicker hours={3} maxHours={5} onChangeHours={vi.fn()} onRemove={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: '5 hours' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '6 hours' })).toBeNull()
  })

  it('reports the nearest row once a scroll settles, same math a tap would use', () => {
    const onChangeHours = vi.fn()
    render(
      <TimeScrollPicker hours={0} maxHours={12} onChangeHours={onChangeHours} onRemove={vi.fn()} onClose={vi.fn()} />,
    )

    const hoursList = screen.getByRole('group', { name: 'Hours' }).querySelector('.time-scroll-picker__list')
    if (!hoursList) throw new Error('hours list not found')
    // 28px per row (TimeScrollPicker.css) — scrolling 4 rows down should read as "4 hours".
    Object.defineProperty(hoursList, 'scrollTop', { value: 4 * 28, writable: true })
    fireEvent.scroll(hoursList)

    expect(onChangeHours).toHaveBeenCalledWith(4)
  })

  it('keeps the minutes column local — it never reports out through onChangeHours', async () => {
    const user = userEvent.setup()
    const onChangeHours = vi.fn()
    render(
      <TimeScrollPicker hours={3} maxHours={12} onChangeHours={onChangeHours} onRemove={vi.fn()} onClose={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: '15 minutes' }))

    expect(screen.getByRole('button', { name: '15 minutes' })).toHaveAttribute('aria-current', 'true')
    expect(onChangeHours).not.toHaveBeenCalled()
  })

  it('calls onRemove and onClose from their own buttons', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const onClose = vi.fn()
    render(<TimeScrollPicker hours={3} maxHours={12} onChangeHours={vi.fn()} onRemove={onRemove} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onRemove).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
