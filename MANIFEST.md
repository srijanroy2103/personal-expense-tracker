# File Manifest (update only the lines that changed)

src/App.tsx                               → root: shows loading/LoginForm/signed-in view based on authStore session
src/App.test.tsx                          → RTL tests for App's auth-state branching (mocks supabaseClient)
src/main.tsx                              → React root mount, imports index.css
src/index.css                             → Tailwind directives
src/vite-env.d.ts                         → typed VITE_SUPABASE_* env vars
src/lib/supabaseClient.ts                 → Supabase client singleton, throws if env vars missing
src/test/setup.ts                         → Vitest + Testing Library jest-dom setup
src/features/auth/schemas.ts              → Zod loginSchema (email + password, min 6 chars)
src/features/auth/schemas.test.ts         → unit tests for loginSchema
src/features/auth/api.ts                  → signIn/signOut wrapping supabase.auth
src/features/auth/authStore.ts            → zustand store: session, initialized, init() subscribes to auth state
src/features/auth/LoginForm.tsx           → RHF+Zod login form, calls api.signIn
src/features/auth/LoginForm.test.tsx      → RTL tests: validation, submit, error states (mocks ./api)
e2e/smoke.spec.ts                         → Playwright: login form renders; invalid creds show an error
supabase/migrations/0001_init.sql         → base schema (master prompt §4) + RLS + real Setup-sheet seed data
vite.config.ts                            → Vite + Vitest config (defineConfig from 'vitest/config' — required for type merge with pinned vite@7)
supabase/config.toml                      → local Supabase CLI config (generated via `npx supabase init`, no login needed)
playwright.config.ts                      → Playwright config, dev server on :5173
tailwind.config.js / postcss.config.js    → Tailwind setup
eslint.config.js                          → flat ESLint config (typescript-eslint + react-hooks)
.env.local.example                        → template for VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
CLAUDE.md / PROGRESS.md / DECISIONS.md / CALCULATIONS.md / DESIGN.md / MANIFEST.md → tracking docs, master prompt §6
