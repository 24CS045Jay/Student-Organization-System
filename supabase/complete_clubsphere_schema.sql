-- =====================================================================
-- ClubSphere — Complete Master Supabase Postgres Schema (Phases 0 to 13)
-- Multi-tenant SaaS with Row Level Security (RLS), RBAC, Atomic Business Functions
-- Money is stored in integer PAISE (bigint, e.g. ₹500 = 50000).
-- =====================================================================

-- ---------------------------------------------------------------------
-- PART 0: EXTENSIONS & ENUMS
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists pg_cron;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'org_role') then
    create type org_role as enum ('student','volunteer','event_manager','treasurer','admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'org_type') then
    create type org_type as enum ('technical','cultural','sports','chapter','ngo','society','committee','fest','hackathon','other');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_status') then
    create type member_status as enum ('pending','active','expired','inactive');
  end if;
  if not exists (select 1 from pg_type where typname = 'dues_status') then
    create type dues_status as enum ('unpaid','paid','waived','refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type event_status as enum ('draft','published','closed','completed','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending','paid','failed','refunded','partially_refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type ticket_status as enum ('reserved','valid','used','cancelled','refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('placed','paid','ready','collected','delivered','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('pending','in_progress','done','blocked');
  end if;
  if not exists (select 1 from pg_type where typname = 'reimb_status') then
    create type reimb_status as enum ('submitted','manager_approved','treasurer_approved','paid','rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'ledger_direction') then
    create type ledger_direction as enum ('income','expense');
  end if;
  if not exists (select 1 from pg_type where typname = 'announce_status') then
    create type announce_status as enum ('draft','scheduled','published','archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'announce_audience') then
    create type announce_audience as enum ('all','active_members','expired_members','event_attendees','volunteers','committee');
  end if;
end $$;

-- Standard updated_at trigger function
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin 
  new.updated_at = now(); 
  return new; 
end $$;

-- ---------------------------------------------------------------------
-- PART 1: PLATFORM, HIERARCHY & ORGANIZATIONS
-- ---------------------------------------------------------------------
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                       -- free | professional | enterprise
  name text not null,
  max_members int,                                 -- null = unlimited
  features jsonb not null default '{}',
  price_monthly bigint not null default 0
);

create table if not exists universities (
  id uuid primary key default gen_random_uuid(), 
  name text not null
);

create table if not exists colleges (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade, 
  name text not null
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade, 
  name text not null
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                       -- short prefix: TC, CC, SC
  slug text unique not null,
  name text not null,
  type org_type not null default 'other',
  university_id uuid references universities(id) on delete set null,
  college_id uuid references colleges(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  parent_org_id uuid references organizations(id) on delete set null,
  plan_id uuid references plans(id) on delete set null,
  logo_path text, 
  accent_color text default '#4CC9F0',
  contact_email text, 
  contact_phone text,
  settings jsonb not null default '{"reminder_days":[30,15,3],"currency":"INR"}',
  modules jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid not null references plans(id),
  status text not null default 'active',
  current_period_end timestamptz, 
  provider_ref text
);

create table if not exists org_counters (
  org_id uuid not null references organizations(id) on delete cascade,
  key text not null, 
  value bigint not null default 0,
  primary key (org_id, key)
);

-- ---------------------------------------------------------------------
-- PART 2: USERS, PROFILES & RBAC
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, 
  phone text, 
  avatar_path text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists org_users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role org_role not null,
  active boolean not null default true,
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (org_id, user_id, role)
);
create index if not exists idx_org_users_user_org on org_users (user_id, org_id);

-- Security Definer Tenant Helpers
create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from profiles where id = auth.uid()), false) $$;

create or replace function is_org_member(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from org_users where org_id = p_org and user_id = auth.uid() and active) $$;

create or replace function has_org_role(p_org uuid, p_roles org_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from org_users
                 where org_id = p_org and user_id = auth.uid() and active and role = any(p_roles)) $$;

-- ---------------------------------------------------------------------
-- PART 3: MEMBERSHIP & LIFECYCLE (FR-01, FR-02, FR-20)
-- ---------------------------------------------------------------------
create table if not exists membership_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, 
  price bigint not null default 0,
  duration_months int not null default 12 check (duration_months > 0),
  benefits text, 
  ticket_discount_pct int not null default 0,
  merch_discount_pct int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  full_name text not null, 
  email text not null, 
  phone text,
  student_id text, 
  department_id uuid references departments(id) on delete set null,
  skills text[] not null default '{}', 
  availability jsonb not null default '{}',
  mailing_subscribed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, email)
);
create index if not exists idx_members_org_user on members (org_id, user_id);

