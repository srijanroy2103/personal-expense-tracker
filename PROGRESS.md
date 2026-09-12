# Progress Tracker

## Current phase: 0 — Foundations (auth UI slice added)
## Status: blocked (on user Supabase/Vercel account creation — everything locally possible is done)

## Completed phases
- [ ] Phase 0 — Foundations  <-- YOU ARE HERE (local half done incl. login UI, cloud half needs the user)

## What's done in the current phase
- git repo initialized at project root
- Vite + React 19 + TS scaffold in place (via `npm create vite@latest famfin -- --template react-ts`, moved into root)
- Tailwind CSS + PostCSS wired up (`tailwind.config.js`, `postcss.config.js`, `src/index.css`)
- ESLint flat config (typescript-eslint + react-hooks + react-refresh) + Prettier config
- Vitest configured (jsdom env, Testing Library, jest-dom) — `npm run test` passes (1/1)
- Playwright configured (`playwright.config.ts`, `e2e/smoke.spec.ts`) — **cannot verify**
  locally: `npx playwright install chromium` fails, outbound download to
  `cdn.playwright.dev` times out in this sandboxed environment. Config and spec
  are correct; run `npx playwright install chromium` then `npm run test:e2e`
  on a machine with normal internet access to confirm.
- `npm run build` passes (tsc + vite build, produces `dist/`)
- `npm run dev` verified serving "Hello FamFin" placeholder page on :5173
- `npm run lint` passes clean
- 0 npm audit vulnerabilities (had to bump `vitest` ^2→^3, `supabase` ^1→^2 off
  the initial scaffold's vulnerable transitive deps; also had to pin
  `vite` to ^7.3.6 and `@vitejs/plugin-react` to ^5 — vite 8 + plugin-react 6
  (npm's "latest" at scaffold time) have a real runtime incompatibility, see below)
- `supabase/migrations/0001_init.sql` written: full schema from master prompt §4,
  RLS policies (shared read, creator-or-admin write — see DECISIONS.md), and
  real seed data transcribed from the actual Excel Setup sheet (18 categories,
  48 subcategories, 5 payment methods, 5 accounts, 2 tags, 2 real credit cards)
- `npx supabase init` run locally — `supabase/config.toml` generated (no login needed)
- Tracking files created: CLAUDE.md, PROGRESS.md (this file), DECISIONS.md,
  CALCULATIONS.md, DESIGN.md, MANIFEST.md
- Read the actual Excel workbook directly (openpyxl) and confirmed:
  - Transactions sheet is an empty template — 0 real transaction rows exist
  - Found and corrected a real discrepancy: master prompt §5 calc #15 says the
    CC next-due-date formula branches on Statement Day; the live workbook
    formula actually branches on Due Day only and never references Statement
    Day. Implementing per the live formula. Full detail in CALCULATIONS.md and
    DECISIONS.md.
- GitHub repo confirmed pushed: `origin/main` (github.com/srijanroy2103/personal-expense-tracker)
  matches local `main` — Phase 0 manual step 1 is done.
- Built the login UI (the remaining Phase 0 piece — master prompt §7 Phase 0 DoD
  requires "login works for a seeded test user", no login screen existed yet):
  - `src/features/auth/schemas.ts` — Zod `loginSchema` (email format, password ≥6 chars)
  - `src/features/auth/api.ts` — `signIn`/`signOut` wrapping `supabase.auth`
  - `src/features/auth/authStore.ts` — zustand store (`session`, `initialized`, `init()`
    calls `getSession()` + subscribes via `onAuthStateChange`)
  - `src/features/auth/LoginForm.tsx` — react-hook-form + zodResolver form
  - `src/App.tsx` rewritten: loading → LoginForm (no session) → signed-in view
    (session present, shows email + Sign out button). Replaces the old
    "Hello FamFin" placeholder.
  - Added `@testing-library/user-event` as a new devDependency (needed for
    realistic form-fill/submit tests; wasn't installed before).
- Updated tests to match: `src/App.test.tsx`, plus new
  `src/features/auth/schemas.test.ts` and `src/features/auth/LoginForm.test.tsx`
  (all mock `supabaseClient`/`./api` at the module boundary — no real Supabase
  project needed to run them). `e2e/smoke.spec.ts` updated to check the login
  form renders and that invalid credentials show an error.
- Created a **local-only, gitignored** `.env.local` with placeholder Supabase
  values (`https://placeholder.supabase.co` + a fake anon key) purely so the
  dev server renders the login UI instead of crashing at import (`supabaseClient.ts`
  throws by design if env vars are missing — see MANIFEST.md). This is NOT a
  real backend — submitting the login form will fail against the fake project.
  Replace with real values once step 2 below is done; never commit this file.

## What's NOT done — needs the user, can't be done by an agent
GitHub (step 1) is confirmed done — repo is pushed, `origin/main` matches local.
Steps 1-4 below are now DONE (2026-09-12). Remaining: step 5 (Vercel) and
step 6 (Playwright, blocked on network, see Known issues).

1. ✅ Supabase project created (region ap-south-1), ref `wveaaarsmeacivpwgdxq`.
2. ✅ `npx supabase login` (via personal access token — browser OAuth flow
   doesn't work in a non-TTY shell, see Known issues) → `link` → `db push`
   applied `0001_init.sql` to the live project.
3. ✅ Household user account(s) added in Supabase Dashboard → Authentication →
   Users (with "Auto confirm user" ticked, so login works without email
   sending, which isn't set up).
4. ✅ Real `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are in `.env.local`.
   **Login confirmed working against the live project with a real seeded
   user** — closes Phase 0 DoD "login works for a seeded test user".
5. ⬜ Create a Vercel account → "Import Git Repository" → set the same two env
   vars in Vercel project settings, **for all three scopes (Production,
   Preview, Development)** — not just Production, or preview deploys will
   crash at import → confirm the live `*.vercel.app` URL loads and logs in.
6. ⬜ On a machine/network without the download restriction hit here: run
   `npx playwright install chromium` then `npm run test:e2e` to confirm the
   E2E smoke test actually passes (config/spec believed correct but unverified).

## Next concrete steps (in order)
1. User completes Vercel deploy (step 5 above); hand back the live URL and
   confirm login works there too.
2. Confirm `npm run test:e2e` passes once Playwright browsers install
   successfully somewhere with normal network access (or resolve the
   storage.googleapis.com hang noted below).
3. Mark Phase 0 done, move to Phase 1 (Setup/master data CRUD UI: Categories,
   Sub-categories, Payment Methods, Accounts, Tags, Credit Cards — master
   prompt §7). Likely a shared generic list+form component for the five
   simple name-based lookup tables, plus a dedicated form for Credit Cards
   (more fields). Needs `QueryClientProvider` (react-query) wired into
   `main.tsx` — not yet done, deliberately deferred (no speculative setup).
4. Reminder: revoke the Supabase personal access token used for steps 2-3
   above (https://supabase.com/dashboard/account/tokens) — its job (schema
   push) is done; a fresh one costs nothing to generate for a future migration.

## Known issues / decisions parked for later
- `@supabase/supabase-js` installed (2026-09-12) — was referenced by
  `src/features/auth/api.ts`/`supabaseClient.ts` but not yet in package.json.
- This machine's network runs a Cloudflare Zero Trust Gateway (TLS inspection).
  Fixed permanently via `NODE_EXTRA_CA_CERTS` user env var pointing to
  `~/.certs/cloudflare-gateway-ca.pem` (exported from Windows cert store) —
  needed for ANY node/npm HTTPS download on this machine, not just Playwright.
- Playwright chromium install still fails past the cert fix: download hangs
  on `storage.googleapis.com` (redirect target of cdn.playwright.dev), times
  out at 30s even with cert trusted. Not yet root-caused — likely the same
  gateway throttling/inspecting large binary transfers. Try on a different
  network (e.g. phone hotspot) rather than debugging further here.
- `npx supabase login`'s browser OAuth flow needs a real TTY — fails in a
  non-interactive shell with `LegacyLoginMissingTokenError`. Use
  `supabase login --token <PAT>` instead.
- Supabase's fine-grained personal-access-token permission model requires ALL
  FOUR of these scopes for `link`+`db push` to work (found by trial and
  error — Supabase's own errors don't name the missing scope clearly):
  Migrations (Read and write), Projects account-wide (Read-only), Project
  Settings (Read-only), Organization Projects (Read-only). Missing any one
  gives an opaque "does not have necessary privileges" or "Unauthorized"
  error with no indication which scope is missing.
- Family/Personal tag is a UI filter only, not an RLS boundary (see DECISIONS.md)
- `credit_cards.statement_day` is currently unused by any calculation — kept in
  schema for a possible future statement-cycle feature (see DECISIONS.md)
- Excel workbook (.xlsx) is gitignored — personal file, not app source (see DECISIONS.md)
- No real historical transactions exist to migrate (see DECISIONS.md) — Phase 2's
  CSV import still needs building per spec, just has no real backlog to test against yet
- npm audit now shows 2 moderate vulnerabilities (`@vitest/mocker` path-traversal
  advisory GHSA-82fw-gwwq-j7x9, dev-only test tooling, not shipped to
  production/Vercel). Fix requires vitest 5 (breaking change, package.json pins
  `^3`). Not fixed now per DECISIONS.md's "don't preemptively upgrade" precedent
  — revisit if it blocks something real.
- `.env.local` currently holds placeholder values for local UI preview only
  (see above) — login will not actually authenticate until real Supabase
  credentials replace it.
- Backlog note (not acted on, logged per context-discipline rule): App.tsx's
  signed-in view is a bare placeholder ("Signed in as {email}" + Sign out) —
  real nav/shell arrives naturally with Phase 1 UI, not built speculatively now.

## Test status (last run: 2026-09-09)
- Unit tests (Vitest): 10/10 passing (4 auth schema, 4 LoginForm, 2 App)
- E2E (Playwright): NOT RUN — browser binary download blocked in this sandbox
  (unchanged from Phase 0), AND now also needs real Supabase credentials in
  `.env.local` since the app no longer renders without them
- Build (`npm run build`): passing
- Lint (`npm run lint`): passing
- npm audit: 2 moderate (dev-only, see above)
