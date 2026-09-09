# FamFin — Zero-Cost Family & Personal Expense Tracker Web App
### Master Build Prompt for Claude Code (self-sustaining, phase-wise, token-efficient)

> **How to use this file:** Paste the "SYSTEM PROMPT FOR CLAUDE CODE" section (or point Claude Code at this file: `claude "Read CLAUDE_CODE_MASTER_PROMPT.md and start Phase 0"`) at the start of your **first** Claude Code session. From then on, every new session should start with the short **"Session Bootstrap"** prompt near the bottom — not this whole file. That's what keeps token usage low across sessions.

---

## 1. What you're building

A private, multi-user web app that replaces the `Family_Personal_Expense_Tracker.xlsx` workbook with the same data model and calculations, but as a live website with a direct URL, a genuinely distinctive UI, and zero recurring hosting cost.

Source-of-truth data model (already reverse-engineered from your Excel file):
- **Setup/master lists**: Categories (with Income/Expense type), Sub-categories, Payment Methods, Family/Personal tags, Accounts, Transaction Types
- **Transactions**: date, description, type, payment method, account, credit card (if applicable), category, sub-category, family/personal tag, amount, notes
- **Credit Cards**: card master (limit, statement day, due day, opening balance) + payments log + auto-calculated outstanding balance, utilization %, next due date
- **Reports**: Dashboard (filterable KPIs + charts), Monthly Report, Yearly Report, Category Report, Family vs Personal Report, Credit Card Report, Cash Flow Report (with running/cumulative balance)

This is a **full-stack CRUD + analytics app**, not a static site — treat it accordingly.

---

## 2. Non-negotiable constraints

| Constraint | Decision |
|---|---|
| **Cost** | ₹0 / $0 forever on free tiers, for this scale of usage |
| **Users** | 2–4 named users, private (not public signup) |
| **Access** | One direct HTTPS URL, no VPN/local-network requirement |
| **UI** | Must NOT look like a generic AI-generated dashboard template. No default shadcn purple gradients, no generic "SaaS landing page" look. Distinctive type, deliberate color system, real design decisions. |
| **Data integrity** | Every calculation must match the Excel logic exactly (see §5) and be unit-tested |
| **Token efficiency** | Future Claude Code sessions must NOT need to re-read the whole codebase to continue work (see §6) |

---

## 3. Architecture (zero-cost, justified)

```
┌─────────────────────┐       ┌──────────────────────────┐
│  React + Vite + TS   │──────▶│  Supabase (free tier)     │
│  Tailwind CSS         │      │  - Postgres DB            │
│  Recharts (charts)    │      │  - Auth (email/password)  │
│  TanStack Query       │      │  - Row Level Security     │
│  React Hook Form+Zod  │      │  - Edge Functions (Deno)  │
│  Zustand (UI state)   │      │  - Storage (receipts)     │
└─────────┬────────────┘       └──────────────────────────┘
          │  deployed to
          ▼
   Vercel (free Hobby tier) → https://<project>.vercel.app
```

**Why this stack, specifically:**
- **No server to keep alive.** A Node/Express backend on Render/Railway free tiers sleeps and cold-starts badly, or requires a card. Supabase gives you a hosted Postgres + auto-generated REST/RPC API + Auth + RLS with no server you manage — this is the single biggest cost/complexity killer for a 2–4 user app.
- **Postgres, not Firestore.** Your calculations are inherently relational aggregation (SUMIFS-style group-bys across dimensions). SQL views and RPC functions map 1:1 to the Excel formulas and are trivially unit-testable. Firestore would force you to denormalize and hand-roll aggregation logic in JS.
- **Row Level Security (RLS)** replaces "who can see what" logic that would otherwise live in a backend — perfect for a small trusted household of 2–4 users where you still want family vs personal visibility rules.
- **Vercel free Hobby tier** gives a direct `*.vercel.app` HTTPS URL with zero config, auto-deploys from GitHub on every push, and is explicitly fine for personal/non-commercial projects.
- **Recharts** over Chart.js/D3 because it's React-native (no imperative DOM wrangling), has good defaults, and is easy to restyle away from "generic AI dashboard" look with custom shapes/tooltips.

