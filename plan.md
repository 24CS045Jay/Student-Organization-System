# ClubSphere — Production Implementation Plan (React + Node.js + Supabase)

> **Goal:** build the real, working multi-tenant SaaS: every FR (FR-01–FR-21), NFR (NFR-01–NFR-10), extra feature (A–O) and business feature (10–17) from the requirements list, with a real database, real auth, real payments, and strict per-club data isolation.
> The prototype (`01_ClubSphere_Prototype_Update_Plan.md`) is the UI reference. Its `services/` layer is replaced by real API calls.

---

## 1. Technology decisions

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite, React Router, TanStack Query, Zustand, Tailwind + neo-brutalist tokens, Recharts, React Hook Form + Zod | Matches prototype, typed forms, cached server state |
| Backend API | Node.js 20 + Express + TypeScript (Zod validation, Pino logging) | Business logic, payments, webhooks, jobs, AI |
| Database | **Supabase Postgres** with Row Level Security | Tenant isolation enforced in the database |
| Auth | Supabase Auth (email/password, Google, Microsoft, later SAML SSO) | Handles hashing, sessions, JWT |
| Storage | Supabase Storage (receipts, product images, contracts, certificates) | Private buckets with org-scoped paths |
| Realtime | Supabase Realtime (seats left, notifications, check-in feed) | Live capacity and notification bell |
| Payments | Razorpay (primary, INR) + Stripe (later) | Orders + signed webhooks |
| Email | Resend or SendGrid; WhatsApp/SMS via provider adapters later | Announcements, reminders, receipts |
| Jobs | `pg_cron` for DB-side schedules + BullMQ (Redis) or Supabase Edge Functions for email/AI jobs | Renewal reminders, scheduled announcements |
| AI | Anthropic Claude API with **tool calling against org-scoped endpoints** | Copilot, planner, insights |
| Testing | Vitest, Supertest, Playwright, pgTAP (RLS tests) | Includes cross-tenant tests |
| DevOps | GitHub Actions, Vercel (web), Render/Railway/Fly (API), Supabase migrations CLI, Sentry | Staging + production |

### Monorepo layout
```text
clubsphere/
  apps/
    web/            React app
    api/            Express API (routes -> controllers -> services -> repositories)
  packages/
    shared/         Zod schemas, TS types, permission map, enums (used by web + api)
  supabase/
    migrations/     numbered .sql files (schema, RLS, functions, seed)
    seed.sql        3 demo clubs with different data
    tests/          pgTAP RLS tests
  docs/             API spec (OpenAPI), ADRs, runbooks
```

### Architecture
```text
React (Vercel) ──JWT──> Node API (Express) ──user JWT──> Supabase Postgres (RLS)
      │                       │   ├─ service role (webhooks, jobs, AI tools only)
      │                       │   ├─ Razorpay / Email / WhatsApp adapters
      │                       │   └─ Claude API (tool calls via org-scoped services)
      └── Supabase Auth, Storage, Realtime (direct, RLS protected)
```

---

## 2. Multi-tenancy and security model (most important rule)

**Club A must never see, edit, export or infer Club B data.** Defense in depth, four layers:

1. **Schema:** every business table has `org_id uuid not null references organizations(id)`. Child tables carry `org_id` too (not just via parent) so policies are single-table and fast. Composite checks (e.g., a ticket's `org_id` must equal its event's `org_id`) are enforced with triggers.
2. **RLS:** `enable row level security` + `force row level security` on every table. Policies use helper functions `is_org_member(org_id)` and `has_org_role(org_id, roles[])`. No policy is `using (true)` except public reads that are explicitly published (e.g., published events).
3. **API layer:** Express middleware resolves `orgId` from the **active membership of the authenticated user** (header `x-org-id` is *validated* against `org_users`, never trusted). All repositories take `orgId` as a mandatory argument. The API calls Supabase **with the user's JWT**, so RLS applies. The **service role key** is used only in webhooks, cron jobs, and AI tool executors, and those always add `.eq('org_id', ...)` explicitly.
4. **Tests:** automated cross-tenant suite (section 13) runs on every PR. Exports, reports, search, Realtime channels, Storage paths, and AI tools are all covered.

Other rules: IDs are UUIDs (not guessable); Storage paths are `{org_id}/{module}/{file}` with bucket policies on the first path segment; QR tokens are signed (HMAC) and verified server-side; passwords handled by Supabase Auth; rate limiting and Helmet on the API; CORS allow-list; secrets only in env vars.

---

## 3. Roles and permissions

### Roles (login roles)
| Role (`org_role` enum) | Scope | Source |
|---|---|---|
| `student` (Student / Member) | Org | List 9-A |
| `volunteer` | Org | List 9-A |
| `event_manager` | Org | List 9-A |
| `treasurer` | Org | List 9-A |
| `admin` (Club Admin) | Org | List 9-A |
| `platform_admin` (Platform Super Admin) | Platform (`profiles.is_platform_admin`) | Section 10 SaaS |

A user can hold **different roles in different orgs** and **several roles in one org** (e.g., student + volunteer). Table: `org_users(org_id, user_id, role)`.

