# FamFin — Project Memory (read this first, every session)

## What this is
Zero-cost family/personal expense tracker. React+Vite+TS frontend on Vercel,
Supabase (Postgres+Auth+RLS) backend. 2-4 private users. Full spec:
CLAUDE_CODE_MASTER_PROMPT.md (only re-read specific numbered sections if
PROGRESS.md tells you to — never re-read the whole file by default).

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
- /src/lib/supabaseClient.ts → Supabase client singleton (reads VITE_SUPABASE_* env vars)
- /supabase/migrations/   → schema, one file per migration, numbered
- /supabase/functions/    → edge functions (if any)
- /src/features/<name>/   → feature-sliced UI (components+hooks+api per feature)
- /e2e/                   → Playwright specs
- DESIGN.md               → design tokens, do-not-do list, reference screenshots
- CALCULATIONS.md         → formula spec + test fixture values (source: master prompt §5)

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

## Session bootstrap (use this prompt for every session after the first)
"Continue building FamFin. Read CLAUDE.md and PROGRESS.md only — do not scan
the full codebase. Do the next concrete step listed in PROGRESS.md, run the
relevant tests, and update PROGRESS.md before you finish."
