-- Phase 8: Finance and reimbursements

create table payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  provider text not null default 'razorpay',
  provider_order_id text, provider_payment_id text unique,
  idempotency_key text unique,
  amount bigint not null, currency text not null default 'INR',
  status payment_status not null default 'pending',
  purpose text not null,
  ref_type text not null, ref_id uuid not null,
  payer_member_id uuid references members(id),
  raw jsonb, created_at timestamptz not null default now()
);

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  direction ledger_direction not null,
  category text not null,
  amount bigint not null check (amount > 0),
  occurred_on date not null default current_date,
  event_id uuid references events(id), fundraiser_id uuid references fundraisers(id),
  payment_id uuid references payments(id), expense_id uuid, member_id uuid references members(id),
  reverses_id uuid references ledger_entries(id),
  note text, created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on ledger_entries (org_id, direction, category, occurred_on);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  event_id uuid references events(id), category text not null,
  amount bigint not null, period_start date, period_end date
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  category text not null, description text, amount bigint not null check (amount > 0),
  event_id uuid references events(id), fundraiser_id uuid references fundraisers(id),
  submitted_by_member uuid references members(id), spent_on date not null default current_date,
  receipt_path text,
  reimbursable boolean not null default false,
  created_at timestamptz not null default now()
);

create table reimbursements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  expense_id uuid not null unique references expenses(id),
  status reimb_status not null default 'submitted',
  manager_id uuid references profiles(id), manager_at timestamptz,
  treasurer_id uuid references profiles(id), treasurer_at timestamptz,
  paid_at timestamptz, payment_ref text, reject_reason text,
  created_at timestamptz not null default now()
);