### Permission matrix (✔ = allowed, own = only own records)
| Capability | Student | Volunteer | Event Mgr | Treasurer | Admin |
|---|---|---|---|---|---|
| View/verify own membership, digital card | own | own | ✔ | ✔ | ✔ |
| Register/renew members, set types | – | – | – | – | ✔ |
| Create/edit/publish events | – | – | ✔ | – | ✔ |
| Buy tickets, view own tickets | own | own | ✔ | ✔ | ✔ |
| Check-in tickets, view attendance | – | – | ✔ | – | ✔ |
| Announcements create/publish | – | – | ✔ (event scope) | – | ✔ |
| Products/inventory manage | – | – | – | – | ✔ |
| Order merchandise | own | own | ✔ | ✔ | ✔ |
| Fundraisers & tasks manage | – | update own tasks | ✔ | – | ✔ |
| Submit expenses / reimbursements | – | own | ✔ | ✔ | ✔ |
| Manager approval step | – | – | ✔ | – | ✔ |
| Treasurer approval and payment | – | – | – | ✔ | ✔ |
| Income/expense/budget manage | – | – | – | ✔ | ✔ |
| Financial dashboard and reports | – | – | event reports | ✔ | ✔ |
| Sponsors, donations | – | – | – | ✔ | ✔ |
| Users, roles, settings, audit log | – | – | – | read audit (finance) | ✔ |
| AI Copilot | – | – | ✔ (events) | ✔ (finance) | ✔ |
| Organizations, plans, platform analytics | – | – | – | – | platform_admin only |

Implemented once in `packages/shared/permissions.ts` (used by UI to hide menus and by API middleware `requirePermission('events:write')`) and mirrored in RLS policies.

---

## 4. Database schema (Supabase / Postgres)

> Run as numbered migrations in `supabase/migrations/`. Money is stored as **integer paise** (`bigint`) to avoid float errors; display as ₹.

### 4.1 Extensions, enums, helpers
```sql
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

create type org_role as enum ('student','volunteer','event_manager','treasurer','admin');
create type org_type as enum ('technical','cultural','sports','chapter','ngo','society','committee','fest','hackathon','other');
create type member_status as enum ('pending','active','expired','inactive');
create type dues_status as enum ('unpaid','paid','waived','refunded');
create type event_status as enum ('draft','published','closed','completed','cancelled');
create type payment_status as enum ('pending','paid','failed','refunded','partially_refunded');
create type ticket_status as enum ('reserved','valid','used','cancelled','refunded');
create type order_status as enum ('placed','paid','ready','collected','delivered','cancelled');
create type task_status as enum ('pending','in_progress','done','blocked');
create type reimb_status as enum ('submitted','manager_approved','treasurer_approved','paid','rejected');
create type ledger_direction as enum ('income','expense');
create type announce_status as enum ('draft','scheduled','published','archived');

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Tenant helpers (SECURITY DEFINER so they can read org_users without recursion)
create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from profiles where id = auth.uid()), false) $$;

create or replace function is_org_member(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from org_users
                 where org_id = p_org and user_id = auth.uid() and active) $$;

create or replace function has_org_role(p_org uuid, p_roles org_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from org_users
                 where org_id = p_org and user_id = auth.uid() and active and role = any(p_roles)) $$;
```

### 4.2 Platform, hierarchy, plans
```sql
create table plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,               -- free | professional | enterprise
  name text not null,
  max_members int,                         -- null = unlimited
  features jsonb not null default '{}',    -- {"ticketing":true,"merch":true,"ai":false,...}
  price_monthly bigint not null default 0
);

create table universities (id uuid primary key default gen_random_uuid(), name text not null);
create table colleges (id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id), name text not null);
create table departments (id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id), name text not null);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type org_type not null default 'other',
  university_id uuid references universities(id),
  college_id uuid references colleges(id),
  department_id uuid references departments(id),
  parent_org_id uuid references organizations(id),      -- committees under a club
  plan_id uuid references plans(id),
  logo_path text, accent_color text default '#4CC9F0',
  contact_email text, contact_phone text,
  settings jsonb not null default '{}',                  -- reminder days, currency, branding
  modules jsonb not null default '{}',                   -- enabled modules
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  plan_id uuid not null references plans(id),
  status text not null default 'active',                 -- trialing|active|past_due|cancelled
  current_period_end timestamptz, provider_ref text
);
```

### 4.3 Users and roles
```sql
create table profiles (            -- 1:1 with auth.users
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, phone text, avatar_path text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table org_users (           -- login role of a user inside one org
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role org_role not null,
  active boolean not null default true,
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (org_id, user_id, role)
);
create index on org_users (user_id, org_id);
```

### 4.4 Membership (FR-01, FR-02, FR-20, extras C, H)
```sql
create table membership_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  name text not null, price bigint not null default 0, duration_months int not null default 12,
  benefits text, ticket_discount_pct int not null default 0, merch_discount_pct int not null default 0,
  active boolean not null default true
);

create table members (             -- person record inside a club (may or may not have a login)
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  user_id uuid references profiles(id),
  full_name text not null, email text not null, phone text,
  student_id text, department_id uuid references departments(id),
  skills text[] default '{}', availability jsonb default '{}',
  mailing_subscribed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  member_id uuid not null references members(id),
  type_id uuid not null references membership_types(id),
  membership_no text not null,                          -- TC-000123, from sequence per org
  status member_status not null default 'pending',
  dues dues_status not null default 'unpaid',
  starts_on date not null, expires_on date not null,
  renewal_of uuid references memberships(id),           -- history chain
  qr_secret text not null default encode(gen_random_bytes(16),'hex'),
  created_at timestamptz not null default now(),
  unique (org_id, membership_no)
);
create index on memberships (org_id, status, expires_on);

create table renewal_reminders (   -- log for 30/15/3-day reminders
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  membership_id uuid not null references memberships(id),
  days_before int not null, sent_at timestamptz, channel text default 'email',
  unique (membership_id, days_before)
);
```

