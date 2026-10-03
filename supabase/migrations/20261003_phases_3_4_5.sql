-- ==============================================================================
-- ClubSphere: Full Unified Migration for Phases 3, 4, and 5
-- Copy & paste this directly into your Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Setup Extensions
create extension if not exists "pgcrypto";

-- 2. Custom Types & Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type event_status as enum ('draft','published','closed','completed','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending','paid','failed','refunded','partially_refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type ticket_status as enum ('reserved','valid','used','cancelled','refunded');
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

-- ------------------------------------------------------------------------------
-- PHASE 3 TABLES: Events, Orders, Tickets, Payments, Ledger
-- ------------------------------------------------------------------------------

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  title text not null,
  description text,
  category text default 'Workshop',
  starts_at timestamptz not null default (now() + interval '7 days'),
  ends_at timestamptz,
  location text not null default 'Main Campus Auditorium',
  organizer_id uuid,
  capacity int not null check (capacity >= 0),
  tickets_sold int not null default 0 check (tickets_sold <= capacity),
  member_price bigint not null default 0,
  non_member_price bigint not null default 0,
  registration_deadline timestamptz,
  status event_status not null default 'published',
  budget bigint default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ticket_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  event_id uuid not null references events(id) on delete cascade,
  buyer_member_id uuid,
  buyer_user_id uuid,
  buyer_name text not null,
  buyer_email text not null,
  total bigint not null default 0,
  payment_status payment_status not null default 'pending',
  reserved_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  event_id uuid not null references events(id) on delete cascade,
  order_id uuid not null references ticket_orders(id) on delete cascade,
  ticket_no text not null unique,
  attendee_member_id uuid,
  attendee_name text not null,
  attendee_email text,
  kind text not null check (kind in ('member','non_member')),
  price bigint not null default 0,
  status ticket_status not null default 'valid',
  qr_token text not null,
  seat_number text,
  checked_in_at timestamptz,
  checked_in_by uuid,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text unique,
  idempotency_key text unique,
  amount bigint not null,
  currency text not null default 'INR',
  status payment_status not null default 'paid',
  purpose text not null default 'ticket',
  ref_type text not null default 'event',
  ref_id uuid not null,
  payer_member_id uuid,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  direction ledger_direction not null default 'income',
  category text not null default 'ticket',
  amount bigint not null check (amount > 0),
  occurred_on date not null default current_date,
  event_id uuid references events(id) on delete set null,
  payment_id uuid references payments(id) on delete set null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- Atomic Ticket Reservation Procedure
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
      ev.org_id, ev.id, ord_id,
      'TKT-' || upper(substr(md5(random()::text), 1, 8)),
      p_buyer->>'name', p_buyer->>'email',
      case when is_member then 'member' else 'non_member' end,
      unit_price, 'reserved',
      encode(hmac(ev.id::text || ord_id::text || i::text, 'clubsphere_qr_secret', 'sha256'), 'hex'),
      'Pass #' || (ev.tickets_sold - p_qty + i)
    );
  end loop;

  return ord_id;
end;
$$;

-- ------------------------------------------------------------------------------
-- PHASE 4: Check-in, Verification & Attendance Function
-- ------------------------------------------------------------------------------

create index if not exists idx_tickets_checkin on tickets (org_id, event_id, status);
create index if not exists idx_tickets_ticket_no on tickets (ticket_no);
create index if not exists idx_tickets_qr_token on tickets (qr_token);

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
    return jsonb_build_object('status', 'INVALID', 'message', 'Ticket not found. Invalid code.');
  end if;

  if tkt.org_id <> p_org_id then
    return jsonb_build_object('status', 'WRONG_ORGANIZATION', 'message', 'Cross-tenant violation: Ticket belongs to another club!');
  end if;

  if tkt.status = 'used' then
    return jsonb_build_object(
      'status', 'ALREADY_USED',
      'message', 'Ticket has already been scanned!',
      'ticket_no', tkt.ticket_no,
      'checked_in_at', tkt.checked_in_at,
      'attendee_name', tkt.attendee_name
    );
  end if;

  if tkt.status in ('cancelled', 'refunded') then
    return jsonb_build_object('status', 'CANCELLED', 'message', 'Entry denied: Ticket is cancelled/refunded.');
  end if;

  update tickets
  set status = 'used', checked_in_at = now(), checked_in_by = p_scanner_id
  where id = tkt.id and status in ('valid', 'reserved')
  returning * into tkt;

  if not found then
    return jsonb_build_object('status', 'RACE_CONDITION_DETECTED', 'message', 'Simultaneous check-in rejected.');
  end if;

  select * into ev from events where id = tkt.event_id;

  return jsonb_build_object(
    'status', 'VALID',
    'message', 'Check-in successful! Welcome ' || tkt.attendee_name,
    'ticket_no', tkt.ticket_no,
    'attendee_name', tkt.attendee_name,
    'event_title', ev.title,
    'kind', tkt.kind,
    'seat_number', tkt.seat_number,
    'checked_in_at', tkt.checked_in_at
  );
end;
$$;

-- ------------------------------------------------------------------------------
-- PHASE 5: Announcements & In-App Notifications
-- ------------------------------------------------------------------------------

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  title text not null,
  body text not null,
  audience announce_audience not null default 'all',
  audience_ref uuid,
  channels text[] not null default '{website,email,in_app}',
  status announce_status not null default 'published',
  scheduled_at timestamptz,
  published_at timestamptz default now(),
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists announcement_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  announcement_id uuid not null references announcements(id) on delete cascade,
  recipient_email text not null,
  recipient_name text,
  channel text not null default 'email',
  status text not null default 'delivered',
  sent_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  user_email text not null,
  type text not null default 'announcement',
  title text not null,
  body text,
  link text,
  payload jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications (user_email, read_at);
create index if not exists idx_announcements_org on announcements (org_id, status);

-- Enable RLS
alter table events enable row level security;
alter table tickets enable row level security;
alter table ticket_orders enable row level security;
alter table payments enable row level security;
alter table ledger_entries enable row level security;
alter table announcements enable row level security;
alter table notifications enable row level security;

-- Public read policies for published events and public announcements
drop policy if exists events_public_read on events;
create policy events_public_read on events for select using (status = 'published');

drop policy if exists announcements_public_read on announcements;
create policy announcements_public_read on announcements for select using (status = 'published');

-- Insert initial sample seed event if none exist
insert into events (id, title, description, category, starts_at, ends_at, location, capacity, tickets_sold, member_price, non_member_price)
values (
  'e1111111-1111-1111-1111-111111111111'::uuid,
  'CHARUSAT 24h Hackathon 2026',
  'Annual state-level hackathon with web3, AI, and robotics tracks. ₹1,50,000 in prizes!',
  'Hackathon',
  now() + interval '5 days',
  now() + interval '6 days',
  'Central Computing Labs & Seminar Hall B',
  200,
  64,
  150,
  350
) on conflict (id) do nothing;
