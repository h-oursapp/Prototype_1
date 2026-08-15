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

  // TODO #1: the fields exist so the screen reads like a real login, with no account system
  // behind them yet — this just confirms they're present and typeable, not that they do anything.
  it('renders email and password fields you can type into', async () => {
    const user = userEvent.setup()
    render(<LoginPage onLogin={vi.fn()} />)

    const email = screen.getByLabelText('Email')
    const password = screen.getByLabelText('Password')

    await user.type(email, 'mark@example.com')
    await user.type(password, 'hunter2')

    expect(email).toHaveValue('mark@example.com')
    expect(password).toHaveValue('hunter2')
  })

  it('logs in on button press even with the fields left empty', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    render(<LoginPage onLogin={onLogin} />)

    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(onLogin).toHaveBeenCalledTimes(1)
  })
})
