import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { LoginForm } from './LoginForm'
import { signIn } from './api'

vi.mock('./api', () => ({
  signIn: vi.fn(),
}))

const mockedSignIn = vi.mocked(signIn)

describe('LoginForm', () => {
  beforeEach(() => {
    mockedSignIn.mockReset()
  })

  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    expect(mockedSignIn).not.toHaveBeenCalled()
  })

  it('shows an error for a malformed email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.type(screen.getByLabelText(/password/i), 'secret1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()
    expect(mockedSignIn).not.toHaveBeenCalled()
  })

  it('calls signIn with the entered credentials on valid submit', async () => {
    mockedSignIn.mockResolvedValueOnce({} as never)
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'secret1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith('a@b.com', 'secret1')
    })
  })

  it('shows an error message when sign in fails', async () => {
    mockedSignIn.mockRejectedValueOnce(new Error('Invalid login credentials'))
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
  })
})
