-- Remove payment_confirmed_by and enforce auto-confirm fields without actor tracking.
-- Safe to run multiple times.

alter table if exists public.orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_confirmed_at timestamptz;

alter table if exists public.orders
  drop column if exists payment_confirmed_by;

create or replace function public.sync_order_payment_confirmation_fields()
returns trigger
language plpgsql
as $$
begin
  if new.payment_status in ('paid', 'confirmed') then
    new.payment_confirmed_at := coalesce(new.payment_confirmed_at, old.payment_confirmed_at, now());
  else
    new.payment_confirmed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_order_payment_confirmation_fields on public.orders;
create trigger trg_sync_order_payment_confirmation_fields
before insert or update of payment_status, payment_confirmed_at
on public.orders
for each row
execute function public.sync_order_payment_confirmation_fields();

-- Convert existing pending rows to confirmed to match new automatic confirmation behavior.
update public.orders
set payment_status = 'confirmed',
    payment_confirmed_at = coalesce(payment_confirmed_at, created_at)
where payment_status = 'pending';

update public.orders
set payment_confirmed_at = coalesce(payment_confirmed_at, created_at)
where payment_status in ('paid', 'confirmed')
  and payment_confirmed_at is null;

alter table if exists public.orders
  drop constraint if exists orders_payment_confirmation_fields_check;

alter table if exists public.orders
  add constraint orders_payment_confirmation_fields_check
  check (
    (
      payment_status = 'pending'
      and payment_confirmed_at is null
    )
    or
    (
      payment_status in ('paid', 'confirmed')
      and payment_confirmed_at is not null
    )
  );