create or replace function my_member_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from members where user_id = auth.uid() $$;

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  type_id uuid not null references membership_types(id) on delete restrict,
  membership_no text not null,                     -- TC-000123
  status member_status not null default 'pending',
  dues dues_status not null default 'unpaid',
  starts_on date not null default current_date, 
  expires_on date not null check (expires_on >= starts_on),
  renewal_of uuid references memberships(id) on delete set null,
  qr_secret text not null default encode(gen_random_bytes(16),'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, membership_no)
);
create index if not exists idx_memberships_status_exp on memberships (org_id, status, expires_on);
create index if not exists idx_memberships_member on memberships (member_id);

create table if not exists renewal_reminders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  membership_id uuid not null references memberships(id) on delete cascade,
  days_before int not null, 
  channel text not null default 'email',
  created_at timestamptz not null default now(), 
  sent_at timestamptz,
  unique (membership_id, days_before)
);

-- ---------------------------------------------------------------------
-- PART 4: EVENTS, TICKETING & QR ATTENDANCE (FR-03 to FR-06, FR-19)
-- ---------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null, 
  description text, 
  category text default 'Workshop',
  starts_at timestamptz not null, 
  ends_at timestamptz, 
  location text,
  organizer_id uuid references profiles(id),
  capacity int not null check (capacity >= 0),
  tickets_sold int not null default 0 check (tickets_sold >= 0),
  member_price bigint not null default 0, 
  non_member_price bigint not null default 0,
  registration_deadline timestamptz,
  status event_status not null default 'draft',
  budget bigint default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tickets_sold <= capacity)
);
create index if not exists idx_events_org_starts on events (org_id, starts_at);

create table if not exists ticket_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  buyer_member_id uuid references members(id),
  buyer_user_id uuid references profiles(id),
  buyer_name text not null, 
  buyer_email text not null,
  qty int not null default 1 check (qty > 0), 
  total bigint not null check (total >= 0),
  payment_status payment_status not null default 'pending',
  reserved_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  order_id uuid not null references ticket_orders(id) on delete cascade,
  ticket_no text not null unique,
  attendee_member_id uuid references members(id),
  attendee_name text not null, 
  attendee_email text,
  kind text not null check (kind in ('member','non_member')),
  price bigint not null check (price >= 0),
  status ticket_status not null default 'reserved',
  qr_token text not null default encode(gen_random_bytes(16),'hex'),
  seat_number text,
  checked_in_at timestamptz, 
  checked_in_by uuid references profiles(id),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_tickets_org_event on tickets (org_id, event_id, status);
create index if not exists idx_tickets_ticket_no on tickets (ticket_no);
create index if not exists idx_tickets_qr_token on tickets (qr_token);

create table if not exists event_feedback (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  ticket_id uuid unique references tickets(id) on delete cascade,
  rating_overall int check (rating_overall between 1 and 5),
  rating_speaker int check (rating_speaker between 1 and 5),
  rating_organization int check (rating_organization between 1 and 5),
  rating_venue int check (rating_venue between 1 and 5),
  rating_content int check (rating_content between 1 and 5),
  comment text, 
  created_at timestamptz not null default now()
);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  ticket_id uuid not null unique references tickets(id) on delete cascade,
  certificate_no text unique not null,
  file_path text, 
  issued_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PART 5: FUNDRAISING, TASKS & VOLUNTEERS (FR-12 to FR-14)
