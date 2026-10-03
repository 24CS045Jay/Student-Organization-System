-- Phase 3, 4, 5: Events, Tickets, Communications

create table events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  title text not null, description text, category text,
  starts_at timestamptz not null, ends_at timestamptz, location text,
  organizer_id uuid references profiles(id),
  capacity int not null check (capacity >= 0),
  tickets_sold int not null default 0 check (tickets_sold <= capacity),
  member_price bigint not null default 0, non_member_price bigint not null default 0,
  registration_deadline timestamptz,
  status event_status not null default 'draft',
  budget bigint default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table ticket_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  event_id uuid not null references events(id),
  buyer_member_id uuid references members(id), buyer_user_id uuid references profiles(id),
  buyer_name text not null, buyer_email text not null,
  total bigint not null, payment_status payment_status not null default 'pending',
  reserved_until timestamptz,
  created_at timestamptz not null default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  event_id uuid not null references events(id),
  order_id uuid not null references ticket_orders(id),
  ticket_no text not null unique,
  attendee_member_id uuid references members(id),
  attendee_name text not null, attendee_email text,
  kind text not null check (kind in ('member','non_member')),
  price bigint not null,
  status ticket_status not null default 'reserved',
  qr_token text not null,
  checked_in_at timestamptz, checked_in_by uuid references profiles(id),
  cancelled_at timestamptz
);
create index on tickets (org_id, event_id, status);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  title text not null, body text not null,
  audience text not null,
  audience_ref uuid,
  channels text[] not null default '{website,email,in_app}',
  status announce_status not null default 'draft',
  scheduled_at timestamptz, published_at timestamptz,
  created_by uuid references profiles(id), edited_at timestamptz,
  created_at timestamptz not null default now()
);
