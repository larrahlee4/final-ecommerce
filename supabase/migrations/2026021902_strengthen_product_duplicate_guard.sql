-- Strengthen duplicate guard for active products.
-- Rule:
-- 1) Product name alone must be unique when creating a base (no-variant) item.
-- 2) For variant items, (name + variant) must be unique.
-- 3) A variant item cannot coexist with a base item of the same name.
-- Safe to run multiple times.

create or replace function public.prevent_duplicate_active_products()
returns trigger
language plpgsql
as $$
declare
  new_name text := lower(btrim(coalesce(new.name, '')));
  new_variant text := lower(btrim(coalesce(new.variant, '')));
begin
  if coalesce(new.is_archived, false) then
    return new;
  end if;

  if exists (
    select 1
    from public.products p
    where p.id <> coalesce(new.id, '')
      and coalesce(p.is_archived, false) = false
      and lower(btrim(coalesce(p.name, ''))) = new_name
      and (
        new_variant = ''
        or lower(btrim(coalesce(p.variant, ''))) = ''
        or lower(btrim(coalesce(p.variant, ''))) = new_variant
      )
  ) then
    raise exception using
      errcode = '23505',
      message = 'Duplicate active product is not allowed.';
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
