-- Orders + order_items tables for checkout/profile transaction storage.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  address text not null,
  notes text not null default '',
  billing text not null default 'standard',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  image_url text,
  price numeric(12,2) not null default 0,
  qty integer not null default 1 check (qty > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
on public.orders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
on public.orders
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can read own order items" on public.order_items;
create policy "Users can read own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own order items" on public.order_items;
create policy "Users can insert own order items"
on public.order_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);
