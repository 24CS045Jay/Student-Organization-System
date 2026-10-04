-- ==============================================================================
-- ClubSphere Master Supabase Database Quickstart Schema
-- Multi-Tenant Campus OS with Real-Time Persistence & Zero-Lock RLS
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
create extension if not exists pgcrypto;

-- 2. Master Clubs / Organizations Table
create table if not exists public.clubs (
  id text primary key,
  name text not null,
  short_name text not null,
  prefix text not null default 'CLB',
  category text not null default 'General',
  department text default 'Student Affairs',
  faculty_advisor text default '',
  email_domain text not null,
  contact_email text,
  brand_color text default '#FFE853',
  membership_fee numeric default 500,
  initial_grant numeric default 10000,
  status text default 'active',
  created_at timestamptz default now()
);

-- 3. Users & Credential Registry Table
create table if not exists public.users (
  id text primary key,
  club_id text not null,
  name text not null,
  personal_email text,
  assigned_club_email text unique not null,
  password_hash text not null,
  role text not null default 'student',
  student_roll_no text default '',
  department text default '',
  phone text default '',
  is_active boolean default true,
  password_changed boolean default false,
  created_at timestamptz default now()
);

-- 4. Members Table
create table if not exists public.members (
  id text primary key,
  club_id text not null,
  name text not null,
  email text not null,
  personal_email text default '',
  student_id text default '',
  department text default '',
  membership_type text default 'Standard Member',
  start_date date default current_date,
  expiry_date date default (current_date + interval '1 year'),
  is_paid boolean default true,
  status text default 'Active',
  created_at timestamptz default now()
);

-- 5. Events Table
create table if not exists public.events (
  id text primary key,
  club_id text not null,
  title text not null,
  category text default 'Workshop',
  event_date date not null default current_date,
  event_time text default '10:00 AM',
  location text default 'Campus Auditorium',
  capacity integer default 100,
  sold_count integer default 0,
  member_price numeric default 0,
  non_member_price numeric default 150,
  status text default 'Published',
  description text default '',
  created_at timestamptz default now()
);

-- 6. Tickets & Digital QR Entry Table
create table if not exists public.tickets (
  id text primary key,
  club_id text not null,
  event_id text,
  attendee_name text not null,
  attendee_email text not null,
  is_member boolean default false,
  price_paid numeric default 0,
  status text default 'Valid',
  seat_identifier text default '',
  qr_token text,
  payment_id text default '',
  checked_in_at timestamptz,
  created_at timestamptz default now()
);

-- 7. Kanban Operational Tasks Table
create table if not exists public.tasks (
  id text primary key,
  club_id text not null,
  title text not null,
  owner_name text default 'Unassigned',
  event_id text,
  event_name text default 'General Operations',
  deadline date default (current_date + interval '7 days'),
  priority text default 'Medium',
  status text default 'Pending',
  progress_pct integer default 0,
  notes text default '',
  created_at timestamptz default now()
);

-- 8. Volunteer Operations & Service Hours Table
create table if not exists public.volunteers (
  id text primary key,
  club_id text not null,
  name text not null,
  email text not null,
  phone text default '',
  role_title text default 'Volunteer',
  service_hours numeric default 0,
  badge_tier text default 'Bronze Contributor',
  rating numeric default 5.0,
  skills text[] default '{}',
  created_at timestamptz default now()
);

-- 9. Expense Reimbursements Table
create table if not exists public.reimbursements (
  id text primary key,
  club_id text not null,
  volunteer_name text not null,
  volunteer_email text not null,
  category text default 'Supplies',
  event_title text default '',
  amount numeric default 0,
  claim_date date default current_date,
  description text default '',
  receipt_url text default '',
  status text default 'Submitted',
  approved_by text default '',
  created_at timestamptz default now()
);

-- 10. Merchandise & POS Inventory Table
create table if not exists public.products (
  id text primary key,
  club_id text not null,
  name text not null,
  description text default '',
  category text default 'Apparel',
  image text default '👕',
  member_price numeric default 0,
  non_member_price numeric default 0,
  cost numeric default 0,
  stock jsonb default '{"S": 10, "M": 20, "L": 15, "XL": 5}'::jsonb,
  total_sold integer default 0,
  status text default 'In Stock',
  created_at timestamptz default now()
);

-- 11. Financial Ledger & Audit Trail Table
create table if not exists public.financial_ledger (
  id text primary key,
  club_id text not null,
  type text not null default 'INCOME',
  category text default 'General',
  title text not null,
  amount numeric not null default 0,
  approved_by text default 'Treasurer',
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- Permissive Security Policies (RLS) for Seamless Web Client Access
-- ------------------------------------------------------------------------------
alter table public.clubs enable row level security;
alter table public.users enable row level security;
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.tickets enable row level security;
alter table public.tasks enable row level security;
alter table public.volunteers enable row level security;
alter table public.reimbursements enable row level security;
alter table public.products enable row level security;
alter table public.financial_ledger enable row level security;

-- Drop existing policies if any
drop policy if exists "allow_all_clubs" on public.clubs;
drop policy if exists "allow_all_users" on public.users;
drop policy if exists "allow_all_members" on public.members;
drop policy if exists "allow_all_events" on public.events;
drop policy if exists "allow_all_tickets" on public.tickets;
drop policy if exists "allow_all_tasks" on public.tasks;
drop policy if exists "allow_all_volunteers" on public.volunteers;
drop policy if exists "allow_all_reimbursements" on public.reimbursements;
drop policy if exists "allow_all_products" on public.products;
drop policy if exists "allow_all_financial_ledger" on public.financial_ledger;

-- Create full read/write policies for public anon & authenticated access
create policy "allow_all_clubs" on public.clubs for all using (true) with check (true);
create policy "allow_all_users" on public.users for all using (true) with check (true);
create policy "allow_all_members" on public.members for all using (true) with check (true);
create policy "allow_all_events" on public.events for all using (true) with check (true);
create policy "allow_all_tickets" on public.tickets for all using (true) with check (true);
create policy "allow_all_tasks" on public.tasks for all using (true) with check (true);
create policy "allow_all_volunteers" on public.volunteers for all using (true) with check (true);
create policy "allow_all_reimbursements" on public.reimbursements for all using (true) with check (true);
create policy "allow_all_products" on public.products for all using (true) with check (true);
create policy "allow_all_financial_ledger" on public.financial_ledger for all using (true) with check (true);

-- Grant privileges to anon and authenticated roles
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- Enable Supabase Realtime for live cross-device synchronizations
do $$ begin
  alter publication supabase_realtime add table public.clubs;
  alter publication supabase_realtime add table public.users;
  alter publication supabase_realtime add table public.events;
  alter publication supabase_realtime add table public.tasks;
  alter publication supabase_realtime add table public.members;
  alter publication supabase_realtime add table public.tickets;
  alter publication supabase_realtime add table public.volunteers;
  alter publication supabase_realtime add table public.reimbursements;
  alter publication supabase_realtime add table public.products;
  alter publication supabase_realtime add table public.financial_ledger;
exception when others then null;
end $$;
