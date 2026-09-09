# Decisions log (append-only — never re-litigate, cite and move on)

## 2026-09-07 — Stack: Supabase + Vercel, not Firebase/Render/Railway
Zero-cost constraint with 2-4 users rules out anything requiring a card or that
cold-starts/sleeps. Postgres fits the SUMIFS-style relational aggregation the
Excel formulas already do; Firestore would force hand-rolled aggregation.
See master prompt §3.

## 2026-09-07 — Family/Personal tag is a UI filter, not an RLS boundary
Matches the source Excel workbook's behavior: everyone sees every transaction,
Family/Personal only slices the dashboard/reports view. RLS instead gates
mutation: a row can only be updated/deleted by its `created_by` user or a
profile with `is_admin = true`. See supabase/migrations/0001_init.sql.

## 2026-09-07 — Excel workbook (.xlsx) is gitignored
The source workbook currently contains no real transaction rows (verified by
reading Transactions!A5:P1504 — all formulas, zero logged data), but it's a
personal financial file that could later be hand-edited with real numbers, so
it's excluded from version control (see .gitignore). It stays on disk as the
spec/fixture source only.

## 2026-09-07 — No historical transactions to migrate
The uploaded workbook is an empty template (Setup sheet + 2 real credit cards
seeded, zero rows in Transactions). Phase 2's CSV import feature still needs
building per master prompt §7, but there is no backlog of real data to
validate it against yet — CALCULATIONS.md fixtures use hand-computed synthetic
values instead of spot-checked real rows.

## 2026-09-07 — CC next-due-date formula uses due_day only, not statement_day
Master prompt §5 row 15 describes the branch condition as comparing today's
day-of-month against Statement Day. The live formula in the actual workbook
(CreditCards!I20/I21/I22) compares against Due Day instead, and never
references Statement Day at all: `EDATE(first-of-month, IF(DAY(TODAY())>due_day,1,0)) + due_day - 1`.
Verified by direct column-by-column inspection of the Card Master table twice.
Implementing per the live formula (ground truth), not the master prompt's
paraphrase, per §2's "match Excel exactly" rule. See CALCULATIONS.md calc #15
for full detail and hand-verified test cases. `statement_day` stays in the
schema (may matter for a future statement-cycle feature) but is currently
unused by any calculation.

## 2026-09-07 — Package versions left as caret ranges resolved by npm at Phase 0 time
No pinned lockfile audit performed; React 19 / Vite 8 / TypeScript ~6 were
npm's current latest at project creation. Revisit only if a real compatibility
issue appears — don't preemptively downgrade.
