import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import App from './App'
import { supabase } from './lib/supabaseClient'

vi.mock('./lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
    },
  },
}))

const mockedGetSession = vi.mocked(supabase.auth.getSession)

describe('App', () => {
  beforeEach(() => {
    mockedGetSession.mockReset()
  })

  it('shows the login form when there is no session', async () => {
    mockedGetSession.mockResolvedValue({ data: { session: null } } as never)
    render(<App />)

    expect(await screen.findByRole('heading', { name: /sign in to famfin/i })).toBeInTheDocument()
  })

  it('shows the signed-in view when a session exists', async () => {
    mockedGetSession.mockResolvedValue({
      data: { session: { user: { email: 'a@b.com' } } },
    } as never)
    render(<App />)

    expect(await screen.findByText('Signed in as a@b.com')).toBeInTheDocument()
  })
})