**Known free-tier caveats (must be documented for the user, not hidden):**
1. Supabase free projects **pause after 7 days of no API activity**. Mitigation: a GitHub Actions cron job (also free) that pings a lightweight `SELECT 1` endpoint every 5 days.
2. Supabase free tier: 500MB DB storage, 5GB bandwidth/month, 50k monthly active users — all wildly more than 2–4 personal users will ever use.
3. Vercel Hobby tier is licensed for personal/non-commercial use — appropriate here.
4. No custom domain needed to satisfy "direct link" requirement, but one can be added later for ~$0 using Vercel + a free subdomain provider if desired (optional, not in scope).

---

## 4. Data model (Postgres schema — Phase 0 deliverable)

```sql
-- ============ ENUM-LIKE LOOKUP TABLES (mirrors "Setup" sheet) ============
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('Income','Expense')),
  sort_order int default 0
);

create table subcategories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int default 0
);

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table tags ( -- Family / Personal, extensible later
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- ============ USERS ============
-- Supabase auth.users is the source of truth for login;
-- this table holds app-level profile info.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  color text,              -- for per-user color coding in UI/charts
  created_at timestamptz default now()
);

-- ============ CREDIT CARDS ============
create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  card_name text not null,
  bank text,
  network text,
  credit_limit numeric(12,2) not null default 0,
  statement_day int not null check (statement_day between 1 and 31),
  due_day int not null check (due_day between 1 and 31),
  opening_balance numeric(12,2) not null default 0,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table credit_card_payments (
  id uuid primary key default gen_random_uuid(),
  credit_card_id uuid not null references credit_cards(id) on delete cascade,
  payment_date date not null,
  amount numeric(12,2) not null,
  paid_by uuid references profiles(id),
  notes text
);

-- ============ TRANSACTIONS (the "single source of truth") ============
create table transactions (
  id uuid primary key default gen_random_uuid(),
  txn_date date not null,
  description text,
  type text not null check (type in ('Income','Expense')),
  payment_method_id uuid references payment_methods(id),
  account_id uuid references accounts(id),
  credit_card_id uuid references credit_cards(id), -- nullable, only if payment_method = Credit Card
  category_id uuid not null references categories(id),
  subcategory_id uuid references subcategories(id),
  tag_id uuid not null references tags(id), -- Family / Personal
  amount numeric(12,2) not null check (amount > 0),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_txn_date on transactions(txn_date);
create index idx_txn_category on transactions(category_id);
create index idx_txn_tag on transactions(tag_id);
create index idx_txn_created_by on transactions(created_by);
```

**RLS policy pattern** (apply per table): all 2–4 authenticated household members can `select` everything (shared household ledger), but only the row's `created_by` (or an "admin" role in `profiles`) can `update`/`delete` it. Family/Personal tag controls a *UI filter*, not row-level access — everyone sees everything, matching the Excel workbook's behavior. Document this assumption explicitly in `PROGRESS.md` since it's a product decision, not just a technical one.

---

## 5. Calculation spec — exact formulas to implement and test

Every formula below must exist as a **pure, unit-tested function or a Postgres SQL view/function** (prefer SQL views for anything aggregating across transactions — same reasoning as the Excel SUMIFS approach, just in the DB instead of the sheet).

