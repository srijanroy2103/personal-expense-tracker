# File Manifest (update only the lines that changed)

src/App.tsx                               → Phase 0 placeholder "Hello FamFin" page
src/App.test.tsx                          → smoke test for App.tsx
src/main.tsx                              → React root mount, imports index.css
src/index.css                             → Tailwind directives
src/vite-env.d.ts                         → typed VITE_SUPABASE_* env vars
src/lib/supabaseClient.ts                 → Supabase client singleton, throws if env vars missing
src/test/setup.ts                         → Vitest + Testing Library jest-dom setup
e2e/smoke.spec.ts                         → Playwright smoke test, home page loads
supabase/migrations/0001_init.sql         → base schema (master prompt §4) + RLS + real Setup-sheet seed data
vite.config.ts                            → Vite + Vitest config (defineConfig from 'vitest/config' — required for type merge with pinned vite@7)
supabase/config.toml                      → local Supabase CLI config (generated via `npx supabase init`, no login needed)
playwright.config.ts                      → Playwright config, dev server on :5173
tailwind.config.js / postcss.config.js    → Tailwind setup
eslint.config.js                          → flat ESLint config (typescript-eslint + react-hooks)
.env.local.example                        → template for VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
CLAUDE.md / PROGRESS.md / DECISIONS.md / CALCULATIONS.md / DESIGN.md / MANIFEST.md → tracking docs, master prompt §6