### 4.5 Events and tickets (FR-03 to FR-06, FR-19, extras L, M, I)
```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  title text not null, description text, category text,
  starts_at timestamptz not null, ends_at timestamptz, location text,
  organizer_id uuid references profiles(id),
  capacity int not null check (capacity >= 0),
  tickets_sold int not null default 0 check (tickets_sold <= capacity),   -- overselling guard
  member_price bigint not null default 0, non_member_price bigint not null default 0,
  registration_deadline timestamptz,
  status event_status not null default 'draft',
  budget bigint default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table ticket_orders (       -- one purchase, may contain several tickets
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  event_id uuid not null references events(id),
  buyer_member_id uuid references members(id), buyer_user_id uuid references profiles(id),
  buyer_name text not null, buyer_email text not null,
  total bigint not null, payment_status payment_status not null default 'pending',
  reserved_until timestamptz,                             -- seat hold while paying
  created_at timestamptz not null default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  event_id uuid not null references events(id),
  order_id uuid not null references ticket_orders(id),
  ticket_no text not null unique,                         -- EV-2026-000123
  attendee_member_id uuid references members(id),
  attendee_name text not null, attendee_email text,
  kind text not null check (kind in ('member','non_member')),
  price bigint not null,
  status ticket_status not null default 'reserved',
  qr_token text not null,                                 -- HMAC-signed, verified server-side
  checked_in_at timestamptz, checked_in_by uuid references profiles(id),
  cancelled_at timestamptz
);
create index on tickets (org_id, event_id, status);
-- Duplicate check-in is prevented by an atomic UPDATE ... WHERE status='valid' (see 7.2)

create table event_feedback (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  event_id uuid not null references events(id),
  ticket_id uuid unique references tickets(id),
  rating_overall int check (rating_overall between 1 and 5),
  rating_speaker int, rating_organization int, rating_venue int, rating_content int,
  comment text, created_at timestamptz not null default now()
);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  event_id uuid not null references events(id),
  ticket_id uuid not null unique references tickets(id),   -- only for attended tickets
  certificate_no text unique not null, file_path text,
  issued_at timestamptz not null default now()
);
```

### 4.6 Payments and ledger (FR-15, FR-16, FR-18, NFR-05, NFR-08)
```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  provider text not null default 'razorpay',
  provider_order_id text, provider_payment_id text unique,   -- unique => no duplicate payments
  idempotency_key text unique,
  amount bigint not null, currency text not null default 'INR',
  status payment_status not null default 'pending',
  purpose text not null,           -- membership | ticket | merch | donation | sponsorship
  ref_type text not null, ref_id uuid not null,
  payer_member_id uuid references members(id),
  raw jsonb, created_at timestamptz not null default now()
);

-- Single source of truth for money. Append-only: corrections are reversal rows.
create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  direction ledger_direction not null,
  category text not null,   -- membership_dues|ticket|merchandise|fundraising|donation|sponsorship|other_income
                            -- event|venue|food|equipment|merch_purchase|fundraiser|volunteer|reimbursement|operational
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
```
Block updates/deletes on `ledger_entries` (trigger raises exception) so history cannot be rewritten.

### 4.7 Communication (FR-07, FR-08, extra G)
```sql
create table announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  title text not null, body text not null,
  audience text not null,       -- all|active|expired|attendees|volunteers|committee|department
  audience_ref uuid,            -- event_id or department_id when relevant
  channels text[] not null default '{website,email,in_app}',
  status announce_status not null default 'draft',
  scheduled_at timestamptz, published_at timestamptz,
  created_by uuid references profiles(id), edited_at timestamptz,
  created_at timestamptz not null default now()
);
create table announcement_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  announcement_id uuid not null references announcements(id),
  member_id uuid not null references members(id),
  channel text not null, status text not null default 'queued', sent_at timestamptz
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  user_id uuid not null references profiles(id),
  type text not null, title text not null, body text, link text, payload jsonb,
  read_at timestamptz, created_at timestamptz not null default now()
);
create index on notifications (user_id, read_at);
```

