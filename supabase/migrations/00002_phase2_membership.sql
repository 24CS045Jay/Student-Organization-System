-- Phase 2: Membership

create table membership_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  name text not null, price bigint not null default 0, duration_months int not null default 12,
  benefits text, ticket_discount_pct int not null default 0, merch_discount_pct int not null default 0,
  active boolean not null default true
);

create table members (
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
  membership_no text not null,
  status member_status not null default 'pending',
  dues dues_status not null default 'unpaid',
  starts_on date not null, expires_on date not null,
  renewal_of uuid references memberships(id),
  qr_secret text not null default encode(gen_random_bytes(16),'hex'),
  created_at timestamptz not null default now(),
  unique (org_id, membership_no)
);
create index on memberships (org_id, status, expires_on);

create table renewal_reminders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  membership_id uuid not null references memberships(id),
  days_before int not null, sent_at timestamptz, channel text default 'email',
  unique (membership_id, days_before)
);