| # | Metric | Formula | Excel equivalent |
|---|---|---|---|
| 1 | Signed amount | `type = 'Income' ? amount : -amount` | `SignedAmount` column |
| 2 | Monthly income | `SUM(amount) WHERE type='Income' AND year=Y AND month=M` | Monthly_Report col D |
| 3 | Monthly expense | `SUM(amount) WHERE type='Expense' AND year=Y AND month=M` | Monthly_Report col E |
| 4 | Net savings | `income - expense` | Monthly_Report col F |
| 5 | Savings rate | `income = 0 ? null : net_savings / income` | Monthly_Report col G |
| 6 | Family expense | `SUM(amount) WHERE type='Expense' AND tag='Family'` | Monthly_Report col H |
| 7 | Personal expense | `SUM(amount) WHERE type='Expense' AND tag='Personal'` | Monthly_Report col I |
| 8 | Credit card expense | `SUM(amount) WHERE type='Expense' AND payment_method='Credit Card'` | Monthly_Report col J |
| 9 | Category breakdown | `SUM(amount) GROUP BY category_id WHERE type='Expense' [+ filters]` | Category_Report / Dashboard |
| 10 | CC total spend (all-time) | `SUM(amount) WHERE payment_method='Credit Card' AND credit_card_id=X AND type='Expense'` | CreditCards col D |
| 11 | CC this-month spend | same as #10 + `year=current_year AND month=current_month` | CreditCards col E |
| 12 | CC payments made | `SUM(amount) FROM credit_card_payments WHERE credit_card_id=X` | CreditCards col F |
| 13 | CC outstanding balance | `opening_balance + total_spend_all_time - payments_made` | CreditCards col G |
| 14 | CC utilization % | `credit_limit = 0 ? null : outstanding / credit_limit` | CreditCards col H |
| 15 | CC next due date | if `day_of_month(today) > due_day`: due date is `due_day` of *next* month, else due date is `due_day` of *this* month (statement-cycle-aware; replicate the `EDATE` logic exactly — see note below) | CreditCards col I |
| 16 | CC days to due | `next_due_date - today` | CreditCards col J |
| 17 | Cash flow (per month) | inflow = monthly income, outflow = monthly expense, net = inflow - outflow | CashFlow_Report cols B–D |
| 18 | Cumulative balance | `running SUM(net_cash_flow)` ordered by month, from the first recorded month onward | CashFlow_Report col E |
| 19 | Avg monthly expense | `total_expense_in_filtered_range / count_of_months_with_any_income_or_expense` | Dashboard H13 |

> **Note on #15:** the Excel formula uses the statement day, not just the due day, to decide whether you've already passed this cycle's due date (`EDATE(...,IF(DAY(TODAY())>StatementDay,1,0))+DueDay-1`). Preserve that exact branching — a naive "next occurrence of due_day" implementation gives wrong answers right after the statement date but before the due date.

**Testing requirement:** for every row in the table above, write a unit test with at least 3 cases: (a) normal case with real numbers, (b) zero-division / empty-data edge case, (c) a case using known values you can hand-verify against the actual Excel file's current output (spot-check 3–5 real rows from your uploaded workbook once at Phase 2 to create a fixture file — this becomes your regression baseline).

---

## 6. Token-efficient session continuity system

This is as important as the code itself. Claude Code should never need to re-read the whole repo to know what to do next.

### Files to create at Phase 0 and maintain forever after:

**`CLAUDE.md`** (Claude Code auto-loads this every session — keep it short and stable)
```markdown
# FamFin — Project Memory (read this first, every session)

## What this is
Zero-cost family/personal expense tracker. React+Vite+TS frontend on Vercel,
Supabase (Postgres+Auth+RLS) backend. 2-4 private users.

## Current state
See PROGRESS.md for the single source of truth on what's done, what's next,
and known issues. DO NOT re-scan the full codebase — PROGRESS.md is authoritative.

## Non-negotiables
- Zero recurring cost. Never add a paid service or a service requiring a card.
- UI must not look like a generic AI dashboard. Check DESIGN.md before styling.
- Every calculation in CALCULATIONS.md must have a passing unit test before
  it's considered done.
- After finishing any task, update PROGRESS.md before ending the session.

## Where things live
- /src/lib/calculations/  → pure calc functions + their unit tests
- /supabase/migrations/   → schema, one file per migration, numbered
- /supabase/functions/    → edge functions (if any)
- /src/features/<name>/   → feature-sliced UI (components+hooks+api per feature)
- DESIGN.md               → design tokens, do-not-do list, reference screenshots
- CALCULATIONS.md         → formula spec + test fixture values (source: this file §5)

## Which Claude model to use
- **Default driver for all phases: Claude Sonnet.** Best balance of coding
  strength and cost/speed for sustained multi-file, multi-session work.
- **Escalate to Claude Opus only when stuck** — e.g. an RLS policy interaction,
  the statement-day/due-day due-date math, or any bug that survives 2+ Sonnet
  attempts. Switch back to Sonnet once that specific problem is resolved.
- **Haiku only for trivial, fully-specified mechanical edits** (e.g. rename a
  class across files) where there is zero design or logic judgment involved.
- Do not escalate model tier as a first resort — try Sonnet with a clearly
  scoped task first; most failures are scope/context problems, not capability
  problems (see "Context discipline" below).

## Context discipline (read before doing anything else)
- Read CLAUDE.md + PROGRESS.md. That's it. Do not open files "just to check."
- If PROGRESS.md's next step names specific files, open only those files.
- Never re-read a file you already have open/quoted earlier in this same
  session — trust what you already read unless you just edited it.
- Never re-derive a decision that's already recorded in DECISIONS.md — cite
  it and move on.
- Never re-verify a calculation that CALCULATIONS.md already marks as
  test-covered and passing — only touch it if you're changing its logic.
- Keep a running task confined to one phase/one feature slice at a time.
  Do not "while I'm in here" refactor unrelated code — log any temptation to
  do so as a backlog note in PROGRESS.md instead of acting on it.
- Prefer targeted diffs (str_replace-style edits) over rewriting whole files.
- Before ending a session, write PROGRESS.md densely but tersely — bullet
  facts, not narrative prose. The next session pays token cost to read it.
```

**`PROGRESS.md`** (the real state file — update after every meaningful change)
```markdown
# Progress Tracker

## Current phase: <N — name>
## Status: <in-progress|blocked|done>

## Completed phases
- [x] Phase 0 — Foundations (2026-XX-XX)
- [x] Phase 1 — Setup/master data (2026-XX-XX)
- [ ] Phase 2 — Transactions CRUD  <-- YOU ARE HERE

## What's done in the current phase
- Transaction table schema + RLS: DONE, migration 0004
- Transaction list UI: DONE
- Transaction create form: IN PROGRESS — validation for credit-card-required-fields not done yet

## Next concrete steps (in order)
1. Finish conditional validation: credit_card_id required when payment_method = 'Credit Card'
2. Add edit + delete flows
3. Write unit tests for transaction form validation
4. Run Phase 2 test suite (see TESTING.md §Phase 2) before marking phase done

## Known issues / decisions parked for later
- Family/Personal tag is a UI filter only, not an RLS boundary (decided Phase 0, see CLAUDE.md)

## Test status (last run: 2026-XX-XX)
- Unit tests: 42/42 passing
- E2E (Phase 0-1 scope): 8/8 passing
```

**`DECISIONS.md`** — append-only log of "why", so nobody re-litigates settled questions (e.g. "why Supabase not Firebase", "why family/personal isn't an access boundary").

**`CALCULATIONS.md`** — copy of §5's table plus the real fixture numbers pulled from the Excel file, so tests have ground truth without re-deriving it.

**`DESIGN.md`** — the design system: color palette (with hex values), type scale, spacing scale, a written "do NOT do" list (e.g. "no purple-to-blue gradient hero", "no generic card-with-shadow grid", "no default shadcn indigo"), and 2–3 sentences of visual direction (see §7 Phase 5.5).

