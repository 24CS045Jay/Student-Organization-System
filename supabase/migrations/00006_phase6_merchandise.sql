-- Phase 6: Merchandise and inventory

create table products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  name text not null, description text, category text not null,
  image_path text, member_price bigint not null, non_member_price bigint not null,
  active boolean not null default true
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  product_id uuid not null references products(id),
  size text not null, sku text,
  opening_stock int not null default 0,
  added int not null default 0,
  reserved int not null default 0 check (reserved >= 0),
  sold int not null default 0 check (sold >= 0),
  on_hand int generated always as (opening_stock + added - sold) stored,
  check (opening_stock + added - sold - reserved >= 0),
  unique (product_id, size)
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  variant_id uuid not null references product_variants(id),
  kind text not null,
  qty int not null, ref_id uuid, note text,
  created_by uuid references profiles(id), created_at timestamptz not null default now()
);

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  supplier text, status text default 'ordered', total bigint, ordered_on date, received_on date
);

create table merch_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  member_id uuid references members(id), buyer_name text not null, buyer_email text not null,
  total bigint not null, status order_status not null default 'placed',
  payment_status payment_status not null default 'pending',
  fulfilment text default 'collect', created_at timestamptz not null default now()
);

create table merch_order_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  order_id uuid not null references merch_orders(id),
  variant_id uuid not null references product_variants(id),
  qty int not null check (qty > 0), unit_price bigint not null
);