### 4.8 Merchandise and inventory (FR-09 to FR-11, extra O)
```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  name text not null, description text, category text not null,   -- tshirt|hoodie|cap|other
  image_path text, member_price bigint not null, non_member_price bigint not null,
  active boolean not null default true
);
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  product_id uuid not null references products(id),
  size text not null, sku text,
  opening_stock int not null default 0,
  added int not null default 0,
  reserved int not null default 0 check (reserved >= 0),
  sold int not null default 0 check (sold >= 0),
  on_hand int generated always as (opening_stock + added - sold) stored,
  check (opening_stock + added - sold - reserved >= 0),      -- never negative / oversold
  unique (product_id, size)
);
create table stock_movements (      -- audit trail of every stock change (purchase, sale, adjust)
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  variant_id uuid not null references product_variants(id),
  kind text not null,               -- purchase|sale|reserve|release|adjust
  qty int not null, ref_id uuid, note text,
  created_by uuid references profiles(id), created_at timestamptz not null default now()
);
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  supplier text, status text default 'ordered', total bigint, ordered_on date, received_on date
);
create table merch_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  member_id uuid references members(id), buyer_name text not null, buyer_email text not null,
  total bigint not null, status order_status not null default 'placed',
  payment_status payment_status not null default 'pending',
  fulfilment text default 'collect', created_at timestamptz not null default now()
);
create table merch_order_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  order_id uuid not null references merch_orders(id),
  variant_id uuid not null references product_variants(id),
  qty int not null check (qty > 0), unit_price bigint not null
);
```

### 4.9 Fundraising, volunteers, tasks (FR-12 to FR-14, extra N)
```sql
create table fundraisers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  title text not null, description text, target_amount bigint not null,
  starts_on date, ends_on date, organizer_id uuid references profiles(id),
  status text not null default 'active', created_at timestamptz not null default now()
);
create table tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  fundraiser_id uuid references fundraisers(id), event_id uuid references events(id),
  title text not null, notes text,
  assignee_member_id uuid references members(id),
  deadline date, priority int default 2, status task_status not null default 'pending',
  progress int not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table volunteer_hours (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  member_id uuid not null references members(id),
  task_id uuid references tasks(id), event_id uuid references events(id),
  hours numeric(5,2) not null check (hours > 0), worked_on date not null,
  approved_by uuid references profiles(id)
);
create table volunteer_points (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  member_id uuid not null references members(id), points int not null, reason text,
  created_at timestamptz not null default now()
);
-- Badge levels (Bronze 25h, Silver 50h, Gold 100h) are computed from SUM(volunteer_hours).
```

### 4.10 Expenses and reimbursements (FR-16, FR-17)
```sql
create table expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  category text not null, description text, amount bigint not null check (amount > 0),
  event_id uuid references events(id), fundraiser_id uuid references fundraisers(id),
  submitted_by_member uuid references members(id), spent_on date not null default current_date,
  receipt_path text,                                       -- Storage: {org_id}/receipts/...
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
```

### 4.11 Sponsors, donations (extras J, K)
```sql
create table sponsors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  name text not null, contact_name text, contact_email text, contact_phone text
);
create table sponsorships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  sponsor_id uuid not null references sponsors(id), event_id uuid references events(id),
  package text not null, amount bigint not null, benefits text[],
  contract_path text, payment_status payment_status not null default 'pending', renewal_on date
);
create table donations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  fundraiser_id uuid references fundraisers(id),
  donor_name text, donor_email text, anonymous boolean not null default false,
  amount bigint not null check (amount > 0), payment_id uuid references payments(id),
  receipt_no text unique, created_at timestamptz not null default now()
);
```

### 4.12 Audit, integrations, AI
```sql
create table audit_logs (
  id bigint generated always as identity primary key,
  org_id uuid, user_id uuid, user_role text,
  action text not null,                  -- e.g. 'budget.update'
  table_name text, record_id uuid,
  old_value jsonb, new_value jsonb, ip inet,
  created_at timestamptz not null default now()
);
create table integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  kind text not null,                    -- razorpay|stripe|email|whatsapp|sms|gcal|outlook|s3...
  config_encrypted text, enabled boolean not null default false
);
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  user_id uuid not null references profiles(id),
  messages jsonb not null default '[]', created_at timestamptz not null default now()
);
```

### 4.13 Generic audit trigger (NFR-10) and RLS patterns
```sql
create or replace function audit_row() returns trigger language plpgsql security definer as $$
begin
  insert into audit_logs(org_id,user_id,action,table_name,record_id,old_value,new_value)
  values (coalesce(new.org_id, old.org_id), auth.uid(), tg_op||'.'||tg_table_name, tg_table_name,
          coalesce(new.id, old.id),
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
-- attach to: events, budgets, ledger_entries, expenses, reimbursements, memberships,
--            org_users, product_variants, announcements, sponsorships
-- create trigger trg_audit after insert or update or delete on events
--   for each row execute function audit_row();

-- RLS pattern (repeat per table)
alter table events enable row level security;  alter table events force row level security;

create policy events_read_members on events for select
  using (is_org_member(org_id) and (status <> 'draft' or has_org_role(org_id, '{event_manager,admin}')));
create policy events_public_read on events for select to anon
  using (status = 'published');                              -- public event page
create policy events_write on events for all
  using (has_org_role(org_id, '{event_manager,admin}'))
  with check (has_org_role(org_id, '{event_manager,admin}'));

-- Own-records pattern (tickets, orders, volunteer expenses)
create policy tickets_own on tickets for select
  using (attendee_member_id in (select id from members where user_id = auth.uid())
         or has_org_role(org_id, '{event_manager,admin,treasurer}'));

-- Finance is restricted to treasurer/admin
create policy ledger_read on ledger_entries for select
  using (has_org_role(org_id, '{treasurer,admin}'));
create policy ledger_insert on ledger_entries for insert
  with check (has_org_role(org_id, '{treasurer,admin}'));
-- no update/delete policies + trigger that raises on update/delete

-- Platform admin sees organizations, not club data, unless explicitly granted
create policy orgs_platform on organizations for all using (is_platform_admin());
```

