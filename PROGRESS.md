# Progress Tracker

## Current phase: 0 — Foundations
## Status: blocked (on user account creation — everything locally possible is done)

## Completed phases
- [ ] Phase 0 — Foundations  <-- YOU ARE HERE (local half done, cloud half needs the user)

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

## What's NOT done — needs the user, can't be done by an agent
These require interactive browser signup / entering personal credentials, which
is out of scope for an agent to do on someone's behalf:
1. Create a GitHub account (if not already have one) and push this repo to a
   new private repo.
2. Create a Supabase account → new project (region: Mumbai/ap-south-1 if
   offered) → note the Project URL and `anon` public key.
3. Run `npx supabase login` + `npx supabase link --project-ref <ref>` +
   `npx supabase db push` to apply `0001_init.sql` to the real hosted project.
4. In Supabase Dashboard → Authentication → Users → manually add 2-4 household
   user accounts (email + password), per master prompt §9 — no public signup.
5. Create a Vercel account → "Import Git Repository" → set
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in Vercel project env vars
   (copy from `.env.local.example`, filled with real values in a local
   `.env.local` — never commit that file) → confirm the live `*.vercel.app`
   URL loads the "Hello FamFin" page.
6. On a machine/network without the download restriction hit here: run
   `npx playwright install chromium` then `npm run test:e2e` to confirm the
   E2E smoke test actually passes (config is believed correct but unverified).

## Next concrete steps (in order)
1. User completes the 6 manual steps above; hand back Supabase project URL +
   anon key (or confirm `.env.local` is filled in) and the live Vercel URL.
2. Confirm login works for a seeded test user against the deployed app.
3. Confirm `npm run test:e2e` passes once Playwright browsers install
   successfully somewhere with normal network access.
4. Mark Phase 0 done, move to Phase 1 (Setup/master data CRUD UI).

## Known issues / decisions parked for later
- Family/Personal tag is a UI filter only, not an RLS boundary (see DECISIONS.md)
- `credit_cards.statement_day` is currently unused by any calculation — kept in
  schema for a possible future statement-cycle feature (see DECISIONS.md)
- Excel workbook (.xlsx) is gitignored — personal file, not app source (see DECISIONS.md)
- No real historical transactions exist to migrate (see DECISIONS.md) — Phase 2's
  CSV import still needs building per spec, just has no real backlog to test against yet

## Test status (last run: 2026-09-07)
- Unit tests (Vitest): 1/1 passing
- E2E (Playwright): NOT RUN — browser binary download blocked in this sandbox,
  see above
- Build (`npm run build`): passing
- Lint (`npm run lint`): passing
- npm audit: 0 vulnerabilities
