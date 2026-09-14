import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
    })),
  },
}))

const mockedGetSession = vi.mocked(supabase.auth.getSession)

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )
}

describe('App', () => {
  beforeEach(() => {
    mockedGetSession.mockReset()
  })

  it('shows the login form when there is no session', async () => {
    mockedGetSession.mockResolvedValue({ data: { session: null } } as never)
    renderApp()

    expect(await screen.findByRole('heading', { name: /sign in to famfin/i })).toBeInTheDocument()
  })

  it('shows the signed-in view when a session exists', async () => {
    mockedGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1', email: 'a@b.com' } } },
    } as never)
    renderApp()

    expect(await screen.findByText(/signed in as a@b.com/i)).toBeInTheDocument()
  })
})
