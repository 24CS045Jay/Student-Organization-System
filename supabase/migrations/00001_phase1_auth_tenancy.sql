-- Phase 1: Auth, Tenancy, RBAC

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

create table plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  max_members int,
  features jsonb not null default '{}',
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
  parent_org_id uuid references organizations(id),
  plan_id uuid references plans(id),
  logo_path text, accent_color text default '#4CC9F0',
  contact_email text, contact_phone text,
  settings jsonb not null default '{}',
  modules jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, phone text, avatar_path text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table org_users (
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

-- Audit
create table audit_logs (
  id bigint generated always as identity primary key,
  org_id uuid, user_id uuid, user_role text,
  action text not null,
  table_name text, record_id uuid,
  old_value jsonb, new_value jsonb, ip inet,
  created_at timestamptz not null default now()
);

create or replace function audit_row() returns trigger language plpgsql security definer as $$
begin
  insert into audit_logs(org_id,user_id,action,table_name,record_id,old_value,new_value)
  values (coalesce(new.org_id, old.org_id), auth.uid(), tg_op||'.'||tg_table_name, tg_table_name,
          coalesce(new.id, old.id),
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

-- Basic RLS
alter table organizations enable row level security;
alter table organizations force row level security;
create policy orgs_platform on organizations for all using (is_platform_admin() or is_org_member(id));