**`MANIFEST.md`** — a one-line-per-file index, so Claude never needs to `glob`/explore the tree to find where something lives. Regenerate only the affected lines when files are added/moved — don't regenerate the whole thing each session.
```markdown
# File Manifest (update only the lines that changed)

src/lib/calculations/savingsRate.ts       → calc #5, tested in savingsRate.test.ts
src/lib/calculations/creditCard.ts        → calcs #10-16, tested in creditCard.test.ts
src/features/transactions/TransactionForm.tsx → create/edit form, conditional CC field
src/features/dashboard/Dashboard.tsx      → KPI cards + filter bar
supabase/migrations/0001_init.sql         → base schema (§4)
supabase/migrations/0004_transactions.sql → transactions table + RLS
```

### Session bootstrap protocol (put this at the top of your mind every new session)
1. Read `CLAUDE.md` (auto-loaded) + `PROGRESS.md` only.
2. Do **not** grep/read the full `/src` tree unless `PROGRESS.md` explicitly points at a file for the current task — check `MANIFEST.md` first instead of exploring.
3. Do the next concrete step listed in `PROGRESS.md`.
4. Run **only the test file(s) relevant to what you changed** during active work (e.g. `npx vitest creditCard.test.ts`) — run the **full suite** only right before marking a phase done in `PROGRESS.md`.
5. Make edits as targeted diffs, not full-file rewrites, unless the file is new.
6. Update `PROGRESS.md` and, if files moved/were added, the relevant `MANIFEST.md` lines — before ending the session. This is not optional.

### Additional token-efficiency practices
- **One phase, one feature slice per session** where possible. Don't let a session sprawl across unrelated parts of §7 — a focused session produces a focused, trustworthy `PROGRESS.md` entry.
- **No speculative work.** Don't build ahead for a future phase "while you're at it" — it creates untracked, untested surface area that a later session has to rediscover.
- **No unprompted refactors.** If you notice something worth improving outside the current task, add a one-line note under a `## Backlog` heading in `PROGRESS.md` instead of doing it now.
- **Batch related file edits** into as few tool calls as reasonably possible rather than many small sequential edits to the same file.
- **Trust prior test results.** If `CALCULATIONS.md`/`PROGRESS.md` says a calculation is tested and passing and you haven't touched its logic, don't re-derive or re-verify it — just use it.
- **Cap exploration.** If you find yourself reading more than ~3-4 files to understand a "simple" task, stop — that's a signal `PROGRESS.md` or `MANIFEST.md` is stale and needs a quick fix first, not a signal to keep exploring.

---

## 7. Phase-wise build plan

Each phase has a **Definition of Done** that includes passing tests — do not proceed to the next phase until DoD is met and `PROGRESS.md` is updated.

### Phase 0 — Foundations
- Init Vite+React+TS project, Tailwind, ESLint/Prettier, Vitest, Playwright
- Create Supabase project, run schema migration (§4), enable RLS, seed lookup tables from your Setup sheet's actual values (Salary, Groceries, etc. — pull real values, don't invent new categories)
- Supabase Auth: email/password, manually create 2–4 user accounts (no public signup UI)
- Connect GitHub repo → Vercel, confirm the live `*.vercel.app` URL loads a "Hello FamFin" page
- Create `CLAUDE.md`, `PROGRESS.md`, `DECISIONS.md`, `CALCULATIONS.md` (skeletons)
- **DoD:** live URL works, login works for a seeded test user, `npm run test` and `npm run test:e2e` both pass on a trivial smoke test, all tracking files exist

### Phase 1 — Setup / master data management
- CRUD UI for Categories, Sub-categories, Payment Methods, Accounts, Tags, Credit Cards (card master only, not payments yet)
- Form validation with Zod (Income/Expense type required on category, uniqueness checks)
- **Tests:** unit tests for validation schemas; E2E: create/edit/delete a category and see it reflected
- **DoD:** all master lists manageable from UI, changes reflected instantly, tests passing