---

## 5. API design (Node/Express, all under `/api/v1`, JWT required unless noted)

Every request passes `authenticate → resolveOrg → requirePermission → validate(Zod) → controller`.

| Module | Endpoints |
|---|---|
| Auth/Org | `POST /auth/register` · `GET /me` (profile + orgs + roles) · `POST /orgs` · `GET/PATCH /orgs/:id` · `POST /orgs/:id/invite` · `PATCH /org-users/:id` (roles) |
| Membership | `GET/POST /members` · `GET/PATCH /members/:id` · `GET/POST /membership-types` · `POST /memberships` (register + payment) · `POST /memberships/:id/renew` · `GET /memberships/:id/history` · `POST /verify/member` (QR/ID) · `GET /me/membership-card` |
| Events | `GET/POST /events` · `PATCH /events/:id` · `POST /events/:id/publish` · `GET /public/:orgSlug/events` (no auth) · `GET /events/:id/availability` |
| Tickets | `POST /events/:id/checkout` (reserve) · `POST /payments/razorpay/webhook` (confirm) · `GET /me/tickets` · `POST /tickets/:id/cancel` · `POST /checkin` (QR) · `GET /events/:id/attendance` · `GET /events/:id/report` |
| Announcements | `GET/POST /announcements` · `PATCH /announcements/:id` · `POST /announcements/:id/publish` · `GET /mailing-lists/audiences` · `GET /mailing-lists/audiences/:key/recipients` |
| Merchandise | `GET/POST /products` · `POST /products/:id/variants` · `POST /inventory/adjust` · `GET /inventory` · `POST /merch/checkout` · `GET /merch/orders` · `PATCH /merch/orders/:id/status` |
| Fundraising | `GET/POST /fundraisers` · `GET /fundraisers/:id/progress` · `GET/POST /tasks` · `PATCH /tasks/:id` · `GET /volunteers` · `POST /volunteer-hours` · `GET /leaderboard` |
| Finance | `GET /finance/dashboard` · `GET/POST /income` · `GET/POST /expenses` · `POST /expenses/:id/receipt` (signed upload URL) · `GET/POST /budgets` · `POST /reimbursements` · `POST /reimbursements/:id/manager-approve` · `/treasurer-approve` · `/pay` · `/reject` |
| Reports | `GET /reports/{events,membership,financial}?from&to&format=json|csv|pdf` |
| Extras | `/sponsors`, `/sponsorships`, `/donations`, `/public/:orgSlug/donate`, `/certificates` (+ `GET /public/certificates/:no/verify`), `/feedback`, `/notifications`, `/analytics/*`, `/audit-logs` |
| Platform | `GET/POST /platform/orgs` · `/platform/plans` · `/platform/hierarchy` · `/platform/analytics` |
| AI | `POST /ai/copilot` · `POST /ai/event-plan` · `GET /ai/insights` · `POST /ai/volunteer-match` · `GET /ai/recommendations` |

Conventions: pagination `?page&limit&sort&q`, standard error shape `{error:{code,message,details}}`, OpenAPI spec generated from Zod (`zod-to-openapi`), idempotency header on payment creation.

---

## 6. Critical business logic (where bugs cost money)

### 6.1 Ticket purchase without overselling (NFR-05)
Done in one Postgres function so it is atomic:
```sql
create or replace function reserve_tickets(p_event uuid, p_qty int, p_buyer jsonb)
returns uuid language plpgsql security definer as $$
declare ev events%rowtype; ord uuid;
begin
  select * into ev from events where id = p_event for update;      -- row lock
  if ev.status <> 'published' or now() > coalesce(ev.registration_deadline, 'infinity') then
    raise exception 'EVENT_CLOSED'; end if;
  if ev.tickets_sold + p_qty > ev.capacity then raise exception 'SOLD_OUT'; end if;
  update events set tickets_sold = tickets_sold + p_qty where id = p_event;
  -- create ticket_orders (reserved_until = now()+10 min) and tickets(status='reserved')
  ...
  return ord;
end $$;
```
Payment webhook flips `reserved → valid`, writes `payments` + `ledger_entries(income, ticket)`. A cron job releases expired reservations (`tickets_sold` decremented). Member price is applied only if the buyer has an **active membership in that org** (checked server-side, not by the client).

### 6.2 Check-in without duplicates (FR-05)
```sql
update tickets set status='used', checked_in_at=now(), checked_in_by=auth.uid()
where id = $1 and org_id = $2 and event_id = $3 and status = 'valid'
returning *;
-- 0 rows => look up why: already used (return time), unpaid (reserved), cancelled, wrong event, invalid
```
The QR contains `ticket_id.signature`; the API verifies HMAC before touching the DB. Offline-tolerant scanner (PWA) queues scans and syncs; server still rejects duplicates.

### 6.3 Merchandise stock
`place_merch_order()` locks the variant rows (`for update`), checks `on_hand - reserved >= qty`, increments `reserved`, creates the order. On payment: `reserved -= qty`, `sold += qty`, `stock_movements(sale)`, `ledger_entries(income, merchandise)`. Check constraints guarantee stock never goes negative.

