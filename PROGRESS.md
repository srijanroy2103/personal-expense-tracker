# Progress Tracker

## Current phase: 1 — Setup / master data management (built, tests passing)
## Status: blocked only on user steps (Vercel deploy, Playwright browser install on unrestricted network)

## Completed phases
- [ ] Phase 0 — Foundations (local half done incl. login UI; cloud half done except Vercel — step 5 below)
- [ ] Phase 1 — Setup / master data management  <-- YOU ARE HERE (built + unit-tested; E2E unverified, same Playwright blocker as Phase 0)

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
2. Confirm `npm run test:e2e` passes (both `smoke.spec.ts` and the new
   `categories.spec.ts`, the latter needs `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD`
   env vars for a real seeded user) once Playwright browsers install
   successfully somewhere with normal network access (or resolve the
   storage.googleapis.com hang noted below).
3. Manually click through the Setup UI once in a real browser against the
   live Supabase project (add/edit/delete one row in each of the 6 tabs) —
   not yet done interactively, only build/lint/unit-test verified this
   session. Confirms Phase 1 DoD ("all master lists manageable from UI,
   changes reflected instantly") end-to-end.
4. Once 1-3 above are confirmed, mark Phase 0 AND Phase 1 done, move to
   Phase 2 (Transactions — master prompt §7): transaction list
   (paginated/virtualized), create/edit/delete form with conditional
   credit-card field, CSV bulk import from the Excel `Transactions` sheet
   layout.
5. Reminder: revoke the Supabase personal access token used for Phase 0 steps
   2-3 (https://supabase.com/dashboard/account/tokens) — its job (schema
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
  RESOLVED in Phase 1: signed-in view now has a real tab nav (Setup section).
- No Google/OAuth sign-in: never in scope. Master prompt §7 Phase 0 specifies
  "Supabase Auth: email/password, manually create 2-4 user accounts (no public
  signup UI)" — deliberate, not a gap, for a private 2-4 person household app.
- **Phase 1 built (this session):**
  - `QueryClientProvider` wired into `main.tsx` (`src/lib/queryClient.ts`) —
    closes the "not yet done" note from Phase 0.
  - `src/features/lookups/` — generic CRUD slice for the 5 simple lookup
    tables (categories, subcategories, payment_methods, accounts, tags):
    `types.ts`, `schemas.ts` (zod: `categorySchema`, `subcategorySchema`,
    `simpleNameSchema`), `api.ts` (generic list/create/update/delete against
    any of the 5 tables + `friendlyLookupError` mapping Postgres 23505 →
    "That name already exists"), `useLookupTable.ts` (react-query hooks),
    `LookupManager.tsx` (one generic list+form component, config-driven via a
    `fields` prop so it handles categories' extra `type`/`sort_order` fields
    too), `configuredManagers.tsx` (5 thin pre-configured exports).
  - `src/features/creditCards/` — dedicated feature (more fields, per master
    prompt): `schemas.ts` (zod `creditCardSchema`, validates statement_day/
    due_day 1-31, non-negative amounts), `api.ts`, `useCreditCards.ts`,
    `CreditCardsManager.tsx` (own form + list, `created_by` set from the
    logged-in session per the RLS policy in `0001_init.sql`).
  - `App.tsx` rewritten: signed-in view now has a tab bar (Categories /
    Sub-categories / Payment methods / Accounts / Tags / Credit cards) instead
    of the bare placeholder. No router added — plain `useState` tab switch;
    a real router can come in a later phase once there are true multi-page
    routes (Transactions/Dashboard/Reports), not needed yet.
  - `src/index.css` — added one `.input` component class (`@layer components`)
    reused by CreditCardsManager's 8 fields; still explicitly NOT a design
    decision (DESIGN.md's Phase 5.5 pass still pending, unaffected).
  - Tests added: `src/features/lookups/schemas.test.ts` (9),
    `src/features/creditCards/schemas.test.ts` (7). Updated
    `src/App.test.tsx` to wrap render in a real `QueryClientProvider` (App now
    renders query-backed children when signed in) and mock `supabase.from()`.
  - `e2e/categories.spec.ts` added per master prompt §7 Phase 1 test
    requirement (create/edit/delete a category). Gated on
    `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` env vars (not committed — real
    seeded-user credentials) via `test.skip`; runs against the live Supabase
    backend when provided. **Unverified** — same Playwright-install network
    blocker as the existing `smoke.spec.ts` (see Known issues).
  - Verified: `npm run test` 26/26 passing, `npm run lint` clean, `npm run
    build` passing (one pre-existing-pattern chunk-size warning, 553kB single
    bundle — not worth code-splitting for a 2-4 user app, not acted on).
    `npm run dev` confirmed serving without a crash (curl check; full
    in-browser click-through not done — no Playwright/browser available here).

## Test status (last run: 2026-09-12)
- Unit tests (Vitest): 26/26 passing (4 auth schema, 4 LoginForm, 2 App,
  9 lookups schema, 7 credit card schema)
- E2E (Playwright): NOT RUN — browser binary download blocked in this sandbox
  (unchanged from Phase 0), AND `categories.spec.ts` additionally needs
  `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` env vars (skips cleanly without them)
- Build (`npm run build`): passing
- Lint (`npm run lint`): passing
- npm audit: 2 moderate (dev-only, see above)
