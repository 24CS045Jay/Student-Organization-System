-- Phase 0 Foundation: Extensions, Enums, and Helpers

create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

create type org_role as enum ('student','volunteer','event_manager','treasurer','admin');
create type org_type as enum ('technical','cultural','sports','chapter','ngo','society','committee','fest','hackathon','other');
create type member_status as enum ('pending','active','expired','inactive');
create type dues_status as enum ('unpaid','paid','waived','refunded');
create type event_status as enum ('draft','published','closed','completed','cancelled');
create type payment_status as enum ('pending','paid','failed','refunded','partially_refunded');
create type ticket_status as enum ('reserved','valid','used','cancelled','refunded');
create type order_status as enum ('placed','paid','ready','collected','delivered','cancelled');
create type task_status as enum ('pending','in_progress','done','blocked');
create type reimb_status as enum ('submitted','manager_approved','treasurer_approved','paid','rejected');
create type ledger_direction as enum ('income','expense');
create type announce_status as enum ('draft','scheduled','published','archived');

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
