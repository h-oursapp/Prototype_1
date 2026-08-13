import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SwipeUpHint } from './SwipeUpHint'

describe('SwipeUpHint', () => {
  it('triggers on an upward pointer drag past the threshold', () => {
    const onTrigger = vi.fn()
    render(<SwipeUpHint onTrigger={onTrigger} />)
    const hint = screen.getByRole('button', { name: 'Open Wallet' })

    fireEvent.pointerDown(hint, { clientY: 300 })
    fireEvent.pointerUp(hint, { clientY: 250 })

    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('does not trigger on a small drag under the threshold', () => {
    const onTrigger = vi.fn()
    render(<SwipeUpHint onTrigger={onTrigger} />)
    const hint = screen.getByRole('button', { name: 'Open Wallet' })

    fireEvent.pointerDown(hint, { clientY: 300 })
    fireEvent.pointerUp(hint, { clientY: 290 })

    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('also triggers on a plain tap, as a fallback for non-swipe input', async () => {
    const user = userEvent.setup()
    const onTrigger = vi.fn()
    render(<SwipeUpHint onTrigger={onTrigger} />)

    await user.click(screen.getByRole('button', { name: 'Open Wallet' }))
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })
})
