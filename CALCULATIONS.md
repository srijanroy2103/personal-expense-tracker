# Calculation spec + fixtures (source of truth: master prompt §5)

Every row must be a unit-tested pure function or a Postgres SQL view/function.
Mark a row DONE only once its test file exists and passes — future sessions
must trust that mark instead of re-deriving the calculation.

No real transactions exist in the source workbook (Transactions sheet is an
empty template — verified 2026-09-07, see DECISIONS.md). Fixtures below are
hand-computed synthetic values, not spot-checked real rows. If real data is
ever imported, re-verify fixtures against 3-5 real rows and update this file.

| # | Metric | Formula | Status |
|---|---|---|---|
| 1 | Signed amount | `type='Income' ? amount : -amount` | not started |
| 2 | Monthly income | `SUM(amount) WHERE type='Income' AND year=Y AND month=M` | not started |
| 3 | Monthly expense | `SUM(amount) WHERE type='Expense' AND year=Y AND month=M` | not started |
| 4 | Net savings | `income - expense` | not started |
| 5 | Savings rate | `income=0 ? null : net_savings/income` | not started |
| 6 | Family expense | `SUM(amount) WHERE type='Expense' AND tag='Family'` | not started |
| 7 | Personal expense | `SUM(amount) WHERE type='Expense' AND tag='Personal'` | not started |
| 8 | Credit card expense | `SUM(amount) WHERE type='Expense' AND payment_method='Credit Card'` | not started |
| 9 | Category breakdown | `SUM(amount) GROUP BY category_id WHERE type='Expense' [+filters]` | not started |
| 10 | CC total spend (all-time) | `SUM(amount) WHERE payment_method='Credit Card' AND credit_card_id=X AND type='Expense'` | not started |
| 11 | CC this-month spend | #10 + `year=current_year AND month=current_month` | not started |
| 12 | CC payments made | `SUM(amount) FROM credit_card_payments WHERE credit_card_id=X` | not started |
| 13 | CC outstanding balance | `opening_balance + total_spend_all_time - payments_made` | not started |
| 14 | CC utilization % | `credit_limit=0 ? null : outstanding/credit_limit` | not started |
| 15 | CC next due date | `EDATE(DATE(YEAR(today),MONTH(today),1), IF(DAY(today)>statement_day,1,0)) + due_day - 1` (statement-day-aware; confirmed against live formula in CreditCards!I20, I21) | not started |
| 16 | CC days to due | `next_due_date - today` | not started |
| 17 | Cash flow (per month) | inflow=#2, outflow=#3, net=inflow-outflow | not started |
| 18 | Cumulative balance | running `SUM(net_cash_flow)` ordered by month from first recorded month | not started |
| 19 | Avg monthly expense | `total_expense_in_range / count_of_months_with_any_income_or_expense` | not started |

## Fixture data (synthetic, hand-verified)

### Calc #15/#16 — CC next due date — CORRECTION vs master prompt §5 note
Verbatim live formula, CreditCards!I20 (Card Master columns: A=Name,B=Bank,
C=Network,D=Limit,**E=Statement Day**,**F=Due Day**,G=Opening,H=Notes; row 6 =
HDFC Regalia, statement_day=E6=3, due_day=F6=23):
`=EDATE(DATE(YEAR(TODAY()),MONTH(TODAY()),1), IF(DAY(TODAY())>F6,1,0)) + F6 - 1`

**The branch and the offset both use `F6` = Due Day. Statement Day (`E6`) is
never referenced in this formula at all.** This differs from master prompt §5
row 15's note, which describes the branch as comparing against Statement Day
(`IF(DAY(TODAY())>StatementDay,1,0)`). Verified directly against the live
workbook on 2026-09-07 (re-checked column mapping twice) — the real formula is
simpler than documented: "if today's day-of-month is already past this
month's due day, the next due date is next month's due day; otherwise it's
this month's due day," full stop, using `due_day` only.

**Decision: implement the literal live-workbook formula (due_day only), not
the master prompt's paraphrase.** §2 requires matching "the Excel logic
exactly," and the live formula is the ground truth. This is safe for both real
cards (HDFC Regalia due_day=23 > statement_day=3; ICICI Amazon Pay due_day=25 >
statement_day=5) — statement_day is unused here regardless. Logged in
DECISIONS.md; flag to the user in Phase 3 that credit_cards.statement_day is
currently unused by any implemented calculation (kept in schema for future
statement-cycle features, e.g. "which cycle is this transaction in").

Test cases to hand-verify once implemented (due_day=23, HDFC Regalia):
- (a) today = 2026-09-10 (day 10 <= due_day 23): next due = 2026-09-23 (this month, EDATE offset 0)
- (b) today = 2026-09-01 (day 1 <= due_day 23): next due = 2026-09-23 (this month, EDATE offset 0)
- (c) today = 2026-09-25 (day 25 > due_day 23): next due = 2026-10-23 (EDATE offset 1 month)

### Calc #13 — CC outstanding balance
opening_balance=0, total_spend_all_time=45000, payments_made=20000 → outstanding=25000
Edge case: no spend, no payments → outstanding = opening_balance (0)

### Calc #14 — CC utilization %
outstanding=25000, credit_limit=200000 (HDFC Regalia) → utilization=0.125 (12.5%)
Edge case: credit_limit=0 → utilization=null (not divide-by-zero)

### Calc #5 — Savings rate
income=80000, expense=55000 → net_savings=25000, savings_rate=0.3125
Edge case: income=0 → savings_rate=null (not divide-by-zero)

## Real Setup master data (from Family_Personal_Expense_Tracker.xlsx, verified 2026-09-06 export)
Seeded verbatim in supabase/migrations/0001_init.sql:
- 18 Categories (4 Income, 14 Expense)
- 48 Sub-categories
- 5 Payment Methods: Cash, UPI, Bank Transfer, Credit Card, Other
- 5 Accounts: Primary Bank A/C, Secondary Bank A/C, Cash Wallet, UPI Wallet, Other
- 2 Tags: Family, Personal
- 2 real Credit Cards: HDFC Regalia (₹200,000 limit, statement day 3, due day 23),
  ICICI Amazon Pay (₹150,000 limit, statement day 5, due day 25)
