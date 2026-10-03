-- ==============================================================================
-- Migration 05: Communication & Notifications (Phase 5: FR-07, FR-08, Extra G)
-- ==============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'announce_status') then
    create type announce_status as enum ('draft','scheduled','published','archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'announce_audience') then
    create type announce_audience as enum ('all','active_members','expired_members','event_attendees','volunteers','committee');
  end if;
end $$;

-- Announcements Table
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  title text not null,
  body text not null,
  audience announce_audience not null default 'all',
  audience_ref uuid, -- Optional reference (e.g. event_id)
  channels text[] not null default '{website,email,in_app}',
  status announce_status not null default 'published',
  scheduled_at timestamptz,
  published_at timestamptz default now(),
  created_by uuid,
  created_at timestamptz not null default now()
);

-- Announcement Deliveries Log
create table if not exists announcement_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  announcement_id uuid not null references announcements(id) on delete cascade,
  recipient_email text not null,
  recipient_name text,
  channel text not null default 'email',
  status text not null default 'delivered', -- queued, delivered, failed
  sent_at timestamptz default now()
);

-- In-App User Notifications Table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_email text not null,
  type text not null default 'announcement', -- announcement, ticket, payment, reminder
  title text not null,
  body text,
  link text,
  payload jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications (user_email, read_at);
create index if not exists idx_announcements_org on announcements (org_id, status);