### 6.4 Payments and idempotency
Create Razorpay order → store `payments(pending)` with `idempotency_key` → on webhook verify signature → `provider_payment_id unique` makes retries harmless → in one transaction: mark paid, activate ticket/membership/order, insert ledger row, queue confirmation email.

### 6.5 Reimbursement state machine
`submitted → manager_approved → treasurer_approved → paid` (or `rejected` at any step). Transitions enforced in a DB function that checks the caller's role (`event_manager/admin` for step 1, `treasurer/admin` for steps 2–3, and a user may not approve their own expense). On `paid`: insert `ledger_entries(expense, reimbursement)`, notify the volunteer.

### 6.6 Membership lifecycle
Payment → `active`, `starts_on/expires_on` set from type. Daily `pg_cron` job: send reminders at 30/15/3 days (`renewal_reminders` prevents duplicates), set `expired` after `expires_on`. Renewal creates a new `memberships` row with `renewal_of` (history). Member discounts applied from `membership_types.*_discount_pct`.

### 6.7 Announcements
Publish → resolve audience via SQL (e.g., `active` = memberships with status active; `attendees` = used tickets of an event; `volunteers` = members with tasks/hours; `committee` = org_users with non-student roles) → create `announcement_deliveries` + `notifications` → email worker sends. Scheduled ones are picked by a cron every minute.

---

## 7. Implementation phases

Estimates assume 2–3 developers. Adjust as needed. Each phase ends with a demo and its acceptance tests passing.

### Phase 0 — Foundation (1 week)
- **Do:** monorepo, TypeScript, ESLint/Prettier, Husky, GitHub Actions (lint, test, build), Supabase projects (dev/staging/prod), env management, Sentry, base design-system package, migration workflow (`supabase db push`), seed script.
- **DB:** extensions, enums, helper functions.
- **Done when:** CI green, "hello" endpoint deployed to staging, web deployed to Vercel preview.

### Phase 1 — Auth, tenancy, RBAC (2 weeks) — *NFR-03*
- **DB:** `plans, universities, colleges, departments, organizations, profiles, org_users`, RLS on all, audit trigger function.
- **API:** register/login via Supabase, `/me`, org creation (onboarding), invite user, assign roles, `resolveOrg` + `requirePermission` middleware.
- **UI:** login, register, org onboarding wizard, club switcher, role-based sidebar and route guards, 403 page, user & role management.
- **Tests:** cross-tenant RLS suite skeleton (pgTAP) with 3 seeded clubs; every new table must add its tests from now on.
- **Done when:** Tech Club admin cannot read any Cultural/Sports row by any ID, URL, or API call; each of the 5 roles lands on its home page.

### Phase 2 — Membership (2 weeks) — *FR-01, FR-02, FR-20, extras C, H*
- **DB:** `membership_types, members, memberships, renewal_reminders`, membership number sequence per org.
- **API:** member CRUD, register (with payment), renew, history, verify (QR/ID, tenant-checked), digital card endpoint.
- **UI:** register form, types, members table (search/filter/sort/paginate/export), profile drawer, student "My Membership" with QR card, verification page.
- **Jobs:** daily expiry + 30/15/3-day reminders (`pg_cron` + email worker).
- **Done when:** register → pay → active → reminder → expire → renew works; verify shows Active/Expired/Invalid; membership report numbers match DB.

### Phase 3 — Events and online ticketing (3 weeks) — *FR-03, FR-04, NFR-05*
- **DB:** `events, ticket_orders, tickets, payments, ledger_entries`, `reserve_tickets()`, reservation-expiry cron.
- **API:** event CRUD/publish, public event listing, availability, checkout, Razorpay order + webhook, cancel/refund, booking confirmation email.
- **UI:** event create/edit form, public event page with live seats-left (Realtime), checkout, confirmation, My Tickets, cancellation/refund request.
- **Done when:** member vs non-member price correct; concurrency test (100 parallel buyers for 10 seats) sells exactly 10; duplicate webhook does not double-count.

### Phase 4 — Digital tickets, QR check-in, attendance (2 weeks) — *FR-05, FR-06, FR-19*
- **API:** signed QR token, `/checkin`, attendance and event report endpoints.
- **UI:** ticket card + wallet-style page, PWA scanner (camera via `getUserMedia` + QR library, manual fallback), result screens (valid/used/unpaid/wrong event), live check-in feed, attendance page, member vs non-member split.
- **Done when:** second scan of same ticket is rejected with the first check-in time; check-in latency under 1 s on staging; no-shows computed correctly after the event.

### Phase 5 — Communication (1.5 weeks) — *FR-07, FR-08, extra G*
- **DB:** `announcements, announcement_deliveries, notifications`.
- **API:** create/edit/schedule/publish, audience resolver, mailing list endpoints, delivery worker, notification fan-out.
- **UI:** compose drawer, history/archive, club portal feed, mailing list audience cards, notification bell (Realtime).
- **Done when:** one announcement reaches exactly the selected audience (verified by delivery rows) and appears in website feed and in-app notifications.