### Phase 2 — Transactions (core data entry)
- Transaction list (paginated/virtualized — assume years of data like the source workbook's 1500 rows), filters (date range, category, tag, type)
- Create/edit/delete transaction form, with conditional field logic (credit card field only shows/required when payment method = Credit Card)
- Bulk CSV import mapped from the existing Excel `Transactions` sheet layout (so historical data migrates in one step)
- **Tests:** unit tests for form validation incl. conditional logic; unit tests for CSV parsing against a small fixture CSV; E2E: add → appears in list → edit → delete
- **DoD:** can fully replace manual Excel entry; historical data importable

### Phase 3 — Credit card tracking
- Credit card payments log UI
- Implement calculations #10–16 from §5 as SQL views/functions
- Card summary cards showing outstanding balance, utilization %, next due date, days to due, with visual urgency states (e.g., due within 5 days)
- **Tests:** unit tests for every calc in §5 rows 10–16, including the statement-day/due-day edge case explicitly called out in the note; E2E: log a payment, see outstanding balance update
- **DoD:** figures match your real CreditCards sheet output for at least 2 real cards, spot-checked

### Phase 4 — Dashboard
- Filter bar: Year, Month, Family/Personal (matches Excel Dashboard sheet)
- KPI cards: Total Income, Total Expense, Net Savings, Savings Rate, Family Spend, Personal Spend, CC Spend, Avg Monthly Expense
- Charts: category breakdown (donut/bar), payment method breakdown, family vs personal split — implement calcs #2–9, #19
- **Tests:** unit tests for all dashboard calc functions against fixture data; E2E: change filter, verify KPI numbers update
- **DoD:** dashboard numbers match Excel Dashboard sheet for the same filter combination, spot-checked on 3 different filter states

### Phase 5 — Reports
- Monthly Report (table + trend chart), Yearly Report, Category Report (with % of total), Family vs Personal Report (trend lines), Credit Card Report, Cash Flow Report (with cumulative balance chart — calc #17–18)
- Export any report to CSV
- **Tests:** unit tests for cumulative balance logic (must handle gaps in months with no transactions); E2E: navigate each report tab, verify it renders with seeded data
- **DoD:** every one of the 6 report types matches its Excel counterpart on the same date range

### Phase 5.5 — Design pass (do this as its own reviewed step, not baked into every phase ad hoc)
- Before any further UI phases, produce `DESIGN.md`: pick a real typographic pairing (not default system fonts), a deliberate 5–7 color palette (not default Tailwind slate/indigo), a spacing/radius scale, and 2–3 reference inspirations (e.g. specific fintech apps, editorial sites — named explicitly) to anchor "not generic AI look."
- Apply the system to Phases 1–5's UI in a dedicated pass rather than piecemeal.
- **DoD:** a design QA checklist (contrast ratios, consistent spacing, no default component library look-and-feel) passes visual review.

### Phase 6 — Multi-user & household features
- Per-transaction "created by" attribution visible in the UI (avatar/initials)
- Activity feed ("Priya added ₹2,400 Groceries — 2 hours ago")
- Simple household settings (display names, per-user color used consistently in charts)
- **Tests:** RLS policy tests (a user cannot delete another user's transaction unless admin); E2E: two seeded users, verify attribution shows correctly
- **DoD:** works correctly with 2+ distinct logged-in test accounts

### Phase 7 — Reliability & polish
- Empty states, loading states, error boundaries, offline-friendly form (don't lose unsaved input on connection blip)
- Mobile responsive pass (this is a phone-first household app)
- Optional: installable PWA (manifest + icons) so it behaves like a native app from the home screen
- Accessibility pass (keyboard nav, ARIA labels, color contrast)
- **Tests:** Lighthouse CI thresholds (performance/accessibility ≥ 90); E2E on mobile viewport
- **DoD:** Lighthouse thresholds met, no console errors on any page

### Phase 8 — Deployment hardening & documentation
- GitHub Actions: run full test suite on every PR before merge; a scheduled keep-alive ping to Supabase (see §3 caveat #1)
- `SETUP.md` finalized end-to-end (see §9 below — should already be usable from Phase 0, this phase just verifies it against a truly fresh machine)
- Backup strategy: scheduled (e.g. weekly, via GitHub Action) export of all tables to CSV/JSON committed to a private backup branch or downloaded — zero-cost disaster recovery since free-tier DBs don't get vendor backups
- **DoD:** a fresh clone + `SETUP.md` reproduces a working local dev environment in under 20 minutes; backup job runs successfully at least once

---

## 8. Suggested additional features (not required, propose after Phase 8 — get explicit go-ahead before building, since they add scope)

- **Budgets & alerts**: set a monthly budget per category, visual progress bar, optional email nudge (via Resend free tier, 100 emails/day free) when 80%/100% reached
- **Recurring transaction templates**: one-tap re-log for rent/EMI/subscriptions
- **Receipt photo attachment**: Supabase Storage free tier (1GB), attach a photo to any transaction
- **CSV/Excel export of any report** (not just raw data) — lets you keep an offline Excel archive if desired
- **Natural-language quick add**: a single text box — "1200 groceries upi family" — parsed into a structured transaction via a small rule-based parser (no paid LLM API needed to stay zero-cost)
- **Net worth tracker**: optional extra table for assets/liabilities beyond cash flow, if useful to you
- **Anomaly flag**: highlight a transaction that's an outlier vs. that category's trailing 3-month average
- **Multi-year comparison view**: overlay this year vs last year per month

---

## 9. Setup instructions

### Accounts to create (all free, no card required for any of these)
1. **GitHub** account (if you don't have one) — hosts the code, triggers deploys
2. **Supabase** account → new project (choose a region close to Bengaluru, e.g. Mumbai/`ap-south-1` if offered) → note the Project URL and `anon` public key
3. **Vercel** account → "Import Git Repository" pointing at your GitHub repo

### Local machine setup
```bash
# 1. Node.js (LTS) — check first
node -v   # should be 20.x or later; if not, install via nvm

# 2. Scaffold the project
npm create vite@latest famfin -- --template react-ts
cd famfin
npm install

# 3. Core dependencies
npm install @supabase/supabase-js @tanstack/react-query zustand
npm install react-hook-form zod @hookform/resolvers
npm install recharts date-fns clsx
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test
npx playwright install

# 5. Supabase CLI (for migrations)
npm install -D supabase
npx supabase login
npx supabase init
npx supabase link --project-ref <your-project-ref>
```

### Environment variables
Create `.env.local` (never commit this):
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```
Add the same two keys in **Vercel → Project → Settings → Environment Variables** for the deployed build.

### Running migrations
```bash
# Write schema from §4 into supabase/migrations/0001_init.sql, then:
npx supabase db push
```

### Local development
```bash
npm run dev        # http://localhost:5173
npm run test       # unit tests (Vitest)
npm run test:e2e   # E2E tests (Playwright) — run against local dev server
```

### Deploying
- Push to `main` on GitHub → Vercel auto-builds and deploys → live at `https://famfin-<yourname>.vercel.app`
- No manual deploy steps needed after the initial Vercel project link

### Creating the 2–4 user accounts (no public signup)
In Supabase Dashboard → Authentication → Users → "Add user" (set email + password manually for each of the 2–4 household members). This keeps signup closed, which is correct for a private household app.

---

## 10. Backend & frontend skills involved

**Backend / data**
- PostgreSQL schema design & normalization
- SQL views and functions (`SUMIFS`-equivalent aggregation logic)
- Row Level Security (RLS) policy design
- Supabase Auth (JWT-based, email/password)
- Supabase Edge Functions (Deno/TypeScript) — only if a scheduled job or server-side-only logic is needed (e.g. keep-alive ping, budget alert emails)
- Database migrations & versioning
- CSV import/parsing & data validation

**Frontend**
- React 18 + TypeScript
- Vite build tooling
- TailwindCSS (custom design tokens, not defaults)
- TanStack Query (server-state caching/sync with Supabase)
- Zustand or Context (lightweight UI state — filters, modals)
- React Hook Form + Zod (form state + schema validation)
- Recharts (data visualization) with custom theming
- Responsive/mobile-first CSS, basic PWA manifest

**Tooling / DevOps (all free)**
- Git & GitHub (version control, Actions for CI)
- Vercel (hosting/CI-CD)
- Vitest + React Testing Library (unit/component tests)
- Playwright (E2E tests)
- Lighthouse CI (performance/accessibility gates)

---

## 11. Overall testing strategy summary

| Layer | Tool | What it covers |
|---|---|---|
| Unit | Vitest | Every formula in §5, every Zod validation schema, CSV parser |
| Component | React Testing Library | Forms render correct conditional fields, tables render correct rows |
| Integration | Vitest + Supabase local/test project | RLS policies behave as specified, migrations apply cleanly |
| E2E | Playwright | Full user flows per phase (add transaction → dashboard updates → report reflects it) |
| Visual/Perf | Lighthouse CI | Performance, accessibility, best-practices ≥ 90 |
| Regression | Fixture-based | Real spot-checked values from your actual Excel file, re-run on every calc change |

**Rule:** no phase is "done" in `PROGRESS.md` until its listed tests are green. Do not let test debt accumulate across phases — it defeats the token-efficiency goal because a future session would have to re-derive what's actually working.

---

## 12. SYSTEM PROMPT FOR CLAUDE CODE (paste this to start)

```
You are building "FamFin," a zero-cost family/personal expense tracker web app,
following the specification in CLAUDE_CODE_MASTER_PROMPT.md in this repo root.

Rules for how you work:
1. Build phase by phase, exactly as ordered in §7 of that file. Do not skip
   ahead or combine phases.
2. Before writing any code, create/update CLAUDE.md, PROGRESS.md,
   DECISIONS.md, CALCULATIONS.md, DESIGN.md, MANIFEST.md as described in §6.
3. Follow the model-tier policy in CLAUDE.md (§6): default to Sonnet, escalate
   to Opus only when genuinely stuck, use Haiku only for trivial mechanical edits.
4. Every calculation in §5 must be a unit-tested pure function or SQL
   view/function — no calculation logic embedded untested inside UI components.
5. Do not add any paid service, any service requiring a credit card, or
   any dependency with a cost at this usage scale. If uncertain, ask before adding.
6. UI must be visually distinctive — read DESIGN.md before styling anything,
   and do not use default component-library looks.
7. Follow the context-discipline and token-efficiency rules in CLAUDE.md (§6)
   at all times: read only what's needed, edit as targeted diffs, run only the
   relevant test file during active work, no speculative or unprompted work.
8. After every meaningful unit of work, update PROGRESS.md (and MANIFEST.md if
   files moved) with: what's done, what's next, and current test status. This
   file must always be trustworthy enough that a brand-new session can resume
   from it alone.
9. Do not proceed to the next phase until the current phase's Definition of
   Done (§7) is met, including passing tests.
10. If you hit an ambiguous product decision (not a technical one), state your
   assumption, log it in DECISIONS.md, and proceed — don't block on asking
   unless it's a data-loss-risk or cost-risk decision.

Start with Phase 0. Report back with what you built, the live URL, and the
current contents of PROGRESS.md.
```

## 13. Session bootstrap prompt (use this for every session after the first)

```
Continue building FamFin. Read CLAUDE.md and PROGRESS.md only — do not scan
the full codebase. Do the next concrete step listed in PROGRESS.md, run the
relevant tests, and update PROGRESS.md before you finish.
```