-- ---------------------------------------------------------------------
create table if not exists fundraisers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null, 
  description text,
  target_amount bigint not null check (target_amount > 0),
  starts_on date, 
  ends_on date, 
  organizer_id uuid references profiles(id),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  fundraiser_id uuid references fundraisers(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  title text not null, 
  notes text,
  assignee_member_id uuid references members(id),
  deadline date, 
  priority int not null default 2 check (priority between 1 and 3),
  status task_status not null default 'pending',
  progress int not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists volunteer_hours (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  hours numeric(5,2) not null check (hours > 0), 
  worked_on date not null default current_date,
  approved_by uuid references profiles(id), 
  approved_at timestamptz
);

create table if not exists volunteer_points (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  points int not null, 
  reason text, 
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PART 6: FINANCE & REIMBURSEMENTS (FR-15 to FR-18, FR-21, NFR-08)
-- ---------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text unique,
  idempotency_key text unique,
  amount bigint not null check (amount >= 0), 
  currency text not null default 'INR',
  status payment_status not null default 'paid',
  purpose text not null,
  ref_type text not null, 
  ref_id uuid not null,
  payer_member_id uuid references members(id),
  raw jsonb default '{}'::jsonb, 
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  category text not null,
  description text, 
  amount bigint not null check (amount > 0),
  event_id uuid references events(id) on delete set null,
  fundraiser_id uuid references fundraisers(id) on delete set null,
  submitted_by_member uuid references members(id),
  spent_on date not null default current_date,
  receipt_path text,
  reimbursable boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  direction ledger_direction not null,
  category text not null,
  amount bigint not null check (amount > 0),
  occurred_on date not null default current_date,
  event_id uuid references events(id) on delete set null,
  fundraiser_id uuid references fundraisers(id) on delete set null,
  payment_id uuid references payments(id),
  expense_id uuid references expenses(id),
  member_id uuid references members(id),
  reverses_id uuid references ledger_entries(id),
  note text, 
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists reimbursements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  expense_id uuid not null unique references expenses(id) on delete cascade,
  status reimb_status not null default 'submitted',
  manager_id uuid references profiles(id), 
  manager_at timestamptz,
  treasurer_id uuid references profiles(id), 
  treasurer_at timestamptz,
  paid_at timestamptz, 
  payment_ref text, 
  reject_reason text,
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  category text not null, 
  amount bigint not null check (amount >= 0),
  period_start date, 
  period_end date
);

-- ---------------------------------------------------------------------
-- PART 7: COMMUNICATION & NOTIFICATIONS (FR-07, FR-08)
-- ---------------------------------------------------------------------
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null, 
  body text not null,
  audience text not null default 'all',
  audience_ref uuid,
  channels text[] not null default '{website,email,in_app}',
  status announce_status not null default 'published',
  scheduled_at timestamptz, 
  published_at timestamptz default now(),
  created_by uuid references profiles(id), 
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists announcement_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  announcement_id uuid not null references announcements(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  recipient_email text,
  recipient_name text,
  channel text not null default 'email', 
  status text not null default 'queued', 
  sent_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  user_email text,
  type text not null default 'announcement', 
  title text not null, 
  body text, 
  link text, 
  payload jsonb default '{}'::jsonb,
  read_at timestamptz, 
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PART 8: MERCHANDISE & INVENTORY (FR-09 to FR-11)
-- ---------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, 
  description text,
  category text not null default 'other',
  image_path text,
  member_price bigint not null check (member_price >= 0),
  non_member_price bigint not null check (non_member_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  size text not null, 
  sku text,
  opening_stock int not null default 0 check (opening_stock >= 0),
  added int not null default 0,
  reserved int not null default 0 check (reserved >= 0),
  sold int not null default 0 check (sold >= 0),
  on_hand int generated always as (opening_stock + added - sold) stored,
  check (opening_stock + added - sold - reserved >= 0),
  unique (product_id, size)
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  kind text not null,
  qty int not null, 
  ref_id uuid, 
  note text,
  created_by uuid references profiles(id), 
  created_at timestamptz not null default now()
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  supplier text, 
  status text not null default 'ordered', 
  total bigint,
  ordered_on date, 
  received_on date, 
  note text
);

create table if not exists merch_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  member_id uuid references members(id), 
  buyer_user_id uuid references profiles(id),
  buyer_name text not null, 
  buyer_email text not null,
  total bigint not null default 0, 
  status order_status not null default 'placed',
  payment_status payment_status not null default 'pending',
  fulfilment text not null default 'collect',
  expires_at timestamptz, 
  created_at timestamptz not null default now()
);

create table if not exists merch_order_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  order_id uuid not null references merch_orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  qty int not null check (qty > 0), 
  unit_price bigint not null,
  unique (order_id, variant_id)
);

