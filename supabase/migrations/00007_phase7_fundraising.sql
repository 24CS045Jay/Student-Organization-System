-- Phase 7: Fundraising, volunteers, tasks

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
