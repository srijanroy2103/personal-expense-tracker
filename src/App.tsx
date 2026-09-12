import { useEffect } from 'react'
import { useAuthStore } from './features/auth/authStore'
import { LoginForm } from './features/auth/LoginForm'
import { signOut } from './features/auth/api'

function App() {
  const { session, initialized, init } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  if (!initialized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-50">
        <p className="text-sm text-stone-400">Loading…</p>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-50">
        <LoginForm />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-950 text-stone-50">
      <p>Signed in as {session.user.email}</p>
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded border border-stone-700 px-3 py-2 text-sm"
      >
        Sign out
      </button>
    </main>
  )
}

export default App
