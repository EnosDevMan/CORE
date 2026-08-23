-- Run after supabase/schema.sql in a disposable database.
begin;

do $$
declare
  v_roles text[];
begin
  select array_agg(value order by sort_order)
  into v_roles
  from (
    select enumlabel::text as value, enumsortorder as sort_order
    from pg_enum
    where enumtypid = 'public.user_role'::regtype
  ) roles;

  if v_roles <> array['owner', 'manager', 'receptionist', 'professional', 'customer'] then
    raise exception 'Unexpected user_role values: %', v_roles;
  end if;

  if exists(select 1 from public.profiles where role::text in ('admin', 'barber')) then
    raise exception 'Legacy application roles remain in profiles.';
  end if;
end;
$$;

rollback;
