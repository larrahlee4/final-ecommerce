-- Ensure payment confirmation fields are always populated for paid/confirmed orders.
-- Safe to run multiple times.

create or replace function public.sync_order_payment_confirmation_fields()
returns trigger
language plpgsql
as $$
begin
  if new.payment_status in ('paid', 'confirmed') then
    new.payment_confirmed_at := coalesce(new.payment_confirmed_at, old.payment_confirmed_at, now());
    new.payment_confirmed_by := coalesce(new.payment_confirmed_by, old.payment_confirmed_by, auth.uid());
  else
    new.payment_confirmed_at := null;
    new.payment_confirmed_by := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_order_payment_confirmation_fields on public.orders;
create trigger trg_sync_order_payment_confirmation_fields
before insert or update of payment_status, payment_confirmed_at, payment_confirmed_by
on public.orders
for each row
execute function public.sync_order_payment_confirmation_fields();

-- Backfill existing rows so paid/confirmed orders have timestamps.
update public.orders
set payment_confirmed_at = coalesce(payment_confirmed_at, created_at)
where payment_status in ('paid', 'confirmed')
  and payment_confirmed_at is null;

-- If payment_confirmed_by is still null for paid/confirmed rows, use order owner as fallback.
-- This guarantees a value in legacy rows where admin actor was not captured.
update public.orders
set payment_confirmed_by = coalesce(payment_confirmed_by, user_id)
where payment_status in ('paid', 'confirmed')
  and payment_confirmed_by is null;

alter table if exists public.orders
  drop constraint if exists orders_payment_confirmation_fields_check;

alter table if exists public.orders
  add constraint orders_payment_confirmation_fields_check
  check (
    (
      payment_status = 'pending'
      and payment_confirmed_at is null
      and payment_confirmed_by is null
    )
    or
    (
      payment_status in ('paid', 'confirmed')
      and payment_confirmed_at is not null
      and payment_confirmed_by is not null
    )
  );