-- ---------------------------------------------------------------------
-- PART 9: SPONSORS, DONATIONS, AUDIT & AI
-- ---------------------------------------------------------------------
create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, 
  contact_name text, 
  contact_email text, 
  contact_phone text
);

create table if not exists sponsorships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  sponsor_id uuid not null references sponsors(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  package text not null, 
  amount bigint not null check (amount > 0),
  benefits text[] not null default '{}', 
  contract_path text,
  payment_status payment_status not null default 'pending', 
  renewal_on date
);

create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  fundraiser_id uuid references fundraisers(id) on delete set null,
  donor_name text, 
  donor_email text, 
  anonymous boolean not null default false,
  amount bigint not null check (amount > 0),
  payment_id uuid references payments(id),
  receipt_no text unique, 
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  org_id uuid, 
  user_id uuid, 
  user_role text,
  action text not null, 
  table_name text, 
  record_id uuid,
  old_value jsonb, 
  new_value jsonb,
  ip inet,
  created_at timestamptz not null default now()
);

create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  kind text not null,
  config_encrypted text, 
  enabled boolean not null default false,
  unique (org_id, kind)
);

create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  messages jsonb not null default '[]', 
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PART 10: ATOMIC PROCEDURES, SEQUENCE GENERATORS & TRIGGERS
-- ---------------------------------------------------------------------

-- Next Number Counter (Atomic Sequence)
create or replace function next_seq(p_org uuid, p_key text) returns bigint
language plpgsql security definer set search_path = public as $$
declare 
  v bigint;
begin
  insert into org_counters(org_id, key, value) values (p_org, p_key, 1)
  on conflict (org_id, key) do update set value = org_counters.value + 1
  returning value into v;
  return v;
end $$;

-- Triggers for Auto-generating Formatted Numbers
create or replace function set_membership_no() returns trigger language plpgsql as $$
declare 
  p text;
begin
  if new.membership_no is null or new.membership_no = '' then
    select code into p from organizations where id = new.org_id;
    new.membership_no := coalesce(p, 'CS') || '-' || lpad(next_seq(new.org_id, 'membership')::text, 6, '0');
  end if;
  return new;
end $$;

create or replace trigger trg_membership_no 
  before insert on memberships 
  for each row execute function set_membership_no();

create or replace function set_ticket_no() returns trigger language plpgsql as $$
declare 
  p text;
begin
  if new.ticket_no is null or new.ticket_no = '' then
    select code into p from organizations where id = new.org_id;
    new.ticket_no := coalesce(p, 'CS') || '-EV-' || lpad(next_seq(new.org_id, 'ticket')::text, 6, '0');
  end if;
  return new;
end $$;

create or replace trigger trg_ticket_no 
  before insert on tickets 
  for each row execute function set_ticket_no();

