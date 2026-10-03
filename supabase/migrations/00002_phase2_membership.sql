-- Phase 2: Membership (FR-01, FR-02, FR-20, extras C, H)

-- 1. Org Sequence Generator for Membership Numbers (e.g. TC-000123)
create table if not exists org_sequences (
  org_id uuid not null references organizations(id) on delete cascade,
  seq_name text not null,
  current_val int not null default 0,
  primary key (org_id, seq_name)
);

create or replace function next_org_sequence(p_org uuid, p_seq text) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_val int;
begin
  insert into org_sequences(org_id, seq_name, current_val)
  values (p_org, p_seq, 1)
  on conflict (org_id, seq_name)
  do update set current_val = org_sequences.current_val + 1
  returning current_val into v_val;
  return v_val;
end;
$$;

create or replace function generate_membership_no(p_org uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_prefix text;
  v_num int;
begin
  select upper(coalesce(substring(slug from 1 for 3), 'ORG'))
  into v_prefix
  from organizations
  where id = p_org;

  if v_prefix is null or length(v_prefix) = 0 then
    v_prefix := 'ORG';
  end if;

  v_num := next_org_sequence(p_org, 'membership');
  return v_prefix || '-' || lpad(v_num::text, 6, '0');
end;
$$;

-- 2. Membership Types
create table membership_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  price bigint not null default 0, -- stored in paise (e.g. 49900 = 499 INR)
  duration_months int not null default 12,
  benefits text,
  ticket_discount_pct int not null default 0,
  merch_discount_pct int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_membership_types_updated_at
  before update on membership_types
  for each row execute function set_updated_at();

-- 3. Members
create table members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  student_id text,
  department_id uuid references departments(id) on delete set null,
  skills text[] default '{}',
  availability jsonb default '{}',
  mailing_subscribed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, email)
);

create index on members (org_id, email);
create index on members (org_id, user_id);

create trigger trg_members_updated_at
  before update on members
  for each row execute function set_updated_at();

-- 4. Memberships
create table memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  type_id uuid not null references membership_types(id) on delete restrict,
  membership_no text not null,
  status member_status not null default 'pending',
  dues dues_status not null default 'unpaid',
  starts_on date not null default current_date,
  expires_on date not null,
  renewal_of uuid references memberships(id) on delete set null,
  qr_secret text not null default encode(gen_random_bytes(16),'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, membership_no)
);

create index on memberships (org_id, status, expires_on);
create index on memberships (member_id);

create trigger trg_memberships_updated_at
  before update on memberships
  for each row execute function set_updated_at();

-- 5. Renewal Reminders Log
create table renewal_reminders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  membership_id uuid not null references memberships(id) on delete cascade,
  days_before int not null,
  sent_at timestamptz not null default now(),
  channel text not null default 'email',
  unique (membership_id, days_before)
);

-- 6. Attach Audit Triggers
create trigger trg_audit_membership_types after insert or update or delete on membership_types
  for each row execute function audit_row();

create trigger trg_audit_members after insert or update or delete on members
  for each row execute function audit_row();

create trigger trg_audit_memberships after insert or update or delete on memberships
  for each row execute function audit_row();

-- 7. Row Level Security Policies
-- Enable and force RLS
alter table membership_types enable row level security;
alter table membership_types force row level security;

alter table members enable row level security;
alter table members force row level security;

alter table memberships enable row level security;
alter table memberships force row level security;

alter table renewal_reminders enable row level security;
alter table renewal_reminders force row level security;

-- membership_types policies
create policy types_read on membership_types for select
  using (is_platform_admin() or is_org_member(org_id) or active = true);

create policy types_write on membership_types for all
  using (is_platform_admin() or has_org_role(org_id, '{admin}'))
  with check (is_platform_admin() or has_org_role(org_id, '{admin}'));

-- members policies
create policy members_read on members for select
  using (
    is_platform_admin() 
    or has_org_role(org_id, '{admin,treasurer,event_manager,volunteer}')
    or (is_org_member(org_id) and user_id = auth.uid())
  );

create policy members_write on members for all
  using (is_platform_admin() or has_org_role(org_id, '{admin}'))
  with check (is_platform_admin() or has_org_role(org_id, '{admin}'));

create policy members_self_update on members for update
  using (is_org_member(org_id) and user_id = auth.uid())
  with check (is_org_member(org_id) and user_id = auth.uid());

-- memberships policies
create policy memberships_read on memberships for select
  using (
    is_platform_admin()
    or has_org_role(org_id, '{admin,treasurer,event_manager}')
    or member_id in (select id from members where user_id = auth.uid() and org_id = memberships.org_id)
  );

create policy memberships_write on memberships for all
  using (is_platform_admin() or has_org_role(org_id, '{admin}'))
  with check (is_platform_admin() or has_org_role(org_id, '{admin}'));

-- renewal_reminders policies
create policy reminders_read on renewal_reminders for select
  using (is_platform_admin() or has_org_role(org_id, '{admin,treasurer}'));

create policy reminders_write on renewal_reminders for all
  using (is_platform_admin() or has_org_role(org_id, '{admin}'))
  with check (is_platform_admin() or has_org_role(org_id, '{admin}'));

-- 8. Daily Expiry and Renewal Reminders Job (Callable via cron or edge function)
create or replace function check_membership_expiries_and_reminders()
returns table(expired_count int, reminders_created int)
language plpgsql security definer set search_path = public as $$
declare
  v_expired int;
  v_reminders int := 0;
  r record;
begin
  -- 1. Mark expired active memberships
  update memberships
  set status = 'expired'
  where status = 'active' and expires_on < current_date;
  get diagnostics v_expired = row_count;

  -- 2. Identify 30-day, 15-day, and 3-day reminder targets
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