### Phase 6 — Merchandise and inventory (2 weeks) — *FR-09, FR-10, FR-11, extra O*
- **DB:** `products, product_variants, stock_movements, purchase_orders, merch_orders, merch_order_items`, `place_merch_order()`.
- **API/UI:** product CRUD with image upload, variant inventory screen, stock add/adjust, shop with size/qty, checkout/payment, order tracking and status updates.
- **Done when:** concurrent orders cannot make stock negative; sold/reserved/remaining always reconcile with `stock_movements`.

### Phase 7 — Fundraising, volunteers, tasks (2 weeks) — *FR-12, FR-13, FR-14, extra N*
- **DB:** `fundraisers, tasks, volunteer_hours, volunteer_points`.
- **API/UI:** fundraiser CRUD with live progress (sum of income tagged to fundraiser), Kanban/table tasks, volunteer profiles (skills, availability, history), hour logging with approval, volunteer dashboard, leaderboard and badges.
- **Done when:** Bake Sale scenario works end to end; progress % and task status visible at a glance.

### Phase 8 — Finance and reimbursements (2.5 weeks) — *FR-15 to FR-18, FR-21, NFR-08*
- **DB:** `expenses, reimbursements, budgets`, append-only ledger trigger, reimbursement transition function.
- **API/UI:** income and expense screens, receipt upload via signed URLs, reimbursement workflow with approvals, budget vs actual, **financial dashboard** (income, expenses, balance, pending reimbursements, revenue by source), financial reports (income statement, cash balance, event profitability, merchandise, fundraising, reimbursement).
- **Done when:** dashboard totals equal the ledger exactly; paid reimbursement creates one expense ledger row; ledger rows cannot be edited or deleted; treasurer-only actions are blocked for others.

### Phase 9 — Reports, analytics, role dashboards (2 weeks) — *FR-19–21, section 14, extras A, B*
- **API/UI:** reports hub with date ranges and CSV/PDF export (server-generated, org-scoped), analytics (membership growth/retention/renewal rate, event registration/attendance/profit, cash flow, budget variance, volunteer participation), club dashboard for admin, per-role home dashboards.
- **Perf:** materialized views or summary tables refreshed by cron for heavy charts (NFR-01).
- **Done when:** report totals reconcile with source tables; exports contain only the current org.

### Phase 10 — Product differentiators (2.5 weeks) — *extras C, G, I, J, K, L, M, N*
- Digital certificates (PDF with QR + public verify page), event feedback + analytics, sponsor and sponsorship management with contracts, donations (public page, anonymous option, receipts), event profitability screen, automated notification rules (expiry, ticket, event reminder, payment, stock, task deadline, reimbursement, fundraiser deadline), volunteer gamification.
- **Done when:** certificate only issues for attended tickets; sponsorship/donation payments appear in finance automatically.

### Phase 11 — SaaS layer (2 weeks) — *section 10–17, NFR-02*
- Platform admin console (organizations, onboarding approval, hierarchy tree, org types), plans and feature flags (limits like max members enforced in API), subscription billing (Razorpay subscriptions/Stripe), custom branding, module toggles, integrations settings (adapters for email, WhatsApp, SMS, Google/Microsoft login, calendar, S3/Cloudinary), public API keys + webhooks (Enterprise).
- **Done when:** a new college can self-onboard, pick a plan, and its data is isolated; exceeding the Free plan limit shows an upgrade prompt.

### Phase 12 — AI layer (2.5 weeks) — *extras D, E, F; section 15*
- **Architecture:** Claude called from the Node API with a system prompt that fixes `org_id`; tools are **server-side functions** (`getExpenses`, `getEventStats`, `listUnpaidReimbursements`, `listMembersNotRenewed`, …) that execute through org-scoped services under the caller's role. The model never receives a database connection or other orgs' data. Responses are logged in `ai_conversations`.
- **Features:** Organization Copilot (natural-language Q&A), Financial Insights (unusual expenses, overspending, budget deviation, low-revenue events, pending reimbursements), AI Event Planner (venue, budget split, volunteers, tasks, timeline, pricing, promotion), Smart Volunteer Allocation (skills + availability → best volunteer per task), event recommendation (attendance history + category + department), simple prediction (expected attendance/revenue from past events).
- **Safeguards:** role-gated tools (volunteer cannot ask finance questions), prompt-injection filtering on user-provided text, rate limits, cost caps per plan.
- **Done when:** the Tech Club Copilot answers only with Tech Club data, refuses cross-club questions, and numbers match the dashboard.

### Phase 13 — Hardening and launch (2.5 weeks) — *all NFRs*
- Security review (OWASP, RLS audit, service-role usage audit, rate limiting, secrets rotation), load tests (k6) for ticket sale spikes and check-in, accessibility audit (WCAG AA), backup and restore drill (Supabase PITR + weekly logical dump, tested restore), monitoring and alerts (Sentry, uptime, DB slow queries), data export per org, privacy policy/terms, documentation, staging UAT with a real club, then production release.
- **Done when:** go-live checklist (section 12) is fully ticked.

**Rough total:** ~28–30 weeks for a 2–3 person team. A usable **MVP (Phases 0–8)** is about 18 weeks and covers every item marked "Must Have" in the requirements list.

---

## 8. NFR implementation map