-- Audit trigger function
create or replace function audit_row() returns trigger language plpgsql security definer as $$
begin
  insert into audit_logs(org_id, user_id, action, table_name, record_id, old_value, new_value)
  values (
    coalesce(new.org_id, old.org_id), 
    auth.uid(), 
    tg_op || '.' || tg_table_name, 
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

-- Attach Triggers for Timestamps and Audits
create or replace trigger trg_org_updated before update on organizations for each row execute function set_updated_at();
create or replace trigger trg_events_updated before update on events for each row execute function set_updated_at();
create or replace trigger trg_tasks_updated before update on tasks for each row execute function set_updated_at();
create or replace trigger trg_membership_types_updated before update on membership_types for each row execute function set_updated_at();
create or replace trigger trg_members_updated before update on members for each row execute function set_updated_at();
create or replace trigger trg_memberships_updated before update on memberships for each row execute function set_updated_at();

create or replace trigger trg_audit_membership_types after insert or update or delete on membership_types for each row execute function audit_row();
create or replace trigger trg_audit_members after insert or update or delete on members for each row execute function audit_row();
create or replace trigger trg_audit_memberships after insert or update or delete on memberships for each row execute function audit_row();
create or replace trigger trg_audit_events after insert or update or delete on events for each row execute function audit_row();
create or replace trigger trg_audit_expenses after insert or update or delete on expenses for each row execute function audit_row();
create or replace trigger trg_audit_reimbursements after insert or update or delete on reimbursements for each row execute function audit_row();

-- ---------------------------------------------------------------------
-- PART 11: CRITICAL BUSINESS FUNCTIONS
-- ---------------------------------------------------------------------

-- Atomic Ticket Reservation Procedure (Overselling Guard NFR-05)
create or replace function reserve_tickets(
  p_event uuid,
  p_qty int,
  p_buyer jsonb
) returns uuid
language plpgsql security definer as $$
declare
  ev events%rowtype;
  ord_id uuid;
  i int;
  unit_price bigint;
  is_member boolean;
begin
  select * into ev from events where id = p_event for update;

  if ev.id is null then raise exception 'EVENT_NOT_FOUND'; end if;
  if ev.status <> 'published' or (ev.registration_deadline is not null and now() > ev.registration_deadline) then
    raise exception 'EVENT_REGISTRATION_CLOSED';
  end if;
  if ev.tickets_sold + p_qty > ev.capacity then
    raise exception 'SOLD_OUT: Requested % seats but only % remaining', p_qty, (ev.capacity - ev.tickets_sold);
  end if;

  is_member := coalesce((p_buyer->>'is_member')::boolean, false);
  unit_price := case when is_member then ev.member_price else ev.non_member_price end;

  update events set tickets_sold = tickets_sold + p_qty where id = p_event;

  insert into ticket_orders (
    org_id, event_id, buyer_name, buyer_email, total, payment_status, reserved_until
  ) values (
    ev.org_id, ev.id, p_buyer->>'name', p_buyer->>'email', unit_price * p_qty, 'pending', now() + interval '10 minutes'
  ) returning id into ord_id;

  for i in 1..p_qty loop
    insert into tickets (
      org_id, event_id, order_id, ticket_no, attendee_name, attendee_email, kind, price, status, qr_token, seat_number
    ) values (
      ev.org_id, ev.id, ord_id, 'TKT-' || upper(substr(md5(random()::text), 1, 8)),
      p_buyer->>'name', p_buyer->>'email', case when is_member then 'member' else 'non_member' end,
      unit_price, 'reserved', encode(hmac(ev.id::text || ord_id::text || i::text, 'clubsphere_qr_secret', 'sha256'), 'hex'),
      'Pass #' || (ev.tickets_sold - p_qty + i)
    );
  end loop;

  return ord_id;
end;
$$;

-- Atomic Check-in Procedure (FR-05, FR-06, FR-19)
create or replace function check_in_ticket(
  p_ticket_identifier text,
  p_org_id uuid,
  p_scanner_id uuid default null
) returns jsonb
language plpgsql security definer as $$
declare
  tkt tickets%rowtype;
  ev events%rowtype;
begin
  select * into tkt from tickets
  where (ticket_no = upper(trim(p_ticket_identifier)) or qr_token = trim(p_ticket_identifier));

  if tkt.id is null then
    return jsonb_build_object('status', 'INVALID', 'message', 'Ticket not found. Barcode invalid.');
  end if;

  if tkt.org_id <> p_org_id then
    return jsonb_build_object('status', 'WRONG_ORGANIZATION', 'message', 'Cross-tenant violation: belongs to another club!');
  end if;

  if tkt.status = 'used' then
    return jsonb_build_object('status', 'ALREADY_USED', 'message', 'Ticket already scanned!', 'ticket_no', tkt.ticket_no, 'checked_in_at', tkt.checked_in_at, 'attendee_name', tkt.attendee_name);
  end if;

  if tkt.status = 'cancelled' or tkt.status = 'refunded' then
    return jsonb_build_object('status', 'CANCELLED', 'message', 'Entry denied: ticket cancelled or refunded.');
  end if;

  update tickets
  set status = 'used', checked_in_at = now(), checked_in_by = p_scanner_id
  where id = tkt.id and status in ('valid', 'reserved')
  returning * into tkt;

  if not found then
    return jsonb_build_object('status', 'RACE_CONDITION_DETECTED', 'message', 'Simultaneous scan detected. Duplicate rejected.');
  end if;

  select * into ev from events where id = tkt.event_id;

  return jsonb_build_object(
    'status', 'VALID',
    'message', 'Check-in successful! Welcome ' || tkt.attendee_name,
    'ticket_no', tkt.ticket_no,
    'attendee_name', tkt.attendee_name,
    'attendee_email', tkt.attendee_email,
    'event_title', ev.title,
    'kind', tkt.kind,
    'seat_number', tkt.seat_number,
    'checked_in_at', tkt.checked_in_at
  );
end;
$$;

-- Expiry Check & Automated Renewal Reminders Job
create or replace function check_membership_expiries_and_reminders()
returns table(expired_count int, reminders_created int)
language plpgsql security definer set search_path = public as $$
declare
  v_expired int;
  v_reminders int := 0;
  r record;
begin
  update memberships
  set status = 'expired'
  where status = 'active' and expires_on < current_date;
  get diagnostics v_expired = row_count;

  for r in
    select m.id as membership_id, m.org_id,
      case 
        when m.expires_on = current_date + interval '30 days' then 30
        when m.expires_on = current_date + interval '15 days' then 15
        when m.expires_on = current_date + interval '3 days' then 3
        else null
      end as days_left
    from memberships m
    where m.status = 'active'
      and m.expires_on in (
        current_date + interval '30 days',
        current_date + interval '15 days',
        current_date + interval '3 days'
      )
  loop
    if r.days_left is not null then
      insert into renewal_reminders (org_id, membership_id, days_before, sent_at, channel)
      values (r.org_id, r.membership_id, r.days_left, now(), 'email')
      on conflict (membership_id, days_before) do nothing;
      v_reminders := v_reminders + 1;
    end if;
  end loop;

  return query select v_expired, v_reminders;
end;
$$;

-- ---------------------------------------------------------------------
-- PART 12: ANALYTIC VIEWS
-- ---------------------------------------------------------------------
create or replace view view_event_attendance_stats as
select
  e.id as event_id,
  e.org_id,
  e.title as event_title,
  e.capacity,
  e.tickets_sold,
  count(t.id) filter (where t.status = 'used') as attended_count,
  count(t.id) filter (where t.status = 'valid') as expected_count,
  count(t.id) filter (where t.kind = 'member' and t.status = 'used') as member_attendees,
  count(t.id) filter (where t.kind = 'non_member' and t.status = 'used') as non_member_attendees,
  round((count(t.id) filter (where t.status = 'used')::numeric / nullif(e.tickets_sold, 0)) * 100, 1) as attendance_rate_pct
from events e
left join tickets t on t.event_id = e.id
group by e.id, e.org_id, e.title, e.capacity, e.tickets_sold;

-- ---------------------------------------------------------------------
-- PART 13: ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------
alter table organizations enable row level security;
alter table organizations force row level security;
alter table membership_types enable row level security;
alter table membership_types force row level security;
alter table members enable row level security;
alter table members force row level security;
alter table memberships enable row level security;
alter table memberships force row level security;
alter table events enable row level security;
alter table events force row level security;
alter table tickets enable row level security;
alter table tickets force row level security;
alter table expenses enable row level security;
alter table expenses force row level security;
alter table ledger_entries enable row level security;
alter table ledger_entries force row level security;
alter table reimbursements enable row level security;
alter table reimbursements force row level security;

-- Sample Policies
create policy if not exists orgs_platform on organizations for all using (is_platform_admin() or is_org_member(id));
create policy if not exists events_read on events for select using (status = 'published' or is_org_member(org_id));
create policy if not exists events_write on events for all using (has_org_role(org_id, '{admin,event_manager}'));
create policy if not exists tickets_read on tickets for select using (attendee_member_id in (select my_member_ids()) or has_org_role(org_id, '{admin,event_manager,treasurer}'));
create policy if not exists ledger_read on ledger_entries for select using (has_org_role(org_id, '{admin,treasurer}'));
create policy if not exists ledger_write on ledger_entries for insert with check (has_org_role(org_id, '{admin,treasurer}'));
