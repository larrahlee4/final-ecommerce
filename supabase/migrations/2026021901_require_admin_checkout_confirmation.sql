-- Enforce admin confirmation workflow for checkout orders.
-- Customers can create orders, but they must start as pending.
-- Safe to run multiple times.

create or replace function public.enforce_customer_order_pending_confirmation()
returns trigger
language plpgsql
as $$
declare
  jwt_role text;
  is_admin boolean;
begin
  jwt_role := coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  );
  is_admin := jwt_role = 'admin';

  if tg_op = 'INSERT' and not is_admin then
    new.payment_status := 'pending';
    new.payment_confirmed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_customer_order_pending_confirmation on public.orders;
create trigger trg_enforce_customer_order_pending_confirmation
before insert on public.orders
for each row
execute function public.enforce_customer_order_pending_confirmation();

-- Tighten customer insert policy so direct inserts must also be pending.
drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
on public.orders
for insert
to authenticated
with check (
  auth.uid() = user_id
  and payment_status = 'pending'
  and payment_confirmed_at is null
);