| NFR | How it is implemented | Verified by |
|---|---|---|
| NFR-01 Performance | Indexes on `(org_id, …)`, TanStack Query caching, pagination, summary views, CDN for web, QR check-in is a single indexed UPDATE | k6: dashboard < 2–3 s, search < 2 s, check-in p95 < 1 s |
| NFR-02 Scalability | `org_id` partitioning-ready schema, stateless API (horizontal scale), hierarchy tables, read replicas later | Load test with 100 orgs × 10k members seed |
| NFR-03 Security | Supabase Auth, RBAC, RLS, Zod validation, Helmet, rate limit, signed URLs, encrypted integration secrets, audit logs | Cross-tenant suite, OWASP checklist, pen-test |
| NFR-04 Availability | Managed Supabase/Vercel, health checks, graceful retries, offline-queue check-in PWA, status page | Uptime monitor, failover drill |
| NFR-05 Reliability | Row locks, check constraints, unique keys (`provider_payment_id`, check-in `WHERE status='valid'`), idempotent webhooks, reservation expiry | Concurrency tests |
| NFR-06 Usability | Mobile-first UI, PWA, minimal forms, QR everywhere, clear empty/error states | Usability test with 5 students, Lighthouse |
| NFR-07 Maintainability | Modular services, shared Zod types, OpenAPI, ADRs, conventional commits, CI | Coverage gate, docs review |
| NFR-08 Data integrity | Append-only ledger, FKs, transactions, payment→ledger linkage, integer money | Reconciliation job (ledger vs payments) |
| NFR-09 Backup & recovery | Supabase PITR, nightly dumps to separate storage, per-org export endpoint, quarterly restore drill | Documented restore test |
| NFR-10 Auditability | `audit_row()` trigger (user, action, timestamp, old/new value) on sensitive tables, immutable audit table, Audit Log UI | Tests assert rows exist for each sensitive action |

---

## 9. Testing strategy

- **Unit:** pricing rules (member vs non-member, discounts), reimbursement transitions, QR signing, audience resolver.
- **Database (pgTAP):** for every table, user of Club A gets zero rows of Club B for select/insert/update/delete; role matrix tests per policy.
- **API integration (Supertest):** each endpoint with each role, plus wrong-org attempts (expect 403/404).
- **Concurrency:** parallel ticket purchases, parallel merch orders, double check-in, duplicate webhooks.
- **E2E (Playwright):** the 6 demo flows — new member, event + ticket + check-in, merchandise, fundraiser, reimbursement, tenant isolation.
- **Non-functional:** k6 load, axe accessibility, Lighthouse.
- **Gate:** PR cannot merge unless lint, types, unit, pgTAP RLS, and API tests pass.

---

## 10. Environments and configuration

| Env | Purpose | Notes |
|---|---|---|
| local | Supabase CLI (`supabase start`) + API + web | seed with 3 demo clubs |
| staging | Full copy, Razorpay **test mode** | UAT with real club users |
| production | Live | PITR on, alerts on, service-role key only in API/jobs |

Required env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (API only), `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET`, `QR_SIGNING_SECRET`, `EMAIL_API_KEY`, `ANTHROPIC_API_KEY`, `SENTRY_DSN`, `APP_BASE_URL`.

---

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Cross-tenant data leak | RLS + API checks + automated cross-tenant tests on every PR; service-role usage reviewed |
| Overselling under load | Row locks + constraint + concurrency tests + reservation expiry |
| Payment/webhook failures | Idempotency keys, retries, reconciliation job, manual reconcile screen |
| Scope too large | Build MVP (Phases 0–8) first; ship to one real club; add differentiators later |
| AI data exposure or cost | Tool-only access, role gating, per-plan quotas, logging |
| Email deliverability | SPF/DKIM, queue with retries, in-app fallback |
| Poor check-in connectivity | PWA with offline queue and cached ticket list for the event |

---

## 12. Go-live checklist

- [ ] All 20 "Must Have" items from the requirements list work in staging.
- [ ] Cross-tenant suite passes; RLS enabled and forced on all tables.
- [ ] Razorpay live keys, webhook verified, refund flow tested.
- [ ] Backups enabled and one restore drill completed.
- [ ] Load test passed for a 500-ticket sale spike.
- [ ] WCAG AA and mobile (360 px) checks passed.
- [ ] Privacy policy, terms, and data-export/delete process published.
- [ ] Monitoring and on-call alerts configured.
- [ ] Pilot club trained; feedback loop open.

---

## 13. Traceability: requirement to phase

| Requirement | Phase |
|---|---|
| FR-01, FR-02, FR-20 | 2 |
| FR-03, FR-04 | 3 |
| FR-05, FR-06, FR-19 | 4 |
| FR-07, FR-08 | 5 |
| FR-09, FR-10, FR-11 | 6 |
| FR-12, FR-13, FR-14 | 7 |
| FR-15, FR-16, FR-17, FR-18, FR-21 | 8 |
| Reports/analytics, role dashboards (A, B) | 9 |
| Extras C, G, H, I, J, K, L, M, N | 2, 5, 10 |
| Extra O (inventory & procurement) | 6 |
| Business features 10–17 | 11 |
| AI features D, E, F, section 15 | 12 |
| NFR-01…NFR-10 | 1 (security), 3–4 (reliability), 13 (all, verified) |
