import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../../pages/LoginPage'

describe('LoginPage', () => {
  it('calls onLogin when the log in button is pressed', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    render(<LoginPage onLogin={onLogin} />)

    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(onLogin).toHaveBeenCalledTimes(1)
  })
})
