-- FamFin schema — mirrors Family_Personal_Expense_Tracker.xlsx "Setup" sheet.
-- See CLAUDE_CODE_MASTER_PROMPT.md §4 for the design rationale.

create extension if not exists pgcrypto;

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
  is_admin boolean not null default false,
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

-- ============ ROW LEVEL SECURITY ============
-- Household ledger: every authenticated member can read everything.
-- Only the row's own creator (or an admin profile) can update/delete it.
-- Family/Personal tag is a UI filter only, not an access boundary — see DECISIONS.md.

alter table categories enable row level security;
alter table subcategories enable row level security;
alter table payment_methods enable row level security;
alter table accounts enable row level security;
alter table tags enable row level security;
alter table profiles enable row level security;
alter table credit_cards enable row level security;
alter table credit_card_payments enable row level security;
alter table transactions enable row level security;

create or replace function is_admin(uid uuid) returns boolean as $$
  select coalesce((select is_admin from profiles where id = uid), false);
$$ language sql stable security definer;

-- Lookup tables: any authenticated user can read and write (shared household setup).
create policy "lookup_select" on categories for select to authenticated using (true);
create policy "lookup_write" on categories for all to authenticated using (true) with check (true);
create policy "lookup_select" on subcategories for select to authenticated using (true);
create policy "lookup_write" on subcategories for all to authenticated using (true) with check (true);
create policy "lookup_select" on payment_methods for select to authenticated using (true);
create policy "lookup_write" on payment_methods for all to authenticated using (true) with check (true);
create policy "lookup_select" on accounts for select to authenticated using (true);
create policy "lookup_write" on accounts for all to authenticated using (true) with check (true);
create policy "lookup_select" on tags for select to authenticated using (true);
create policy "lookup_write" on tags for all to authenticated using (true) with check (true);

-- Profiles: everyone can see all household member profiles; only self can edit own.
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_update_self" on profiles for update to authenticated using (id = auth.uid());
create policy "profiles_insert_self" on profiles for insert to authenticated with check (id = auth.uid());

-- Credit cards: shared visibility, only creator or admin can modify/delete.
create policy "cards_select" on credit_cards for select to authenticated using (true);
create policy "cards_insert" on credit_cards for insert to authenticated with check (created_by = auth.uid());
create policy "cards_update" on credit_cards for update to authenticated using (created_by = auth.uid() or is_admin(auth.uid()));
create policy "cards_delete" on credit_cards for delete to authenticated using (created_by = auth.uid() or is_admin(auth.uid()));

create policy "payments_select" on credit_card_payments for select to authenticated using (true);
create policy "payments_insert" on credit_card_payments for insert to authenticated with check (paid_by = auth.uid());
create policy "payments_update" on credit_card_payments for update to authenticated using (paid_by = auth.uid() or is_admin(auth.uid()));
create policy "payments_delete" on credit_card_payments for delete to authenticated using (paid_by = auth.uid() or is_admin(auth.uid()));

-- Transactions: shared visibility (Family AND Personal both visible to all members),
-- only creator or admin can modify/delete.
create policy "txn_select" on transactions for select to authenticated using (true);
create policy "txn_insert" on transactions for insert to authenticated with check (created_by = auth.uid());
create policy "txn_update" on transactions for update to authenticated using (created_by = auth.uid() or is_admin(auth.uid()));
create policy "txn_delete" on transactions for delete to authenticated using (created_by = auth.uid() or is_admin(auth.uid()));

-- ============ SEED DATA — pulled verbatim from Family_Personal_Expense_Tracker.xlsx "Setup" sheet ============

insert into categories (name, type, sort_order) values
  ('Salary', 'Income', 1),
  ('Bonus / Reimbursement', 'Income', 2),
  ('Investment Returns', 'Income', 3),
  ('Other Income', 'Income', 4),
  ('Housing & Utilities', 'Expense', 5),
  ('Groceries', 'Expense', 6),
  ('Food & Dining', 'Expense', 7),
  ('Transport', 'Expense', 8),
  ('Health & Fitness', 'Expense', 9),
  ('Shopping', 'Expense', 10),
  ('Subscriptions', 'Expense', 11),
  ('Travel', 'Expense', 12),
  ('Education', 'Expense', 13),
  ('Family Support', 'Expense', 14),
  ('Investments', 'Expense', 15),
  ('Credit Card Payment', 'Expense', 16),
  ('Gifts & Donations', 'Expense', 17),
  ('Miscellaneous', 'Expense', 18);

insert into subcategories (name, sort_order) values
  ('Rent / EMI', 1),
  ('Electricity', 2),
  ('Water', 3),
  ('Gas', 4),
  ('Internet & WiFi', 5),
  ('Mobile Recharge', 6),
  ('Maintenance', 7),
  ('Groceries - Supermarket', 8),
  ('Groceries - Local Store', 9),
  ('Restaurants', 10),
  ('Food Delivery', 11),
  ('Coffee & Snacks', 12),
  ('Fuel', 13),
  ('Cab / Auto', 14),
  ('Public Transport', 15),
  ('Vehicle Maintenance', 16),
  ('Gym / Fitness', 17),
  ('Medical & Pharmacy', 18),
  ('Health Insurance', 19),
  ('Clothing', 20),
  ('Electronics', 21),
  ('Home & Furnishing', 22),
  ('Personal Care', 23),
  ('OTT / Streaming', 24),
  ('Cloud & Software', 25),
  ('Magazines & News', 26),
  ('Flights', 27),
  ('Hotels', 28),
  ('Trip Expenses', 29),
  ('Tuition / Courses', 30),
  ('Books & Supplies', 31),
  ('Parents Support', 32),
  ('Siblings Support', 33),
  ('Household Help', 34),
  ('Mutual Funds', 35),
  ('Stocks', 36),
  ('Gold / Silver', 37),
  ('Bonds', 38),
  ('Crypto', 39),
  ('Fixed Deposit', 40),
  ('Credit Card Bill Payment', 41),
  ('Gifts', 42),
  ('Donation / Charity', 43),
  ('Cashback / Refund', 44),
  ('Salary Credit', 45),
  ('Freelance / Side Income', 46),
  ('Interest Income', 47),
  ('Others', 48);

insert into payment_methods (name) values
  ('Cash'),
  ('UPI'),
  ('Bank Transfer'),
  ('Credit Card'),
  ('Other');

insert into accounts (name) values
  ('Primary Bank A/C'),
  ('Secondary Bank A/C'),
  ('Cash Wallet'),
  ('UPI Wallet'),
  ('Other');

insert into tags (name) values
  ('Family'),
  ('Personal');

-- Real credit cards from the "Credit Cards" sheet card master (as of 2026-09-06 export).
-- created_by is left null here; Phase 0 seeding runs before user accounts exist.
insert into credit_cards (card_name, bank, network, credit_limit, statement_day, due_day, opening_balance, notes) values
  ('HDFC Regalia', 'HDFC Bank', 'Visa', 200000, 3, 23, 0, 'Primary card'),
  ('ICICI Amazon Pay', 'ICICI Bank', 'Visa', 150000, 5, 25, 0, 'Online spends');
