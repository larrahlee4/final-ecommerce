-- Soft-delete products, duplicate guard, and admin payment workflow updates.
-- Safe to run multiple times.

alter table if exists public.products
  add column if not exists variant text not null default '',
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz;

create or replace function public.prevent_duplicate_active_products()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.is_archived, false) then
    return new;
  end if;

  if exists (
    select 1
    from public.products p
    where p.id <> coalesce(new.id, '')
      and coalesce(p.is_archived, false) = false
      and lower(btrim(p.name)) = lower(btrim(new.name))
      and lower(btrim(coalesce(p.variant, ''))) = lower(btrim(coalesce(new.variant, '')))
  ) then
    raise exception using
      errcode = '23505',
      message = 'Duplicate active product (same name and variant) is not allowed.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_duplicate_active_products on public.products;
create trigger trg_prevent_duplicate_active_products
before insert or update of name, variant, is_archived
on public.products
for each row
execute function public.prevent_duplicate_active_products();

alter table if exists public.orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_confirmed_by uuid references auth.users(id),
  add column if not exists address_json jsonb not null default '{}'::jsonb;

alter table if exists public.orders
  drop constraint if exists orders_payment_status_check;

alter table if exists public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'confirmed'));

-- Admin helpers for RLS policies.
create or replace function public.is_admin_from_jwt()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
$$;

drop policy if exists "Admins can read all orders" on public.orders;
create policy "Admins can read all orders"
on public.orders
for select
to authenticated
using (public.is_admin_from_jwt());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders
for update
to authenticated
using (public.is_admin_from_jwt())
with check (public.is_admin_from_jwt());

drop policy if exists "Admins can read all order items" on public.order_items;
create policy "Admins can read all order items"
on public.order_items
for select
to authenticated
using (public.is_admin_from_jwt());
