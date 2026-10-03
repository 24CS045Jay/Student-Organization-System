-- ==============================================================================
-- Migration 03: Events and Online Ticketing (Phase 3: FR-03, FR-04, NFR-05)
-- ==============================================================================

create extension if not exists "pgcrypto";

-- Event & payment status enums
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
end $$;

-- Events Table
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  title text not null,
  description text,
  category text default 'Workshop',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null,
  organizer_id uuid,
  capacity int not null check (capacity >= 0),
  tickets_sold int not null default 0 check (tickets_sold <= capacity), -- Overselling guard (NFR-05)
  member_price bigint not null default 0,
  non_member_price bigint not null default 0,
  registration_deadline timestamptz,
  status event_status not null default 'published',
  budget bigint default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ticket Orders Table
create table if not exists ticket_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
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

-- Tickets Table
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
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

-- Payments Table (with Razorpay provider tracking)
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text unique, -- Prevents duplicate payment processing (NFR-05)
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

-- Ledger Entries Table (Append-only Single Source of Financial Truth)
create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
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

-- Atomic Ticket Reservation Procedure (Prevents race conditions & overselling)
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
  -- Explicit row lock to prevent race conditions during ticket rush
  select * into ev from events where id = p_event for update;

  if ev.id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if ev.status <> 'published' or (ev.registration_deadline is not null and now() > ev.registration_deadline) then
    raise exception 'EVENT_REGISTRATION_CLOSED';
  end if;

  if ev.tickets_sold + p_qty > ev.capacity then
    raise exception 'SOLD_OUT: Requested % seats but only % remaining', p_qty, (ev.capacity - ev.tickets_sold);
  end if;

  is_member := coalesce((p_buyer->>'is_member')::boolean, false);
  unit_price := case when is_member then ev.member_price else ev.non_member_price end;

  -- Increment sold count atomically
  update events set tickets_sold = tickets_sold + p_qty where id = p_event;

  -- Create order record with 10-minute hold
  insert into ticket_orders (
    org_id, event_id, buyer_name, buyer_email, total, payment_status, reserved_until
  ) values (
    ev.org_id,
    ev.id,
    p_buyer->>'name',
    p_buyer->>'email',
    unit_price * p_qty,
    'pending',
    now() + interval '10 minutes'
  ) returning id into ord_id;

  -- Generate ticket rows
  for i in 1..p_qty loop
    insert into tickets (
      org_id,
      event_id,
      order_id,
      ticket_no,
      attendee_name,
      attendee_email,
      kind,
      price,
      status,
      qr_token,
      seat_number
    ) values (
      ev.org_id,
      ev.id,
      ord_id,
      'TKT-' || upper(substr(md5(random()::text), 1, 8)),
      p_buyer->>'name',
      p_buyer->>'email',
      case when is_member then 'member' else 'non_member' end,
      unit_price,
      'reserved',
      encode(hmac(ev.id::text || ord_id::text || i::text, 'clubsphere_qr_secret', 'sha256'), 'hex'),
      'Pass #' || (ev.tickets_sold - p_qty + i)
    );
  end loop;

  return ord_id;
end;
$$;
