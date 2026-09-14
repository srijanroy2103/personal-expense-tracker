import { useEffect, useState } from 'react'
import { useAuthStore } from './features/auth/authStore'
import { LoginForm } from './features/auth/LoginForm'
import { signOut } from './features/auth/api'
import {
  AccountsManager,
  CategoriesManager,
  PaymentMethodsManager,
  SubcategoriesManager,
  TagsManager,
} from './features/lookups/configuredManagers'
import { CreditCardsManager } from './features/creditCards/CreditCardsManager'

const SETUP_TABS = [
  { key: 'categories', label: 'Categories', Component: CategoriesManager },
  { key: 'subcategories', label: 'Sub-categories', Component: SubcategoriesManager },
  { key: 'payment_methods', label: 'Payment methods', Component: PaymentMethodsManager },
  { key: 'accounts', label: 'Accounts', Component: AccountsManager },
  { key: 'tags', label: 'Tags', Component: TagsManager },
  { key: 'credit_cards', label: 'Credit cards', Component: CreditCardsManager },
] as const

function App() {
  const { session, initialized, init } = useAuthStore()
  const [activeTab, setActiveTab] = useState<(typeof SETUP_TABS)[number]['key']>('categories')

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

  const ActiveComponent = SETUP_TABS.find((tab) => tab.key === activeTab)!.Component

  return (
    <main className="min-h-screen bg-stone-950 text-stone-50">
      <header className="flex items-center justify-between border-b border-stone-800 px-6 py-4">
        <p className="text-sm text-stone-400">Signed in as {session.user.email}</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded border border-stone-700 px-3 py-2 text-sm"
        >
          Sign out
        </button>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-stone-800 px-6 py-3">
        {SETUP_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-current={activeTab === tab.key}
            className={
              activeTab === tab.key
                ? 'rounded bg-stone-50 px-3 py-1.5 text-sm font-medium text-stone-950'
                : 'rounded border border-stone-700 px-3 py-1.5 text-sm'
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="px-6 py-6">
        <ActiveComponent />
      </div>
    </main>
  )
}

export default App
